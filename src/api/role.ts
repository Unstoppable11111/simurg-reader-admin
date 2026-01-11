import { http } from "@/utils/http"; // 假设你使用的是 pure-admin 默认的封装
// 如果是标准 axios 改为: import axios from "axios";

/** 权限类型：A-按钮、M-菜单 */
export type PermissionType = "A" | "M";

/** 权限对象属性 */
export interface PermissionItem {
  roleKey?: string;
  permissionId?: number;
  permKey?: string;
  permissionDescription?: string;
  type?: PermissionType;
  parentId?: number;
  childPermissions?: Array<PermissionItem>;
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

  /** 2. 根据角色标识获取权限列表 */
  getPermissionsList(roleKey: string) {
    return http.request<Result<PermissionItem[]>>(
      "get",
      `/admin/role-permission/permissions_by_role/${roleKey}`
    );
  },

  /** 3. 创建角色权限关联（单个） */
  createRelation(data: { roleKey: string; permissionId: number }) {
    return http.request<Result<string>>(
      "post",
      "/admin/role-permission/create",
      { data }
    );
  },

  /** 4. 批量创建角色权限关联 */
  batchCreateRelation(roleKey: string, permissionIds: number[]) {
    return http.request<Result<string>>(
      "post",
      `/admin/role-permission/batch-create/${roleKey}`,
      { data: permissionIds }
    );
  },

  /** 5. 删除角色权限关联（单个） */
  deleteRelation(roleKey: string, permissionId: number) {
    return http.request<Result<string>>(
      "post",
      `/admin/role-permission/delete/${roleKey}/${permissionId}`
    );
  },

  /** 6. 批量删除角色权限关联 */
  batchDeleteRelation(roleKey: string, permissionIds: number[]) {
    return http.request<Result<string>>(
      "post",
      `/admin/role-permission/batch-delete/${roleKey}`,
      { data: permissionIds }
    );
  },

  /** 7. 获取当前登录用户权限树 */
  getCurrentUserPermissionsTree() {
    return http.request<Result<PermissionItem[]>>(
      "get",
      "/admin/role-permission/current-user-permissions-tree"
    );
  }
};
