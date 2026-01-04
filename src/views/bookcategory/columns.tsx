import type {
  LoadingConfig,
  AdaptiveConfig,
  PaginationProps,
  TableColumnList
} from "@pureadmin/table";
import { getCategoryList } from "@/api/bookcategory";
import { ref, onMounted, reactive } from "vue";
// import { ElMessage } from "element-plus";

// 1. 修改查询参数：去除 bannerTitle 等无关字段，改为 categoryName
const paramsData = reactive({
  page: 1,
  size: 20,
  orderDirection: "asc",
  categoryName: "" // ✅ 改为分类名称
});

function formatDate(dateStr: any): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function useColumns() {
  const dataList = ref<any[]>([]);
  const loading = ref(true);

  // 2. 表头定义（保持你提供的原样，非常清晰）
  const columns: TableColumnList = [
    { label: "分类名称", prop: "categoryName" },
    { label: "排序序号", prop: "sortOrder" },
    {
      label: "icon图片",
      prop: "iconImageUrl",
      slot: "imageUrl", // 对应父组件的 #imageUrl
      width: 120
    },
    {
      label: "封面图片URL",
      prop: "coverImageUrl",
      slot: "coverImageUrl", // 对应父组件的 #coverImageUrl
      width: 120
    },
    { label: "分类描述", prop: "categoryDescription" },
    {
      label: "创建时间",
      prop: "createTime",
      formatter: row => formatDate(row.createTime)
    },
    {
      label: "更新时间",
      prop: "updateTime",
      formatter: row => formatDate(row.updateTime)
    },
    {
      label: "操作",
      prop: "operation",
      slot: "operation",
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

      const res = await getCategoryList(paramsData);

      if (res.code === 200 && Array.isArray(res.data?.records)) {
        dataList.value = res.data.records;
        pagination.total = Number(res.data.total) || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
        // 只有出错或明确无数据时才提示，避免每次刷新都弹窗
        // if (res.code !== 200) ElMessage.warning(res.msg || "暂无数据");
      }
    } catch (error) {
      console.error("获取列表失败:", error);
      // ElMessage.error("请求失败");
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

  const handleSearch = () => {
    pagination.currentPage = 1;
    fetchData();
  };

  // 3. 重置逻辑：只重置 categoryName
  const handleReset = () => {
    paramsData.categoryName = "";
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
    searchParams: paramsData,
    handleSearch,
    handleReset
  };
}
