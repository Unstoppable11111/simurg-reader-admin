import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken, removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessage } from "element-plus";

// 相关配置
const defaultConfig: AxiosRequestConfig = {
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** token过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新token */
  private static isRefreshing = false;

  /** 🟢 防止并发请求导致的无限重定向闪烁 */
  private static isRedirecting = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前Axios实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        const whiteList = ["/refresh-token", "/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
              // 优先保留请求显式配置的 Authorization（例如登录过程中获取用户信息所传的新 Token）
              if (config.headers?.["Authorization"]) {
                return resolve(config);
              }

              const data = getToken();
              if (data) {
                config.headers["Authorization"] = formatToken(
                  data.accessToken
                );
                config.headers["RefreshToken"] = data.refreshToken;
                resolve(config);
              } else {
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        const data = response.data;

        // 业务层级的错误处理 (HTTP状态码为200，但code非200)
        if (data && typeof data === "object" && "code" in data) {
          if (data.code !== 200) {
            const isAsyncRoute = $config.url?.includes("/get-async-routes");
            if (!isAsyncRoute) {
              // 🟢 优化：先关闭所有，只显示最新的一条错误
              ElMessage.closeAll();
              ElMessage.error(data.msg || "系统异常");
            }
          }
        }

        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        // 🟢 处理 HTTP 401 登录态失效
        if ($error.response && $error.response.status === 401) {
          const data = $error.response.data;
          const isAtLogin = window.location.href.includes("/login");

          // 任何 401 均代表凭证已失效，立即彻底清理本地缓存
          removeToken();

          // 如果不在登录页 且 没有正在执行跳转
          if (!isAtLogin && !PureHttp.isRedirecting) {
            PureHttp.isRedirecting = true; // 加锁

            ElMessage.closeAll();
            ElMessage.error(data?.msg || "登录已失效，请重新登录");

            useUserStoreHook().logOut();

            // 延迟跳转，给提示留出显示时间，并防止闪烁
            setTimeout(() => {
              window.location.replace("/login");
              PureHttp.isRedirecting = false; // 解锁
            }, 300);
          }
          return Promise.reject($error);
        }

        // 非取消请求的普通网络错误
        if (!$error.isCancelRequest) {
          ElMessage.closeAll();
          ElMessage.error($error.message || "网络请求失败");
        }

        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: any) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的post工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的get工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
