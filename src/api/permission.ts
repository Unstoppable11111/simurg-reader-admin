import { http } from "@/utils/http";

/** 权限数据项结构 */
export interface PermissionItem {
  /** 权限ID */
  id?: number;
  /** 权限标识 (如: sys:user:add) */
  permKey: string;
  /** 权限描述 */
  description: string;
  /** 权限类型: A-按钮、M-菜单 */
  type: "A" | "M";
  /** 父级权限ID，0表示顶级权限 */
  parentId: number;
  /** 创建时间 */
  createDate?: string;
  /** 更新时间 */
  updateDate?: string;
  /** icon 图标 */
  icon?: string | null;
  /** 子权限列表 */
  childPermissions?: PermissionItem[];

  // 菜单相关字段
  menuType?: number;
  name?: string;
  component?: string;
  rank?: number;
  redirect?: string;
  extraIcon?: string;
  enterTransition?: string;
  leaveTransition?: string;
  activePath?: string;
  auths?: string;
  frameSrc?: string;
  frameLoading?: boolean;
  keepAlive?: boolean;
  hiddenTag?: boolean;
  fixedTag?: boolean;
  showLink?: boolean;
  showParent?: boolean;
}

/** 权限列表查询参数 */
export interface PermissionListParams {
  page?: number;
  size?: number;
  id?: number;
  permKey?: string;
  description?: string;
  type?: "A" | "M";
  parentId?: number;
  /** icon 图标 */
  icon?: string | null;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/** 通用返回格式 */
interface BaseResult<T> {
  code: number;
  msg: string;
  data: T;
}

/** 1. 获取权限树结构 */
export const getPermissionTree = () => {
  return http.request<BaseResult<PermissionItem[]>>(
    "get",
    "/admin/permission/tree"
  );
};

// /** 2. 获取权限列表（分页） */
// export const getPermissionList = (data: PermissionListParams) => {
//   return http.request<BaseResult<any>>("post", "/admin/permission/list", {
//     data
//   });
// };

/** 3. 根据ID获取权限详情 */
export const getPermissionDetail = (id: number) => {
  return http.request<BaseResult<PermissionItem>>(
    "get",
    `/admin/permission/detail/${id}`
  );
};

/** 4. 创建新权限 */
export const createPermission = (data: PermissionItem) => {
  return http.request<BaseResult<number>>("post", "/admin/permission/create", {
    data
  });
};

/** 5. 更新权限信息 */
export const updatePermission = (data: PermissionItem) => {
  return http.request<BaseResult<number>>("post", "/admin/permission/update", {
    data
  });
};

/** 6. 删除权限 */
export const deletePermission = (id: number) => {
  return http.request<BaseResult<string>>(
    "post",
    `/admin/permission/delete/${id}`
  );
};
