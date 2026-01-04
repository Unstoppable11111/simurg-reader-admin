import { http } from "@/utils/http";

/** 评分记录项类型定义 */
export interface RatingItem {
  /** 评分记录唯一标识 */
  ratingId: string | number;
  /** 评分用户ID */
  userId: string | number;
  /** 被评分书籍ID */
  bookId: string | number;
  /** 评分值，保留一位小数 */
  rating: number;
}

/** 获取评分列表请求参数 */
export interface RatingListParams {
  /** 当前页码，从1开始 */
  page?: number;
  /** 每页大小 */
  size?: number;
  /** 排序字段 */
  orderBy?: string;
  /** 排序方式（asc/desc） */
  orderDirection?: "asc" | "desc";
  /** 评分用户ID */
  userId?: string | number;
  /** 被评分书籍ID */
  bookId?: string | number;
}

/** 评分列表返回结果类型 */
export interface RatingListResult {
  code: number;
  msg: string;
  data: {
    records: RatingItem[];
    total: number;
    size: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/** * 获取管理端评分列表
 * 接口路径：POST /admin/rating/list
 */
export const getAdminRatingList = (data?: RatingListParams) => {
  return http.request<RatingListResult>("post", "/admin/rating/list", { data });
};
