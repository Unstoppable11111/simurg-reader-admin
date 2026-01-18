import editForm from "../form.vue";
import { message } from "@/utils/message";
import { getPermissionTree } from "@/api/permission";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "../utils/types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { cloneDeep, isAllEmpty, deviceDetection } from "@pureadmin/utils";
import {
  transformPermissionToTableFormat,
  transformPermissionToPureMenus
} from "@/utils/utils";

export function useMenu() {
  const form = reactive({
    title: ""
  });

  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);

  const getMenuType = (type, text = false) => {
    switch (type) {
      case 0:
      case "M":
        return text ? "菜单" : "primary";
      case 3:
      case "A":
        return text ? "按钮" : "info";
      default:
        return text ? "未知" : "default";
    }
  };

  const columns: TableColumnList = [
    {
      label: "菜单名称",
      prop: "title",
      align: "left",
      className: "table_first_column",
      cellRenderer: ({ row }) => (
        <>
          {/* 根据层级设置缩进 */}
          <span style={{ paddingLeft: `${(row.level || 0) * 20}px` }}>
            <span class="inline-block mr-1">
              {row.icon &&
                h(useRenderIcon(row.icon), {
                  style: { paddingTop: "1px" }
                })}
            </span>
            <span>{transformI18n(row.title || "")}</span>
          </span>
        </>
      )
    },
    {
      label: "菜单类型",
      prop: "menuType",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={getMenuType(row.menuType)}
          effect="plain"
        >
          {getMenuType(row.menuType, true)}
        </el-tag>
      )
    },
    {
      label: "路由地址",
      prop: "path"
    },
    {
      label: "权限标识",
      prop: "auths"
    },
    {
      label: "上级菜单",
      prop: "parentId",
      formatter: ({ parentId }) => (parentId === 0 ? "主菜单" : parentId)
    },
    {
      label: "ID",
      prop: "id",
      width: 80
    },
    {
      label: "排序",
      prop: "sortOrder",
      width: 80
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
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
    console.log(data, "Permission data");

    // 将权限数据转换为Pure Admin菜单格式
    const pureMenus = transformPermissionToPureMenus(data);

    let newData = pureMenus;
    if (!isAllEmpty(form.title)) {
      // 前端搜索菜单标题
      newData = newData.filter(item => (item.title || "").includes(form.title));
    }

    // 使用新的转换函数处理菜单树数据为表格格式
    dataList.value = transformPermissionToTableFormat(newData);

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  function formatHigherMenuOptions(tableData) {
    // 直接将表格数据映射为适合 el-cascader 使用的选项
    const options = tableData.map(item => ({
      id: item.id,
      title: transformI18n(item.title || ""),
      parentId: item.parentId,
      children: item.children
    }));

    // 添加“主菜单”根节点
    return [
      {
        id: 0,
        title: "主菜单",
        children: options
      }
    ];
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}菜单`,
      props: {
        formInline: {
          menuType: row?.menuType ?? 0,
          higherMenuOptions: formatHigherMenuOptions(cloneDeep(dataList.value)),
          parentId: row?.parentId ?? 0,
          title: row?.title ?? "",
          name: row?.name ?? "",
          path: row?.path ?? "",
          component: row?.component ?? "",
          sortOrder: row?.sortOrder ?? 99,
          redirect: row?.redirect ?? "",
          icon: row?.icon ?? "",
          extraIcon: row?.extraIcon ?? "",
          enterTransition: row?.enterTransition ?? "",
          leaveTransition: row?.leaveTransition ?? "",
          activePath: row?.activePath ?? "",
          auths: row?.auths ?? "",
          frameSrc: row?.frameSrc ?? "",
          frameLoading: row?.frameLoading ?? true,
          keepAlive: row?.keepAlive ?? false,
          hiddenTag: row?.hiddenTag ?? false,
          fixedTag: row?.fixedTag ?? false,
          showLink: row?.showLink ?? true,
          showParent: row?.showParent ?? false
        }
      },
      width: "45%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          message(
            `您${title}了菜单名称为${transformI18n(curData.title)}的这条数据`,
            {
              type: "success"
            }
          );
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
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

  function handleDelete(row) {
    message(`您删除了菜单名称为${transformI18n(row.title || "")}的这条数据`, {
      type: "success"
    });
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
    /** 搜索 */
    onSearch,
    /** 重置 */
    resetForm,
    /** 新增、修改菜单 */
    openDialog,
    /** 删除菜单 */
    handleDelete,
    handleSelectionChange
  };
}
