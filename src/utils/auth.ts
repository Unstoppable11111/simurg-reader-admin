import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（秒） */
  accessTokenExpires: string;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** `refreshToken`的过期时间（秒） */
  refreshTokenExpires: string;
  /** 来源，4-System管理后台 */
  source: string;
  userId: string;
  /** 头像 */
  // avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
  permissions?: Array<string>;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): DataInfo<number> {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return Cookies.get(TokenKey)
    ? JSON.parse(Cookies.get(TokenKey))
    : storageLocal().getItem(userKey);
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`、`refreshToken`这三条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这七条信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: DataInfo<string>) {
  const { accessToken, refreshToken, accessTokenExpires, refreshTokenExpires } = data;
  console.log("调用设置token方法，参数：", data);
  const userStore = useUserStoreHook();
  const { isRemembered, loginDay } = userStore;

  // 1. 计算 accessToken 的过期时间戳（当前时间 + 过期秒数 * 1000）
  const accessExpires = Date.now() + parseInt(accessTokenExpires) * 1000;
  // 2. 计算 refreshToken 的过期时间戳
  const refreshExpires = Date.now() + parseInt(refreshTokenExpires) * 1000;

  // 构造 Cookie 存储的内容
  const cookieString = JSON.stringify({
    accessToken,
    accessExpires,
    refreshToken,
    refreshExpires
  });

  // 设置 accessToken 的 Cookie（根据 accessExpires 计算过期天数）
  const accessCookieExpires = (accessExpires - Date.now()) / 86400000;
  Cookies.set(TokenKey, cookieString, {
    expires: accessCookieExpires > 0 ? accessCookieExpires : undefined
  });

  // 设置多标签页标识的 Cookie
  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? { expires: loginDay }
      : {}
  );

  // 处理用户信息存储（avatar、username 等）
  function setUserKey({ avatar, username, nickname, roles, permissions }) {
    userStore.SET_AVATAR(avatar);
    userStore.SET_USERNAME(username);
    userStore.SET_NICKNAME(nickname);
    userStore.SET_ROLES(roles);
    userStore.SET_PERMS(permissions);
    storageLocal().setItem(userKey, {
      refreshToken,
      accessExpires,
      refreshExpires,
      avatar,
      username,
      nickname,
      roles,
      permissions
    });
    console.log("存储用户信息：", storageLocal().getItem(userKey));
    console.log("userStore：", userStore);
  }

  // 有后端返回的 username/roles 时，直接用后端数据
  // if (data.username && data.roles) {
  if (data.userId) {
    setUserKey({
      avatar: data?.avatar ?? "",
      username: data.username,
      nickname: data?.nickname ?? "",
      roles: "admin",
      // permissions: data?.permissions ?? [],
      permissions: 'admin'
    });
  }
  // 否则从 localStorage 读取历史用户信息
  // else {
  const storedUser = storageLocal().getItem<DataInfo<string>>(userKey) || {};
  setUserKey({
    avatar: storedUser?.avatar ?? "",
    username: storedUser?.username ?? "",
    nickname: storedUser?.nickname ?? "",
    roles: storedUser?.roles ?? [],
    permissions: storedUser?.permissions ?? []
  });
  // }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
