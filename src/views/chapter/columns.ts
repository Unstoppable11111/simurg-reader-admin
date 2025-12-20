import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import { ElMessage, ElMessageBox } from "element-plus";
// 🟢 引入统一的字典 Hook
import { usePublicDict } from "@/utils/dict";
import {
  getAdminChapterList,
  adminDeleteChapter,
  adminUpdateChapterStatus,
  type ChapterListItem
} from "@/api/chapter";

export function useColumns() {
  // 🟢 初始化字典工具，解构出需要的方法和数据
  const { dictData, getDictLabel, refreshDict } = usePublicDict();

  const loading = ref(false);
  const dataList = ref<ChapterListItem[]>([]);

  const searchParams = reactive({
    bookId: undefined as any,
    chapterTitle: undefined,
    chapterNumber: undefined,
    bookChaptersStatus: undefined, // 修改：初始值设为 undefined 以便 clearable 生效
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
    {
      label: "章节ID",
      prop: "chapterId",
      width: 180
    },
    {
      label: "序号",
      prop: "chapterNumber",
      width: 80
    },
    {
      label: "章节标题",
      prop: "chapterTitle",
      minWidth: 200
    },
    {
      label: "发布状态",
      prop: "bookChaptersStatus",
      width: 120,
      slot: "status",
      // 🟢 这里的 formatter 也会自动使用远程字典数据
      formatter: ({ bookChaptersStatus }) =>
        getDictLabel("bookChaptersStatus", bookChaptersStatus)
    },
    {
      label: "发布日期",
      prop: "createDate",
      width: 180,
      formatter: ({ createDate }) =>
        createDate ? dayjs(createDate).format("YYYY-MM-DD HH:mm") : "-"
    },
    {
      label: "更新日期",
      prop: "updateDate",
      width: 180,
      formatter: ({ updateDate }) =>
        updateDate ? dayjs(updateDate).format("YYYY-MM-DD HH:mm") : "-"
    },
    {
      label: "操作",
      fixed: "right",
      width: 350,
      slot: "operation"
    }
  ];

  /** 核心修改：动态合并所有搜索参数 */
  const fetchData = async () => {
    if (!searchParams.bookId) return;
    loading.value = true;
    try {
      // 🟢 修改点：使用扩展运算符 ...searchParams 将所有筛选条件解构成请求参数
      const res = await getAdminChapterList({
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

  /** 状态切换逻辑优化 */
  const handleStatusChange = async (
    row: ChapterListItem,
    newStatus: number
  ) => {
    const label = getDictLabel("bookChaptersStatus", newStatus);

    try {
      await ElMessageBox.confirm(
        `确认将章节《${row.chapterTitle}》的状态切换为【${label}】？`,
        "状态变更确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          closeOnClickModal: true
        }
      );

      loading.value = true;

      const res = await adminUpdateChapterStatus({
        bookId: row.bookId,
        chapterId: row.chapterId,
        bookChaptersStatus: newStatus
      });

      if (res && res.code === 200) {
        ElMessage.success(res.msg || `状态更新为：${label}`);
        fetchData();
      } else {
        ElMessage.error(res.msg || "接口返回异常");
      }
    } catch (error: any) {
      if (error !== "cancel") {
        console.error("请求发生错误:", error);
        ElMessage.error(
          error?.msg || error?.message || "网络请求失败，请稍后重试"
        );
      }
    } finally {
      loading.value = false;
    }
  };

  /** 删除功能优化 */
  const handleDelete = async (row: ChapterListItem) => {
    try {
      await ElMessageBox.confirm("确定删除该章节？此操作不可逆", "警告", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "error"
      });

      loading.value = true;
      const res = await adminDeleteChapter(row.bookId, row.chapterId);

      if (res && res.code === 200) {
        ElMessage.success(res.msg || "删除成功");
        fetchData();
      } else {
        ElMessage.error(res.msg || "删除失败");
      }
    } catch (error: any) {
      if (error !== "cancel") {
        console.error(error?.msg || error?.message || "操作异常");
      }
    } finally {
      loading.value = false;
    }
  };

  const onSizeChange = (val: number) => {
    pagination.pageSize = val;
    // 🟢 同步更新 searchParams 里的 size，保持一致
    searchParams.size = val;
    fetchData();
  };

  const onCurrentChange = (val: number) => {
    pagination.currentPage = val;
    // 🟢 同步更新 searchParams 里的 page，保持一致
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
    onCurrentChange
  };
}
