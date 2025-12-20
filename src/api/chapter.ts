import { http } from "@/utils/http";

/** 章节列表项数据结构 */
export interface ChapterListItem {
  id?: number;
  bookId: number | string;
  chapterId: number;
  chapterName: string;
  chapterNumber: number;
  wordCount: number;
  status: number; // 0: 待审核, 1: 已发布, 2: 下架
  createTime?: string;
  updateTime?: string;
}

/** 章节详情数据结构 */
export interface ChapterDetail extends ChapterListItem {
  content: string; // 章节正文
}

/** 章节列表请求参数 */
export interface ChapterListParams {
  bookId: number;
  page?: number;
  size?: number;
}

/** 创建/更新章节参数 */
export interface ChapterParams {
  bookId: number;
  chapterName: string;
  content: string;
  chapterNumber?: number;
  isVip?: number; // 0: 免费, 1: VIP
}

/** 状态流转参数 */
export interface ChapterStatusParams {
  bookId: number | string;
  chapterId: number;
  bookChaptersStatus: number;
}

/** 基础返回结构 (根据项目实际 BaseResult 修改) */
export interface Result<T = any> {
  code: number;
  msg: string;
  data: T;
}

/** 1. 获取书籍的章节列表 */
export const getAdminChapterList = (data: ChapterListParams) => {
  return http.request<Result>("post", "/admin/chapter/list", { data });
};

/** 2. 根据 ID 获取章节详情 */
export const getAdminChapterDetail = (
  bookId: number | string,
  chapterId: number
) => {
  return http.request<Result<ChapterDetail>>(
    "get",
    `/admin/chapter/get/${bookId}/${chapterId}`
  );
};

/** 3. 创建新章节 */
export const adminCreateChapter = (data: ChapterParams) => {
  return http.request<Result<number>>("post", "/admin/chapter/create", {
    data
  });
};

/** 4. 更新章节信息 */
export const adminUpdateChapter = (
  data: Partial<ChapterParams> & { chapterId: number }
) => {
  return http.request<Result>("post", "/admin/chapter/update", { data });
};

/** 5. 删除章节 */
export const adminDeleteChapter = (
  bookId: number | string,
  chapterId: number
) => {
  return http.request<Result>(
    "post",
    `/admin/chapter/delete/${bookId}/${chapterId}`
  );
};

/** 6. 章节状态流转（审核、上下架） */
export const adminUpdateChapterStatus = (data: ChapterStatusParams) => {
  return http.request<Result>("post", "/admin/chapter/status", { data });
};

/** 7. 导入章节信息 (上传文件) */
export const adminImportChapters = (data: FormData) => {
  return http.request<Result>("post", "/admin/chapter/import", {
    data,
    headers: { "Content-Type": "multipart/form-data" }
  });
};

/** 8. 更新章节序号 (排序) */
export const adminUpdateChapterNumber = (data: {
  bookId: number | string;
  chapterId: number;
  newChapterNumber: number;
}) => {
  return http.request<Result>("post", "/admin/chapter/update/chapter_number", {
    data
  });
};

/** 9. 下载导出模板 */
export const adminChapterdown_template = () => {
  return http.request<Result>("get", "admin/chapter/down_template");
};
