import { http } from "@/utils/http";

/** 敏感词数据项 */
export interface SensitiveWordItem {
  id?: number;
  word: string;
  level: number;
  type: number;
  replaceWord?: string;
  status: number;
  createTime?: string;
  updateTime?: string;
}

/** 列表查询参数 (最新接口为 POST Body) */
export interface SensitiveListParams {
  page?: number;
  size?: number;
  word?: string;
  level?: number;
  type?: number;
  status?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

interface BaseResult<T> {
  code: number;
  msg: string;
  data: T;
}

/** 1. 获取敏感词列表 (已更新为 POST) */
export const getSensitiveList = (data: SensitiveListParams) => {
  return http.request<BaseResult<any>>("post", "/admin/sensitive-word/list", {
    data
  });
};

/** 2. 添加敏感词 */
export const addSensitiveWord = (data: SensitiveWordItem) => {
  return http.request<BaseResult<boolean>>(
    "post",
    "/admin/sensitive-word/add",
    { data }
  );
};

/** 3. 更新敏感词 */
export const updateSensitiveWord = (data: SensitiveWordItem) => {
  return http.request<BaseResult<boolean>>(
    "post",
    "/admin/sensitive-word/update",
    { data }
  );
};

/** 4. 删除敏感词 (批量删除) */
export const deleteSensitiveWords = (ids: number[]) => {
  return http.request<BaseResult<boolean>>(
    "post",
    "/admin/sensitive-word/delete",
    { data: { ids } }
  );
};

/** 5. 重新加载缓存 */
export const reloadSensitiveCache = () => {
  return http.request<BaseResult<boolean>>(
    "post",
    "/admin/sensitive-word/reload-cache"
  );
};
