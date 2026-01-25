import dayjs from "dayjs";
import { message } from "@/utils/message";
import type { TreeProps as ElTreeProps } from "element-plus";
import { transformI18n } from "@/plugins/i18n";
import type { RoleItem } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { ref, onMounted, watch, nextTick, type Ref } from "vue";
import { RolePermissionApi, type PermissionItem } from "@/api/role";
import { usePublicDict } from "@/utils/dict";

export function useRole(treeRef: Ref) {
  const { dictData, getDictLabel, refreshDict } = usePublicDict();
  const form = ref({
    name: "",
    code: ""
  });
  const curRow = ref<RoleItem>();
  const dataList = ref<RoleItem[]>([]);
  const treeIds = ref<number[]>([]);
  const treeData = ref<PermissionItem[]>([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref("");
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);

  const treeProps = {
    value: "permissionId",
    label: "permissionDescription",
    children: "childPermissions"
  } satisfies ElTreeProps;

  const pagination = ref<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    {
      label: "角色标识",
      prop: "roleKey"
    },
    {
      label: "角色名称",
      prop: "roleName",
      formatter: ({ roleKey }) => getDictLabel("userRole", roleKey)
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 160
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  // 获取角色列表的函数，从字典中获取数据
  async function onSearch() {
    loading.value = true;
    try {
      // 从字典中获取userRole数据
      const userRolesFromDict = dictData.value.userRole || [];

      // 将字典数据转换为RoleItem格式
      const transformedData = userRolesFromDict.map(role => ({
        roleKey: role.key,
        roleName: role.value,
        remark: `角色-${role.value}`,
        createTime: new Date().toISOString()
      })) as RoleItem[];

      // 如果有搜索条件，则过滤数据
      let filteredData = transformedData;
      if (form.value.name) {
        filteredData = filteredData.filter(item =>
          getDictLabel("userRole", item.roleKey)
            .toLowerCase()
            .includes(form.value.name.toLowerCase())
        );
      }
      if (form.value.code) {
        filteredData = filteredData.filter(item =>
          item.roleKey.toLowerCase().includes(form.value.code.toLowerCase())
        );
      }

      dataList.value = filteredData;
      pagination.value.total = filteredData.length;
    } catch (error) {
      console.error("获取角色列表失败:", error);
      message("获取角色列表失败", { type: "error" });

      dataList.value = [];
      pagination.value.total = 0;
    } finally {
      loading.value = false;
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /** 菜单权限 */
  async function handleMenu(row?: RoleItem) {
    const { roleKey } = row;
    if (roleKey) {
      curRow.value = row;
      isShow.value = true;
      try {
        // 使用真实的API获取权限树
        const response = await RolePermissionApi.getPermissionsTree(roleKey);
        if (response.data) {
          treeData.value = response.data;

          // 设置默认勾选状态，基于hasAssociation字段
          nextTick(() => {
            // 收集所有hasAssociation为true的permissionId
            const checkedIds: number[] = [];
            const collectCheckedIds = (permissions: PermissionItem[]) => {
              permissions.forEach(permission => {
                if (permission.hasAssociation) {
                  checkedIds.push(permission.permissionId);
                }
                if (
                  permission.childPermissions &&
                  permission.childPermissions.length > 0
                ) {
                  collectCheckedIds(permission.childPermissions);
                }
              });
            };

            collectCheckedIds(response.data);

            // 批量设置选中状态
            treeRef.value?.setCheckedKeys(checkedIds);
          });
        }
      } catch (error) {
        console.error("获取权限树失败:", error);
        message("获取权限树失败", { type: "error" });
      }
    } else {
      curRow.value = null;
      isShow.value = false;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row }: { row: RoleItem }) {
    return {
      cursor: "pointer",
      background:
        row.roleKey === curRow.value?.roleKey
          ? "var(--el-fill-color-light)"
          : ""
    };
  }

  /** 菜单权限-保存 */
  async function handleSave() {
    const { roleKey, roleName } = curRow.value;
    try {
      // 获取选中的权限ID
      const checkedKeys = treeRef.value.getCheckedKeys() as number[];

      // 使用role.ts中提供的saveRolePermissions接口
      await RolePermissionApi.saveRolePermissions({
        roleKey,
        permissionIdList: checkedKeys
      });

      message(`角色"${roleName}"的权限修改成功`, {
        type: "success"
      });
    } catch (error) {
      console.error("保存权限失败:", error);
      message("保存权限失败", { type: "error" });
    }
  }

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return (
      transformI18n(node.permissionDescription)
        ?.toLowerCase()
        .includes(query.toLowerCase()) ||
      transformI18n(node.permKey)?.toLowerCase().includes(query.toLowerCase())
    );
  };

  onMounted(async () => {
    // 刷新字典数据
    refreshDict();

    onSearch();

    // 初始化权限树 - 获取当前用户权限树
    try {
      const response = await RolePermissionApi.getCurrentUserPermissionsTree();
      if (response.data) {
        treeData.value = response.data;

        // 收集所有权限ID用于展开/收起操作
        const collectIds = (items: PermissionItem[]): number[] => {
          let ids: number[] = [];
          items.forEach(item => {
            if (item.permissionId) {
              ids.push(item.permissionId);
            }
            if (item.childPermissions) {
              ids = ids.concat(collectIds(item.childPermissions));
            }
          });
          return ids;
        };

        treeIds.value = collectIds(response.data);
      }
    } catch (error) {
      console.error("初始化权限树失败:", error);
    }
  });

  watch(isExpandAll, val => {
    if (treeRef.value) {
      val
        ? treeRef.value.setExpandedKeys(treeIds.value)
        : treeRef.value.setExpandedKeys([]);
    }
  });

  watch(isSelectAll, val => {
    if (treeRef.value) {
      val
        ? treeRef.value.setCheckedKeys(treeIds.value)
        : treeRef.value.setCheckedKeys([]);
    }
  });

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    onSearch,
    resetForm,
    handleMenu,
    handleSave,
    filterMethod,
    transformI18n,
    onQueryChanged,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
