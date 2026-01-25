import { http } from "@/utils/http";

/** 权限类型：A-按钮、M-菜单 */
export type PermissionType = "A" | "M";

/** 权限对象属性 */
export interface PermissionItem {
  permissionId: number;
  permKey: string;
  permissionDescription: string;
  type: PermissionType;
  parentId: number;
  /** 是否关联（该角色/用户是否拥有此权限） */
  hasAssociation: boolean;
  /** 子权限列表 */
  childPermissions: Array<PermissionItem>;
}

/** 通用返回结果封装 */
export interface Result<T = any> {
  code: number;
  msg: string;
  data: T;
}

/** 角色权限管理接口 */
export const RolePermissionApi = {
  /** 1. 根据角色标识获取权限树结构 */
  getPermissionsTree(roleKey: string) {
    return http.request<Result<PermissionItem[]>>(
      "get",
      `/admin/role-permission/permissions_tree_by_role/${roleKey}`
    );
  },

  /** 2. 创建角色权限关联（保存） */
  saveRolePermissions(data: { roleKey: string; permissionIdList: number[] }) {
    return http.request<Result<string>>("post", "/admin/role-permission/save", {
      data
    });
  },

  /** 3. 获取当前登录用户权限树 */
  getCurrentUserPermissionsTree() {
    return http.request<Result<PermissionItem[]>>(
      "get",
      "/admin/role-permission/current-user-permissions-tree"
    );
  }
};
