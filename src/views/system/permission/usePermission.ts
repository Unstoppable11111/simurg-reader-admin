import { reactive, ref, onMounted, h } from "vue";
import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import { getPermissionTree } from "@/api/permission";
import type { PermissionItem } from "@/api/permission";
import { cloneDeep, isAllEmpty, deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import editForm from "./form.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export function usePermission() {
  const form = reactive({
    title: ""
  });

  const formRef = ref();
  const dataList = ref<PermissionItem[]>([]);
  const loading = ref(true);

  const getPermissionType = (type: string, text = false) => {
    switch (type) {
      case "M":
        return text ? "菜单" : "primary";
      case "A":
        return text ? "按钮" : "info";
      default:
        return text ? "未知" : "default";
    }
  };

  const columns: TableColumnList = [
    {
      label: "权限名称",
      prop: "description",
      align: "left",
      className: "table_first_column",
      cellRenderer: ({ row }) => {
        // 使用 h 函数构建带有缩进和图标的名称列
        return h(
          "span",
          { style: { paddingLeft: `${(row.level || 0) * 20}px` } },
          [
            h("span", { class: "inline-block mr-1" }, [
              row.icon
                ? h(useRenderIcon(row.icon), {
                    style: { paddingTop: "1px" }
                  })
                : null
            ]),
            h("span", transformI18n(row.description || ""))
          ]
        );
      }
    },
    {
      label: "权限标识",
      prop: "permKey"
    },
    {
      label: "权限类型",
      prop: "type",
      width: 100,
      cellRenderer: ({ row, props: rendererProps }) => {
        // 使用 h 函数渲染 el-tag 组件
        return h(
          "el-tag",
          {
            size: rendererProps.size,
            type: getPermissionType(row.type),
            effect: "plain"
          },
          {
            default: () => getPermissionType(row.type, true)
          }
        );
      }
    },
    { label: "ID", prop: "id", width: 80 },
    { label: "父级ID", prop: "parentId", width: 80 },
    { label: "创建时间", prop: "createDate", width: 150 },
    { label: "更新时间", prop: "updateDate", width: 150 },
    { label: "操作", fixed: "right", width: 210, slot: "operation" }
  ];

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { data } = await getPermissionTree();

    let newData = data;
    if (!isAllEmpty(form.title)) {
      newData = newData.filter(item =>
        (item.description || "").includes(form.title)
      );
    }

    dataList.value = formatPermissionTree(newData, 0);

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  function formatPermissionTree(items: PermissionItem[], level: number): any[] {
    return items.map(item => ({
      ...item,
      level,
      children:
        item.childPermissions && item.childPermissions.length
          ? formatPermissionTree(item.childPermissions, level + 1)
          : []
    }));
  }

  function formatHigherPermissionOptions(treeList) {
    if (!treeList || !treeList.length) return;
    const newTreeList = [];
    for (let i = 0; i < treeList.length; i++) {
      const item = { ...treeList[i] };
      item.description = transformI18n(item.description || "");
      if (item.children && item.children.length > 0) {
        item.children = formatHigherPermissionOptions(item.children);
      }
      newTreeList.push(item);
    }
    return newTreeList;
  }

  function openDialog(title = "新增", row?: PermissionItem) {
    addDialog({
      title: `${title}权限`,
      props: {
        formInline: {
          type: row?.type || "M",
          higherPermissionOptions: formatHigherPermissionOptions(
            cloneDeep(dataList.value)
          ),
          parentId: row?.parentId || 0,
          permKey: row?.permKey || "",
          description: row?.description || "",
          icon: row?.icon || "",
          id: row?.id
        }
      },
      width: "45%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      // contentRenderer 已经在使用 h 函数，无需修改
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as PermissionItem;
        function chores() {
          message(
            `您${title}了权限名称为${transformI18n(curData.description || "")}的这条数据`,
            { type: "success" }
          );
          done();
          onSearch();
        }
        FormRef.validate(valid => {
          if (valid) {
            chores();
          }
        });
      }
    });
  }

  function handleDelete(row) {
    message(
      `您删除了权限名称为${transformI18n(row.description || "")}的这条数据`,
      {
        type: "success"
      }
    );
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleSelectionChange
  };
}
