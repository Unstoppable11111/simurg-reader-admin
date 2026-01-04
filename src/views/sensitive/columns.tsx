import { ref, reactive, onMounted } from "vue";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePublicDict } from "@/utils/dict";
import {
  getSensitiveList,
  deleteSensitiveWords,
  reloadSensitiveCache
} from "@/api/sensitive";

export function useColumns() {
  const { dictData, getDictLabel, refreshDict } = usePublicDict();
  const loading = ref(false);
  const dataList = ref([]);

  const searchParams = reactive({
    word: "",
    level: undefined,
    type: undefined,
    status: undefined,
    page: 1,
    size: 10
  });

  const pagination = reactive<PaginationProps>({
    pageSize: 10,
    currentPage: 1,
    total: 0,
    align: "right",
    background: true
  });

  const columns: TableColumnList = [
    { type: "selection", width: 55 },
    { label: "ID", prop: "id", width: 80 },
    { label: "敏感词", prop: "word", minWidth: 120 },
    { label: "级别", prop: "level", slot: "level" },
    { label: "类型", prop: "type", slot: "type" },
    { label: "状态", prop: "status", slot: "status" },
    { label: "创建时间", prop: "createTime", width: 180 },
    { label: "操作", fixed: "right", width: 160, slot: "operation" }
  ];

  const fetchData = async () => {
    loading.value = true;
    try {
      const res = await getSensitiveList({
        ...searchParams,
        page: pagination.currentPage,
        size: pagination.pageSize
      });
      // 容错处理 data: null
      dataList.value = res.data?.records || [];
      pagination.total = Number(res.data?.total) || 0;
    } finally {
      loading.value = false;
    }
  };

  /** 🟢 执行删除逻辑 */
  const handleBatchDelete = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${ids.length} 条数据吗？`,
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
      const res = await deleteSensitiveWords(ids);
      if (res.code === 200) {
        ElMessage.success("删除成功");
        fetchData();
      }
    } catch (e) {
      console.error("删除异常:", e);
    }
  };

  const onReloadCache = async () => {
    const res = await reloadSensitiveCache();
    if (res.code === 200) ElMessage.success("缓存重载完成");
  };

  onMounted(() => {
    refreshDict();
    fetchData();
  });

  return {
    loading,
    columns,
    dataList,
    pagination,
    searchParams,
    dictData,
    getDictLabel,
    fetchData,
    handleBatchDelete,
    onReloadCache
  };
}
