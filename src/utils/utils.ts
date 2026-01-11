/**
 * 将权限树数据转换为支持层级展开的表格格式
 * @param permissions 权限树数据
 * @param level 当前层级，默认为0
 * @returns 转换后的表格数据
 */
export function transformPermissionToTableFormat(
  permissions: Array<any>,
  level: number = 0
): Array<any> {
  const result = [];

  for (const item of permissions) {
    // 复制当前节点数据
    const row = { ...item };

    // 添加层级标识，用于表格显示缩进
    row.level = level;

    // 如果有子权限，则递归处理
    if (item.childPermissions && item.childPermissions.length > 0) {
      // 为有子节点的行添加hasChildren标识
      row.hasChildren = true;
      // 添加子节点数据并设置层级
      const children = transformPermissionToTableFormat(
        item.childPermissions,
        level + 1
      );
      result.push(row, ...children);
    } else {
      row.hasChildren = false;
      result.push(row);
    }
  }

  return result;
}

/**
 * 将权限数据转换为Pure Admin路由格式
 * @param permissions 权限树数据
 * @returns 路由格式数据
 */
export function transformPermissionToPureRoutes(
  permissions: Array<any>
): Array<any> {
  return permissions.map(permission => {
    const route: any = {
      id: permission.id,
      parentId: permission.parentId,
      path: permission.permKey.startsWith("/")
        ? permission.permKey
        : `/${permission.permKey}`,
      component: permission.type === "M" ? "Layout" : undefined,
      meta: {
        title: permission.description,
        icon: permission.icon || "",
        rank: 0,
        keepAlive: false,
        showLink: true
      }
    };

    if (permission.type === "A") {
      // 对于按钮类型的权限，可以特殊处理
      route.meta.isButton = true;
    }

    if (permission.childPermissions && permission.childPermissions.length > 0) {
      route.children = transformPermissionToPureRoutes(
        permission.childPermissions
      );
    }

    return route;
  });
}

/**
 * 将权限数据转换为Pure Admin菜单格式
 * @param permissions 权限树数据
 * @returns Pure Admin菜单格式数据
 */
export function transformPermissionToPureMenus(
  permissions: Array<any>
): Array<any> {
  return permissions.map(permission => {
    // 确保菜单类型映射正确，只保留菜单类型(0)和按钮类型(3)
    let menuType = permission.menuType;
    if (permission.type === "A") {
      menuType = 3; // 按钮类型
    } else if (permission.type === "M") {
      menuType = 0; // 菜单类型
    } else if (menuType === undefined || menuType === null) {
      // 如果没有指定menuType，根据type推断
      menuType = permission.type === "A" ? 3 : 0;
    }

    // 限制只有菜单类型(0)和按钮类型(3)
    if (menuType !== 0 && menuType !== 3) {
      menuType = 0; // 默认为菜单类型
    }

    const menu: any = {
      parentId:
        permission.parentId || permission.parentId === 0
          ? permission.parentId
          : 0,
      id: permission.id,
      menuType: menuType,
      title:
        permission.description || permission.title || permission.permKey || "",
      name: permission.name || "",
      path: permission.path || permission.permKey || "",
      component: permission.component || "",
      rank: permission.rank !== undefined ? permission.rank : 99,
      redirect: permission.redirect || "",
      icon: permission.icon || "",
      extraIcon: permission.extraIcon || "",
      enterTransition: permission.enterTransition || "",
      leaveTransition: permission.leaveTransition || "",
      activePath: permission.activePath || "",
      auths: permission.auths || permission.permKey || "",
      frameSrc: permission.frameSrc || "",
      frameLoading:
        permission.frameLoading !== undefined ? permission.frameLoading : true,
      keepAlive: permission.keepAlive || false,
      hiddenTag: permission.hiddenTag || false,
      fixedTag: permission.fixedTag || false,
      showLink: permission.showLink !== undefined ? permission.showLink : true,
      showParent: permission.showParent || false
    };

    // 如果有子权限，则递归处理
    if (permission.childPermissions && permission.childPermissions.length > 0) {
      menu.children = transformPermissionToPureMenus(
        permission.childPermissions
      );
    } else if (permission.children && permission.children.length > 0) {
      // 兼容已有children字段的情况
      menu.children = transformPermissionToPureMenus(permission.children);
    }

    return menu;
  });
}
