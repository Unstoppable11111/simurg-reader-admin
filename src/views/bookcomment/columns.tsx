import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import { ElMessage, ElMessageBox } from "element-plus";
import { getAdminChapterList } from "@/api/chapter";

// 🟢 引入统一的字典 Hook
import { usePublicDict } from "@/utils/dict";
// 🟢 引入接口文件
import {
  getAdminCommentList,
  deleteAdminComment,
  updateAdminCommentStatus
} from "@/api/bookcomment";

export function useColumns() {
  const { dictData, getDictLabel, refreshDict } = usePublicDict();

  const loading = ref(false);
  const dataList = ref([]);
  const chapterOptions = ref([]); // 存放章节下拉列表
  const selectLoading = ref(false); // 下拉框加载状态

  const searchParams = reactive({
    bookId: undefined as any,
    chapterId: undefined,
    userId: undefined,
    commentStatus: undefined, // 页面查询使用的字段
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
    { label: "评论ID", prop: "commentId", width: 180 },
    { label: "用户ID", prop: "userId", width: 120 },
    { label: "章节名称", prop: "chapterTitle", width: 150 },
    {
      label: "评论内容",
      prop: "commentText", // 对应你代码中的字段
      minWidth: 300,
      showOverflowTooltip: true
    },
    {
      label: "状态",
      prop: "commentStatus",
      width: 120,
      slot: "status",
      formatter: ({ commentStatus }) =>
        getDictLabel("bookCommentStatus", commentStatus)
    },
    {
      label: "评论时间",
      prop: "commentDate",
      width: 180,
      formatter: ({ commentDate }) =>
        commentDate ? dayjs(commentDate).format("YYYY-MM-DD HH:mm:ss") : "-"
    },
    { label: "操作", fixed: "right", width: 220, slot: "operation" }
  ];

  /** 🟢 远程搜索章节逻辑（支持初始化展示前10章） */
  const remoteSearchChapters = async (query?: string) => {
    if (!searchParams.bookId) return;

    selectLoading.value = true;
    try {
      const res = await getAdminChapterList({
        bookId: String(searchParams.bookId),
        chapterTitle: query || undefined, // 如果没有 query，查全部
        page: 1,
        size: query ? 20 : 10 // 有关键字查20条，无关键字查10条
      });

      if (res.code === 200) {
        chapterOptions.value = (res.data.records || []).map(item => ({
          label: `第${item.chapterNumber}章 ${item.chapterTitle}`,
          value: item.chapterId
        }));
      }
    } catch (e) {
      console.error("章节搜索异常:", e);
      chapterOptions.value = [];
    } finally {
      selectLoading.value = false;
    }
  };

  const fetchData = async () => {
    if (!searchParams.bookId) return;
    loading.value = true;
    try {
      const res = await getAdminCommentList({
        ...searchParams,
        page: pagination.currentPage,
        size: pagination.pageSize
      });
      if (res.code === 200) {
        dataList.value = res.data.records || [];
        pagination.total = Number(res.data.total) || 0;
      }
    } finally {
      loading.value = false;
    }
  };

  /** 状态切换 */
  const handleStatusChange = async (row: any, newStatus: number) => {
    const label = getDictLabel("bookCommentStatus", newStatus);
    try {
      await ElMessageBox.confirm(
        `确认将该评论状态修改为【${label}】？`,
        "提示"
      );
      loading.value = true;
      const res = await updateAdminCommentStatus({
        bookId: row.bookId,
        commentId: row.commentId,
        targetStatus: newStatus
      });
      if (res.code === 200) {
        ElMessage.success("状态更新成功");
        fetchData();
      }
    } catch (_e) {
      console.error("删除异常:", _e);
    } finally {
      loading.value = false;
    }
  };

  /** 删除功能 */
  const handleDelete = async (row: any) => {
    try {
      await ElMessageBox.confirm("确定删除该评论吗？此操作不可逆", "警告", {
        type: "error"
      });
      loading.value = true;
      const res = await deleteAdminComment(row.bookId, row.commentId);
      if (res.code === 200) {
        ElMessage.success("删除成功");
        fetchData();
      }
    } catch (_e) {
      console.error("删除异常:", _e);
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
    handleStatusChange,
    handleDelete,
    onSizeChange,
    onCurrentChange,
    chapterOptions,
    selectLoading,
    remoteSearchChapters
  };
}
