import { http } from "@/utils/http";

export type UserResult = {
  code: number;
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type logoutResult = {
  code: number;
  data: string;
  msg: string;
};

/** 登录 */
export const getLogin = (data?: object) => {
  console.log("调用登录接口，参数：", data);
  return http.request<UserResult>("post", "/admin/auth/login", { data });
};

export const getLogout = (data?: object) => {
  console.log("调用登出接口，参数：", data);

  // 1. 获取 Token（从之前的 Token 存储中获取）
  const token = data?.accessToken;

  // 2. 设置请求头（通常需要 Authorization 字段）
  const headers = {
    "Content-Type": "application/json", // 默认 JSON 格式
    authorities: token ? `${token}` : "" // 添加 Token 认证
  };

  // 3. 在请求中传入 headers
  return http.request<logoutResult>("post", "/admin/auth/logout", {
    data,
    headers // 传入自定义请求头
  });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};
