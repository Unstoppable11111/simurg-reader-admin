// src/api/admin-book.ts

import { http } from "@/utils/http"; // 假设这是您的请求工具

// --- I. 通用类型定义 (后台管理系统) ---

/**
 * 基础 API 响应结构
 * T: 业务数据 data 的类型
 */
export interface AdminApiResponse<T = any> {
  code?: number; // 状态码（200=成功）
  msg?: string; // 描述信息
  data?: T; // 业务数据
}

/**
 * 后台分页结构
 */
export interface AdminPaginatedResult<T> {
  records?: T[]; // 当前页数据
  total?: number; // 总记录数
  size?: number; // 每页大小
  page?: number; // 当前页码
  pages?: number; // 总页数
  hasNext?: boolean; // 是否有下一页
  hasPrevious?: boolean; // 是否有上一页
}

// --- II. 数据结构和请求参数 ---

/**
 * 书籍分类信息 (用于详情接口)
 */
export interface AdminBookCategoryDetail {
  categoryId?: number; // 分类唯一标识
  categoryName?: string; // 分类名称
  categoryDescription?: string; // 分类描述
  iconImageUrl?: string; // icon图片URL
  coverImageUrl?: string; // 封面图片URL
  sortOrder?: number; // 排序序号
}

/**
 * 作者信息 (用于列表接口)
 */
export interface AdminAuthorInfo {
  userId?: number; // 关联users表中的作者user_id
  penName?: string; // 作者笔名
  authorType?: 0 | 1; // 作者类型（0-独家 1-非独家）
  country?: string; // 作者所在国家
  registTime?: string; // 作者注册时间
  signingStatus?: 0 | 1; // 签约状态（0-未签约 1-已签约）
  firstSigningTime?: string; // 首次作品签约时间
  bookCount?: number; // 作品总数量
  publishedBookCount?: number; // 已发布作品总数量
  signedWorksCount?: number; // 已签约作品数量
  totalCompletedWords?: number; // 累计完成字数
  authorLevel?: number; // 作者等级
}

/**
 * POST /admin/book/list 请求参数 (保持不变，筛选仍使用 categoryId)
 */
export interface AdminBookListParams {
  page?: number; // 当前页码，从1开始 (默认1)
  size?: number; // 每页大小 (默认10)
  orderBy?: string; // 排序字段
  orderDirection?: "asc" | "desc"; // 排序方式
  bookId?: number; // 书籍ID
  title?: string; // 书籍标题
  authorId?: number; // 作者ID
  penName?: string; // 书籍作者笔名
  description?: string; // 书籍描述
  categoryId?: number; // 作品分类ID（列表筛选时通常只筛选一个分类）
  language?: string; // 作品语言
  isFree?: 0 | 1; // 是否免费（0-否 1-是）
  bookStatus?: 0 | 1 | 2 | 3; // 书籍状态
  serialStatus?: 0 | 1; // 书籍连载状态
  isSigned?: 0 | 1; // 是否签约
}

/**
 * 书籍列表项 (POST /admin/book/list 返回的 records item) (保持不变)
 */
export interface AdminBookListItem {
  bookId?: number; // 书籍唯一标识
  title?: string; // 书籍标题
  language?: string; // 作品语言
  serialStatus?: 0 | 1; // 书籍连载状态（0-连载中 1-已完结）
  totalWordCountPublished?: number; // 书籍总字数（已发布）
  rating?: number; // 书籍评分，保留一位小数
  bookViews?: number; // 书籍浏览量
  totalFavorites?: number; // 累计收藏数
  authorInfo?: AdminAuthorInfo; // 书籍作者信息
  bookCategoryResponseList?: AdminBookCategoryDetail[]; // 作品分类 (保持数组)
}

/**
 * 书籍详情 (GET /admin/book/detail/{bookId} 返回) (新增字段)
 */
export interface AdminBookDetail {
  bookId?: number; // 书籍唯一标识
  title?: string; // 书籍标题
  authorId?: number; // 作者ID
  description?: string; // 书籍描述
  coverImageUrl?: string; // 书籍封面图片URL
  publishDate?: string; // 书籍发布日期
  bookStatus?: 0 | 1 | 2 | 3; // 书籍状态
  serialStatus?: 0 | 1; // 书籍连载状态
  bookViews?: number; // 书籍浏览量
  totalFavorites?: number; // 累计收藏数
  rating?: number; // 书籍评分
  bookCategoryResponseList?: AdminBookCategoryDetail[]; // 作品分类 (保持数组)
  languagestring?: string; // 作品语言
  isFree?: 0 | 1; // 是否免费（0-否 1-是）
  isSigned?: 0 | 1; // 是否签约（0-否 1-是）
  totalChapters?: number; // 书籍总章节数
  currentChapter?: number; // 当前连载到的章节号
  protagonistIntroduction?: string; // 新增：主角介绍
  authorTestimonial?: string; // 新增：作者的感言
}

/**
 * POST /admin/book/create 创建新书籍参数
 * 📢 修改: categoryIdList, protagonistIntroduction, authorTestimonial
 */
export interface AdminCreateBookParams {
  title: string; // 必须
  description: string; // 必须
  protagonistIntroduction?: string; // 非必须
  categoryIdList: number[]; // 必须：作品分类ID列表
  language: string; // 必须
  isFree: 0 | 1; // 必须
  coverImageUrl: string; // 必须
  chapterTitle: string; // 必须
  chapterContent: string; // 必须
  authorTestimonial?: string; // 非必须
}

/**
 * POST /admin/book/update 更新书籍信息参数
 * 📢 修改: categoryList, protagonistIntroduction, authorTestimonial
 */
export interface AdminUpdateBookParams {
  bookId: number; // 必须
  title?: string;
  description?: string;
  coverImageUrl?: string;
  standByImage1Url?: string; // 备用1图片URL
  standByImage2Url?: string; // 备用2图片URL
  publishDate?: string; // 书籍发布日期
  language?: string;
  isFree?: 0 | 1;
  isSigned?: 0 | 1;
  protagonistIntroduction?: string; // 非必须
  authorTestimonial?: string; // 非必须
  categoryList?: number[]; // 非必须：作品分类ID列表
}

/**
 * POST /admin/book/update_status 更新书籍状态参数 (保持不变)
 */
export interface AdminUpdateStatusParams {
  bookId: number; // 必须
  bookStatus?: 0 | 1 | 2 | 3; // 书籍状态
  serialStatus?: 0 | 1; // 书籍连载状态
}

// --- III. API 请求函数 (保持不变，因为只修改了类型定义) ---

/** 1. 获取书籍列表（分页） */
export const getAdminBookList = (
  data: AdminBookListParams
): Promise<AdminApiResponse<AdminPaginatedResult<AdminBookListItem>>> => {
  return http.request("post", "/admin/book/list", { data });
};

/** 2. 根据ID获取书籍详情 */
export const getAdminBookDetail = (
  bookId: number
): Promise<AdminApiResponse<AdminBookDetail>> => {
  return http.request("get", `/admin/book/detail/${bookId}`);
};

/** 3. 创建新书籍（需要管理员权限） */
export const adminCreateBook = (
  data: AdminCreateBookParams
): Promise<AdminApiResponse<number>> => {
  return http.request("post", "/admin/book/create", { data });
};

/** 4. 更新书籍信息（需要管理员权限） */
export const adminUpdateBookInfo = (
  data: AdminUpdateBookParams
): Promise<AdminApiResponse<number>> => {
  return http.request("post", "/admin/book/update", { data });
};

/** 5. 删除书籍（需要管理员权限） */
export const adminDeleteBook = (
  bookId: number
): Promise<AdminApiResponse<string>> => {
  return http.request("post", `/admin/book/delete/${bookId}`);
};

/** 6. 更新书籍状态（需要管理员权限） */
export const adminUpdateBookStatus = (
  data: AdminUpdateStatusParams
): Promise<AdminApiResponse<string>> => {
  return http.request("post", "/admin/book/update_status", { data });
};

/** 7. 导出书籍列表为Excel文件（需要管理员权限） */
export const adminExportBook = (
  data: number[] // 书籍ID列表
): Promise<AdminApiResponse<any>> => {
  return http.request(
    "post",
    "/admin/book/book/export",
    { data },
    { responseType: "blob" }
  );
};

/** 8. 导入书籍列表（需要管理员权限） */
export const adminImportBook = (
  data: FormData
): Promise<AdminApiResponse<string>> => {
  return http.request("post", "/admin/book/book/import", {
    data, // 这里的 data 会直接对应请求体
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 9. 下载导出模板 */
export const adminBookdown_template = () => {
  return http.request("get", "admin/book/down_template");
};
