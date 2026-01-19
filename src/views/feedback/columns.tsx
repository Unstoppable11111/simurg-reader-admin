import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePublicDict } from "@/utils/dict";
import { getFeedbackList, deleteFeedback } from "@/api/feedback";

export function useColumns() {
  const { dictData, getDictLabel, refreshDict } = usePublicDict();

  const loading = ref(false);
  const dataList = ref([]);

  const searchParams = reactive({
    feedbackType: undefined,
    status: undefined,
    page: 1,
    size: 20
  });

  const pagination = reactive<PaginationProps>({
    pageSize: 20,
    currentPage: 1,
    total: 0,
    align: "right",
    background: true
  });

  const columns: TableColumnList = [
    { label: "反馈ID", prop: "id" },
    { label: "用户ID", prop: "userId" },
    {
      label: "反馈类型",
      prop: "feedbackType",
      width: 120,
      slot: "feedbackType",
      formatter: ({ feedbackType }) =>
        getDictLabel("feedbackType", feedbackType)
    },
    {
      label: "反馈内容",
      prop: "content",
      minWidth: 300,
      showOverflowTooltip: true
    },
    {
      label: "状态",
      prop: "status",
      width: 120,
      slot: "status",
      formatter: ({ status }) => getDictLabel("feedbackStatus", status)
    },
    {
      label: "提交时间",
      prop: "createDate",
      width: 180,
      formatter: ({ createDate }) =>
        createDate ? dayjs(createDate).format("YYYY-MM-DD HH:mm:ss") : "-"
    },
    { label: "操作", fixed: "right", width: 180, slot: "operation" }
  ];

  const fetchData = async () => {
    loading.value = true;
    try {
      const res = await getFeedbackList({
        ...searchParams,
        page: pagination.currentPage,
        size: pagination.pageSize
      });
      if (res.code === 200 && res.data) {
        dataList.value = res.data.records ?? [];
        pagination.total = Number(res.data.total) ?? 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (e) {
      console.error("获取反馈列表失败:", e);
      dataList.value = [];
    } finally {
      loading.value = false;
    }
  };

  const handleDelete = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确认删除ID为 ${row.id} 的反馈记录吗？`,
        "警告",
        {
          type: "error"
        }
      );
      loading.value = true;
      const res = await deleteFeedback(row.id);
      if (res.code === 200) {
        ElMessage.success("删除成功");
        fetchData();
      }
    } catch (e) {
      console.error("删除反馈记录失败:", e);
    } finally {
      loading.value = false;
    }
  };

  const onSizeChange = (val: number) => {
    pagination.pageSize = val;
    searchParams.size = val;
    fetchData();
  };

  const onCurrentChange = (val: number) => {
    pagination.currentPage = val;
    searchParams.page = val;
    fetchData();
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
    handleDelete,
    onSizeChange,
    onCurrentChange
  };
}
