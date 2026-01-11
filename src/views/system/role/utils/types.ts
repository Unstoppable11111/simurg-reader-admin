// 虽然字段很少 但是抽离出来 后续有扩展字段需求就很方便了

/**
 * 表单字段类型定义
 */
export interface FormItemProps {
  /** 角色名称 */
  name: string;
  /** 角色标识 */
  code: string;
  /** 备注 */
  remark: string;
}

/**
 * 表单整体类型
 */
export interface FormProps {
  formInline: FormItemProps;
}

/**
 * 角色数据类型定义（通常用于表格、接口返回）
 */
export interface RoleItem {
  /** 角色标识 */
  roleKey: string;
  /** 角色名称 */
  roleName: string;
  /** 状态：1正常 0停用 */
  status: number;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
}
