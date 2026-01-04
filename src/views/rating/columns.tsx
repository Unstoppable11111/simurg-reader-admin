import { ref, reactive } from "vue";
import type { PaginationProps, TableColumnList } from "@pureadmin/table";
import { getAdminRatingList, type RatingItem } from "@/api/rating";

export function useColumns() {
  const loading = ref(false);
  const dataList = ref<RatingItem[]>([]);

  // 🟢 搜索参数定义
  const searchParams = reactive({
    bookId: undefined as string | number, // 从 URL 获取，必传
    userId: undefined as string | number, // 可选筛选
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
    { label: "评分ID", prop: "ratingId", width: 100 },
    { label: "用户ID", prop: "userId", width: 120 },
    {
      label: "评分值",
      prop: "rating",
      width: 180,
      slot: "rating"
    },
    { label: "书籍ID", prop: "bookId", width: 100 }
  ];

  /** 获取列表数据 */
  const fetchData = async () => {
    // 🟢 强制校验：没有 bookId 不发起请求
    if (!searchParams.bookId) return;

    loading.value = true;
    try {
      const res = await getAdminRatingList({
        bookId: searchParams.bookId,
        userId: searchParams.userId || undefined,
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

  const onSizeChange = (val: number) => {
    pagination.pageSize = val;
    fetchData();
  };

  const onCurrentChange = (val: number) => {
    pagination.currentPage = val;
    fetchData();
  };

  return {
    loading,
    columns,
    dataList,
    pagination,
    searchParams,
    fetchData,
    onSizeChange,
    onCurrentChange
  };
}
