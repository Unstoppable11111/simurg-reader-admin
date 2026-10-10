import { http } from "@/utils/http";
import { removeToken } from "@/utils/auth";

export type UserResult = {
  success?: boolean;
  msg: string;
  code: number;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    account: string;
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

export type UserInfo = {
  /** 头像 */
  avatar: string;
  /** 用户名 */
  account: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 联系电话 */
  phone: string;
  /** 简介 */
  description: string;
};

export type UserInfoResult = {
  success: boolean;
  data: UserInfo;
};
export type logoutResult = {
  code: number;
  data: string;
  msg: string;
};
type ResultTable = {
  success: boolean;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

export type UserInfoData = {
  code?: number;
  msg?: string;
  data?: {
    id?: number;
    userId?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    pictureUrl?: string;
    createDate?: string;
    updateDate?: string;
    authId?: number;
    authType?: number;
    authKey?: string;
    authSecret?: string;
    verified?: number;
    authCreateDate?: string;
    authUpdateDate?: string;
    roles?: string[];
  };
}
// 将两个接口数据合并返回，后续可能需要在仓库中新存数据，如头像账户名等
export const getLogin = async (data?: object): Promise<UserResult> => {
  console.log("调用登录接口，参数：", data);

  // 1. 登录
  const loginRes = await http.request<UserResult>("post", "/admin/auth/login", { data });

  if (loginRes.code !== 200) {
    return loginRes; // 登录失败直接返回
  }

  // 2. 获取用户信息（注意：这个接口也返回 { code, msg, data }）
  try {
    const userInfoRes = await http.request<UserResult>("get", "/admin/sys/user/info", {}, {
      headers: {
        Authorization: loginRes.data.accessToken,
        RefreshToken: loginRes.data.refreshToken
      }
    });

    if (userInfoRes.code !== 200) {
      removeToken();
      throw new Error(userInfoRes.msg || "获取用户信息失败");
    }

    // 3. 合并：loginRes.data + userInfoRes.data
    const mergedData = {
      ...loginRes.data,      // token 相关
      ...userInfoRes.data    // 用户详情（这才是真正的用户对象）
    };

    // 4. 返回统一的成功结构
    return {
      code: 200,
      msg: "登录成功",
      data: mergedData
    };
  } catch (error) {
    removeToken();
    throw error;
  }
};

// export const getUserInfo = () => {
//   return http.request<UserInfoData>("get", '/admin/sys/user/info')
// }


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
  return http.request<RefreshTokenResult>("post", "/admin/refresh-token", { data });
};

/** 账户设置-个人信息 */
export const getMine = (data?: object) => {
  return http.request<UserInfoResult>("get", "/admin/mine", { data });
};

/** 账户设置-个人安全日志 */
export const getMineLogs = (data?: object) => {
  return http.request<ResultTable>("get", "/admin/mine-logs", { data });
};
