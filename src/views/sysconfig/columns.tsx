import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps,
  TableColumnList
} from "@pureadmin/table";

import { getSysConfigList } from "@/api/sysconfig";
import { ref, onMounted, reactive } from "vue";
import { ElMessage } from "element-plus";

// 初始查询参数（与分页联动）
const paramsData = reactive({
  page: 1,
  size: 20,
  orderDirection: "asc",
  SysConfigTitle: "", // 保持不变，用于兼容搜索功能
  linkType: null,
  status: null
});

function formatDate(dateStr: any): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

// 枚举映射（用于 formatter）
// ⚠️ 注意：如果表格中已移除 linkType/status 列，这些映射可以移除
const linkTypeMap: Record<number, string> = {
  0: "内部页面",
  1: "外部链接"
};

const statusMap: Record<number, string> = {
  0: "禁用",
  1: "启用"
};

export function useColumns() {
  const dataList = ref<any[]>([]);
  const loading = ref(true);

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left"
    },
    { label: "配置键(唯一标识)", prop: "configKey" },
    { label: "配置值", prop: "configValue" },
    { label: "配置描述", prop: "description" },
    { label: "创建人ID", prop: "creatorId" },
    { label: "最后修改人ID", prop: "updaterId" },
    {
      label: "创建时间",
      prop: "createDate",
      formatter: row => formatDate(row.createDate)
    },
    {
      label: "更新时间",
      prop: "updateDate",
      formatter: row => formatDate(row.updateDate)
    },

    // 操作列：使用插槽
    {
      label: "操作",
      prop: "operation",
      slot: "operation", // 👈 使用插槽
      fixed: "right",
      width: 160
    }
  ];

  const pagination = reactive<PaginationProps>({
    pageSize: 20,
    currentPage: 1,
    pageSizes: [20, 40, 60],
    total: 0,
    align: "right",
    background: true,
    size: "default"
  });

  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载...",
    viewBox: "-10, -10, 50, 50",
    spinner: `
      <path class="path" d="
        M 30 15
        L 28 17
        M 25.61 25.61
        A 15 15, 0, 0, 1, 15 30
        A 15 15, 0, 1, 1, 27.99 7.5
        L 15 15
      " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0);"/>
    `
  });

  const adaptiveConfig: AdaptiveConfig = {
    offsetBottom: 110
  };

  const fetchData = async () => {
    loading.value = true;
    try {
      paramsData.page = pagination.currentPage;
      paramsData.size = pagination.pageSize;

      const res = await getSysConfigList(paramsData);

      if (res.code === 200 && Array.isArray(res.data?.records)) {
        dataList.value = res.data.records;
        pagination.total = Number(res.data.total) || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
        ElMessage.warning(res.msg || "暂无数据");
      }
    } catch (error) {
      console.error("获取 SysConfig 列表失败:", error);
      ElMessage.error("请求失败");
      dataList.value = [];
      pagination.total = 0;
    } finally {
      loading.value = false;
    }
  };

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    fetchData();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    fetchData();
  }

  // ✅ 暴露搜索相关
  const handleSearch = () => {
    pagination.currentPage = 1;
    fetchData();
  };

  const handleReset = () => {
    paramsData.SysConfigTitle = "";
    paramsData.linkType = null; // 恢复到 null
    paramsData.status = null;
    pagination.currentPage = 1;
    fetchData();
  };

  onMounted(() => {
    fetchData();
  });

  return {
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    adaptiveConfig,
    onSizeChange,
    onCurrentChange,
    refresh: fetchData,
    // ✅ 暴露给父组件绑定
    searchParams: paramsData,
    handleSearch,
    handleReset
  };
}
