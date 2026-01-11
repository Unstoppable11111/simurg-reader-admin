import dayjs from "dayjs";
import editForm from "../form.vue";
import { message } from "@/utils/message";
import { ElMessageBox, type TreeProps as ElTreeProps } from "element-plus";
import { usePublicHooks } from "../../hooks";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps, RoleItem } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { deviceDetection } from "@pureadmin/utils";
import { ref, onMounted, h, watch } from "vue";
import { RolePermissionApi, type PermissionItem } from "@/api/role";

export function useRole(treeRef: Ref) {
  const form = ref({
    name: "",
    code: "",
    status: ""
  });
  const curRow = ref<RoleItem>();
  const formRef = ref();
  const dataList = ref<RoleItem[]>([]);
  const treeIds = ref<number[]>([]);
  const treeData = ref<PermissionItem[]>([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref("");
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
  const { switchStyle } = usePublicHooks();

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
      prop: "roleName"
    },
    {
      label: "状态",
      cellRenderer: ({ row, index }) => (
        <el-switch
          size={row.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[index]?.loading}
          v-model={row.status}
          active-value={1}
          inactive-value={0}
          active-text="已启用"
          inactive-text="已停用"
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange({ row, index })}
        />
      ),
      minWidth: 90
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
      width: 210,
      slot: "operation"
    }
  ];
  // const buttonClass = computed(() => {
  //   return [
  //     "h-[20px]!",
  //     "reset-margin",
  //     "text-gray-500!",
  //     "dark:text-white!",
  //     "dark:hover:text-primary!"
  //   ];
  // });

  function onChange({ row, index }) {
    ElMessageBox.confirm(
      `确认要<strong>${
        row.status === 0 ? "停用" : "启用"
      }</strong><strong style='color:var(--el-color-primary)'>${
        row.roleName || row.name
      }</strong>吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(() => {
        switchLoadMap.value[index] = Object.assign(
          {},
          switchLoadMap.value[index],
          {
            loading: true
          }
        );
        // TODO: 实现真实的状态更改API调用
        // setTimeout(() => {
        //   switchLoadMap.value[index] = Object.assign(
        //     {},
        //     switchLoadMap.value[index],
        //     {
        //       loading: false
        //     }
        //   );
        //   message(`已${row.status === 0 ? "停用" : "启用"}${row.name}`, {
        //     type: "success"
        //   });
        // }, 300);
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  async function handleDelete(row) {
    // TODO: 实现真实删除API调用
    // message(`您删除了角色名称为${row.name}的这条数据`, { type: "success" });
    // onSearch();

    try {
      // 这里应该有真实的删除API调用，但role.ts中没有提供删除接口
      // 所以暂时保留提示
      message(`模拟删除角色: ${row.roleName || row.name}`, { type: "success" });
      onSearch();
    } catch (error) {
      console.error("删除角色失败:", error);
    }
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  // 获取角色列表的函数
  async function onSearch() {
    loading.value = true;
    try {
      // TODO: 实现真实的角色列表获取API
      // const response = await getRoleList(toRaw(form.value));
      // 暂时使用模拟数据
      const mockData = {
        list: [
          {
            roleKey: "admin",
            roleName: "管理员",
            status: 1,
            remark: "系统管理员角色",
            createTime: new Date().toISOString()
          },
          {
            roleKey: "user",
            roleName: "普通用户",
            status: 1,
            remark: "普通用户角色",
            createTime: new Date().toISOString()
          },
          {
            roleKey: "guest",
            roleName: "访客",
            status: 0,
            remark: "访客角色",
            createTime: new Date().toISOString()
          }
        ] as RoleItem[],
        total: 3,
        pageSize: 10,
        currentPage: 1
      };

      dataList.value = mockData.list;
      pagination.value.total = mockData.total;
      pagination.value.pageSize = mockData.pageSize;
      pagination.value.currentPage = mockData.currentPage;
    } catch (error) {
      console.error("获取角色列表失败:", error);
      message("获取角色列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}角色`,
      props: {
        formInline: {
          name: row?.name ?? "",
          code: row?.code ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          message(`您${title}了角色名称为${curData.name}的这条数据`, {
            type: "success"
          });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // TODO: 实现真实的角色新增/修改API调用
            // 表单规则校验通过
            if (title === "新增") {
              // 实际开发先调用新增接口，再进行下面操作
              chores();
            } else {
              // 实际开发先调用修改接口，再进行下面操作
              chores();
            }
          }
        });
      }
    });
  }

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

          // 获取已分配的权限ID
          const permissionsListResponse =
            await RolePermissionApi.getPermissionsList(roleKey);
          if (permissionsListResponse.data) {
            // 仅选择按钮类型的权限
            const checkedKeys = permissionsListResponse.data
              .filter(item => item.type === "A") // 只勾选按钮权限
              .map(item => item.permissionId)
              .filter(id => id !== undefined) as number[];

            treeRef.value.setCheckedKeys(checkedKeys);
          }
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

      // 获取当前权限列表
      const response = await RolePermissionApi.getPermissionsList(roleKey);
      let currentPermissionIds: number[] = [];
      if (response.data) {
        currentPermissionIds = response.data
          .map(item => item.permissionId)
          .filter(id => id !== undefined) as number[];
      }

      // 计算需要添加和删除的权限ID
      const newPermissionIds = checkedKeys.filter(
        id => !currentPermissionIds.includes(id)
      );
      const removedPermissionIds = currentPermissionIds.filter(
        id => !checkedKeys.includes(id)
      );

      // 批量添加新权限
      if (newPermissionIds.length > 0) {
        await RolePermissionApi.batchCreateRelation(roleKey, newPermissionIds);
      }

      // 批量删除不需要的权限
      if (removedPermissionIds.length > 0) {
        await RolePermissionApi.batchDeleteRelation(
          roleKey,
          removedPermissionIds
        );
      }

      message(`角色"${roleName}"的权限修改成功`, {
        type: "success"
      });
    } catch (error) {
      console.error("保存权限失败:", error);
      message("保存权限失败", { type: "error" });
    }
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

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
    // buttonClass,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    filterMethod,
    transformI18n,
    onQueryChanged,
    // handleDatabase,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
