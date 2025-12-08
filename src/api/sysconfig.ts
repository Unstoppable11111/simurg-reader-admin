// api/SysConfig.ts
import { http } from "@/utils/http";

// 4. 请求方法
export const getSysConfigList = (data?: object) => {
  return http.request("post", "/admin/system/config/list", { data });
};
export const addSysConfigList = (data?: object) => {
  return http.request("post", "/admin/system/config/create", { data });
};
export const editSysConfigList = (data?: object) => {
  return http.request("post", "/admin/system/config/set", { data });
};
export const delSysConfigList = (configKey: string) => {
  return http.request("post", `/admin/system/config/${configKey}`);
};
export const batchDeleteSysConfig = (data: string[]) => {
  return http.request("post", `/admin/system/config/batch-delete`, { data });
};
export const batchGetSysConfig = (data: string[]) => {
  return http.request("post", `/admin/system/config/batch-get`, { data });
};