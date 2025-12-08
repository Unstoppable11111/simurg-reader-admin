// api/Category.ts
import { http } from "@/utils/http";

// 4. 请求方法
export const getCategoryList = (data?: object) => {
  return http.request("post", "/admin/category/list", { data });
};
export const addCategoryList = (data?: object) => {
  return http.request("post", "/admin/category/create", { data });
};
export const editCategoryList = (data?: object) => {
  return http.request("post", "/admin/category/update", { data });
};
export const delCategoryList = (id: number) => {
  return http.request("delete", `/admin/category/${id}`);
};
