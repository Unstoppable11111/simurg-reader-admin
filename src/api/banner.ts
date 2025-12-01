// api/banner.ts
import { http } from "@/utils/http";

// 1. 定义 Banner 数据项
export interface BannerItem {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  sort: number;
  status: 0 | 1;
  createTime: string;
}

// 2. 定义分页结构
export interface PageData<T> {
  records?: T[];
  total?: number;
  size?: number;
  page?: number;
  pages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// 3. 定义 API 返回类型
export type BannerListResponse = {
  code: number;
  msg: string;
  data: PageData<BannerItem>;
};

// 4. 请求方法
export const getBannerList = (data?: object) => {
  return http.request<BannerListResponse>("post", "/admin/banner/page", { data });
};
export const addBannerList = (data?: object) => {
  return http.request<BannerListResponse>("post", "/admin/banner/create", { data });
};
export const editBannerList = (data?: object) => {
  return http.request<BannerListResponse>("post", "/admin/banner/update", { data });
};
export const delBannerList = (id: number) => {
  return http.request<BannerListResponse>("post", `/admin/banner/delete/${id}`);
};