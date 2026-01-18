import { http } from "@/utils/http";

/** 反馈详情数据结构 */
export interface FeedbackItem {
  id?: number;
  userId?: number;
  /** 反馈类型（1-建议 2-投诉 3-举报 4-其他） */
  feedbackType?: number;
  /** 联系方式（手机号/邮箱） */
  contactInfo?: string;
  /** 反馈内容 */
  content?: string;
  /** 截图URL */
  screenshotUrl?: string;
  /** 状态（0-待处理 1-处理中 2-已解决 3-已关闭） */
  status?: number;
  createDate?: string;
  updateDate?: string;
  handlerId?: number;
  /** 处理结果 */
  handleResult?: string;
}

/** 查询反馈列表请求参数 */
export interface FeedbackQuery extends Array<any> {
  page?: number;
  size?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  userId?: number;
  feedbackType?: number;
  status?: number;
}

/** 分页返回数据结构 */
export interface FeedbackListResult {
  records: FeedbackItem[];
  total: number;
  size: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** 统一响应体 */
export interface Result<T> {
  code: number;
  msg: string;
  data: T;
}

/** 查询反馈列表 */
export const getFeedbackList = (data?: FeedbackQuery) => {
  return http.request<Result<FeedbackListResult>>(
    "post",
    "/admin/feedback/list",
    { data }
  );
};

/** 根据ID获取反馈详情 */
export const getFeedbackDetail = (id: number | string) => {
  return http.request<Result<FeedbackItem>>("get", `/admin/feedback/${id}`);
};

/** 更新反馈状态 */
export const updateFeedbackStatus = (data: {
  id: number;
  status: number;
  handleResult: string;
}) => {
  return http.request<Result<boolean>>("post", "/admin/feedback/update", {
    data
  });
};

/** 删除反馈 */
export const deleteFeedback = (id: number | string) => {
  return http.request<Result<boolean>>("post", `/admin/feedback/delete/${id}`);
};
