import { http } from "@/utils/http";

/** 定义返回数据的统一格式 */
export interface Result<T = any> {
  code: number;
  msg: string;
  data: T;
}

/** 分页数据列表项项类型 (根据Mock结构) */
export interface CommentItem {
  commentId: number | string;
  bookId: number | string;
  chapterId?: number | string;
  userId: number | string;
  content: string;
  status: number; // 0:未发布 1:审核中 2:已发布 3:已下架
  createTime: string;
  // ... 其他根据后端实际返回的字段
}

/** 获取评论列表请求参数 */
export interface CommentListParams {
  page?: number;
  size?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  bookId?: number | string;
  chapterId?: number | string;
  userId?: number | string;
}

/** 1. 获取书籍/章节的所有评论 */
export const getAdminCommentList = (data?: CommentListParams) => {
  return http.request<Result>("post", "/admin/comment/list", { data });
};

/** 2. 更新评论状态 */
export interface UpdateCommentStatusParams {
  bookId: number | string;
  commentId: number | string;
  targetStatus: number; // 0 :未发布 1 :审核中 2 :已发布 3 :已下架
}

export const updateAdminCommentStatus = (data: UpdateCommentStatusParams) => {
  return http.request<Result>("post", "/admin/comment/status", { data });
};

/** 3. 删除评论 */
export const deleteAdminComment = (
  bookId: number | string,
  commentId: number | string
) => {
  return http.request<Result>(
    "delete",
    `/admin/comment/delete/${bookId}/${commentId}`
  );
};
