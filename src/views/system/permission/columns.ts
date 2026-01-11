import { h } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { transformI18n } from "@/plugins/i18n";
import type { PermissionItem } from "@/api/permission";

interface Props {
  level?: number;
  expandRowKeys?: number[];
  onExpand: (row: PermissionItem) => void;
}

export function createColumns(props: Props) {
  const { level = 0, expandRowKeys = [], onExpand } = props;

  const columns: TableColumnList = [
    {
      label: "权限名称",
      prop: "description",
      align: "left",
      className: "table_first_column",
      cellRenderer: ({ row }) => {
        const hasChild =
          row.childPermissions && row.childPermissions.length > 0;
        const isExpanded = expandRowKeys.includes(row.id);

        // 使用 h 函数替代 <>...</>
        return h("span", { style: { paddingLeft: `${level * 20}px` } }, [
          // 展开/收起 图标
          hasChild
            ? h(
                "span",
                {
                  class: "mr-2 cursor-pointer text-sm",
                  onClick: () => onExpand(row)
                },
                isExpanded ? "▼" : "▶"
              )
            : h("span", { class: "mr-2 inline-block w-4" }),

          // 图标部分
          h("span", { class: "inline-block mr-1" }, [
            row.icon
              ? h(useRenderIcon(row.icon), { style: { paddingTop: "1px" } })
              : null
          ]),

          // 文字部分
          h("span", transformI18n(row.description || ""))
        ]);
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
        const getTypeInfo = (type: string, text = false) => {
          switch (type) {
            case "M":
              return text ? "菜单" : "primary";
            case "A":
              return text ? "按钮" : "info";
            default:
              return text ? "未知" : "default";
          }
        };

        // 替代 <el-tag>
        return h(
          "el-tag",
          {
            size: rendererProps.size,
            type: getTypeInfo(row.type),
            effect: "plain"
          },
          { default: () => getTypeInfo(row.type, true) }
        );
      }
    },
    { label: "ID", prop: "id", width: 80 },
    { label: "父级ID", prop: "parentId", width: 80 },
    { label: "创建时间", prop: "createDate", width: 150 },
    { label: "更新时间", prop: "updateDate", width: 150 },
    { label: "操作", fixed: "right", width: 210, slot: "operation" }
  ];

  return columns;
}
