import {
  getAdminBookList,
  adminDeleteBook,
  adminUpdateBookStatus
} from "@/api/booklist";
import { getCategoryList } from "@/api/bookcategory";
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePublicDict } from "@/utils/dict";

export function useColumns() {
  const { dictData, getDictLabel, refreshDict } = usePublicDict();

  const loading = ref(true);
  const dataList = ref([]);

  // --- 1. 补全响应式查询参数 ---
  const paramsData = reactive({
    page: 1,
    size: 20,
    orderDirection: "desc",
    title: "",
    bookId: undefined, // 新增
    authorId: undefined,
    penName: "", // 新增
    bookStatus: undefined,
    categoryId: undefined,
    serialStatus: undefined, // 新增
    isFree: undefined, // 新增
    isSigned: undefined, // 新增
    language: "", // 新增
    createDateRange: [], // 新增
    latestChapterTimeRange: [] // 新增
  });

  const pagination = reactive({
    pageSize: 20,
    currentPage: 1,
    pageSizes: [20, 40, 60],
    total: 0,
    align: "right",
    background: true,
    size: "default"
  });

  const categoryOptions = ref([]);
  const categoryLoading = ref(false);

  // --- 2. 优化业务请求逻辑 ---
  const fetchData = async () => {
    loading.value = true;
    try {
      // 组装分页和排序
      const queryParams: any = {
        page: pagination.currentPage,
        size: pagination.pageSize,
        orderDirection: paramsData.orderDirection
      };

      // 遍历 paramsData，将有值的字段自动加入请求参数 (排除掉不需要传给接口的或特殊处理的字段)
      Object.keys(paramsData).forEach(key => {
        const val = paramsData[key];
        // 排除掉不需要传原始值的字段
        if (
          [
            "page",
            "size",
            "createDateRange",
            "latestChapterTimeRange"
          ].includes(key)
        )
          return;

        if (val !== "" && val !== undefined && val !== null) {
          queryParams[key] = val;
        }
      });

      // 处理时间范围字段 (根据后端接口要求拆分字段)
      if (paramsData.createDateRange?.length === 2) {
        queryParams.createTimeStart = paramsData.createDateRange[0];
        queryParams.createTimeEnd = paramsData.createDateRange[1];
      }
      if (paramsData.latestChapterTimeRange?.length === 2) {
        queryParams.latestChapterTimeStart =
          paramsData.latestChapterTimeRange[0];
        queryParams.latestChapterTimeEnd = paramsData.latestChapterTimeRange[1];
      }

      const res = await getAdminBookList(queryParams);
      if (res.code === 200 && res.data?.records) {
        dataList.value = res.data.records;
        pagination.total = Number(res.data.total) || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
      }
    } catch (error) {
      ElMessage.error("请求数据失败", error);
    } finally {
      loading.value = false;
    }
  };

  /** 获取分类列表 */
  const fetchCategoryOptions = async (query = "") => {
    categoryLoading.value = true;
    try {
      const res = await getCategoryList({
        page: 1,
        size: 20,
        categoryName: query
      });
      if (res.code === 200 && res.data) {
        categoryOptions.value = res.data.records || [];
      }
    } catch (error) {
      console.error("获取分类失败:", error);
    } finally {
      categoryLoading.value = false;
    }
  };

  /** 修改书籍状态 */
  const handleUpdateStatus = async (row: any, updateParams: any) => {
    const isBookStatus = updateParams.bookStatus !== undefined;
    const typeLabel = isBookStatus ? "审核" : "连载";
    const dictName = isBookStatus ? "bookStatus" : "bookSerialStatus";
    const newValue = isBookStatus
      ? updateParams.bookStatus
      : updateParams.serialStatus;
    const targetLabel = getDictLabel(dictName, newValue);

    const oldBookStatus = row.bookStatus;
    const oldSerialStatus = row.serialStatus;

    try {
      await ElMessageBox.confirm(
        `确定要将《${row.title}》的${typeLabel}状态切换为【${targetLabel}】吗？`,
        "提示",
        { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
      );

      const res = await adminUpdateBookStatus({
        bookId: row.bookId,
        ...updateParams
      });

      if (res.code === 200) {
        ElMessage.success(`${typeLabel}状态更新成功`);
        Object.assign(row, updateParams);
      } else {
        throw new Error(res.msg || "更新失败");
      }
    } catch (error: any) {
      if (error !== "cancel") {
        row.bookStatus = oldBookStatus;
        row.serialStatus = oldSerialStatus;
      }
    }
  };

  // --- 表格列配置 (保持不变) ---
  const columns: TableColumnList = [
    { label: "书籍ID", prop: "bookId", width: 100 },
    { label: "封面", prop: "coverImageUrl", slot: "coverImageUrl", width: 100 },
    { label: "标题", prop: "title", align: "left", width: 150 },
    { label: "语言", prop: "language", align: "left", width: 80 },
    { label: "书籍总字数", prop: "totalWordCountPublished", align: "left" },
    { label: "书籍评分", prop: "rating", align: "left" },
    { label: "书籍浏览量", prop: "bookViews", align: "left" },
    { label: "累计收藏数", prop: "totalFavorites", align: "left" },
    { label: "累计分享数", prop: "totalShares", align: "left" },
    { label: "累计点赞数", prop: "totalLikes", align: "left" },
    { label: "累计评论数", prop: "totalComments", align: "left" },
    {
      label: "连载状态",
      prop: "serialStatus",
      width: 130,
      slot: "serialStatusSwitch"
    },
    {
      label: "审核状态",
      prop: "bookStatus",
      width: 120,
      formatter: ({ bookStatus }) => getDictLabel("bookStatus", bookStatus)
    },
    {
      label: "操作",
      prop: "operation",
      slot: "operation",
      fixed: "right",
      width: 520
    }
  ];

  onMounted(() => {
    refreshDict();
    fetchData();
    fetchCategoryOptions();
  });

  return {
    loading,
    columns,
    dataList,
    pagination,
    adaptiveConfig: { offsetBottom: 110 },
    dictData,
    getDictLabel,
    onSizeChange: val => {
      pagination.pageSize = val;
      fetchData();
    },
    onCurrentChange: val => {
      pagination.currentPage = val;
      fetchData();
    },
    refresh: fetchData,
    handleDeleteBook: async id => {
      try {
        await ElMessageBox.confirm("确定删除该书籍吗？", "警告", {
          type: "error"
        });
        const res = await adminDeleteBook(id);
        if (res.code === 200) {
          ElMessage.success("删除成功");
          fetchData();
        }
      } catch (error) {
        console.log("error", error);
      }
    },
    handleUpdateStatus,
    searchParams: paramsData,
    handleSearch: () => {
      pagination.currentPage = 1;
      fetchData();
    },
    // --- 3. 重置方法也需要补全 ---
    handleReset: () => {
      Object.assign(paramsData, {
        title: "",
        bookId: undefined,
        authorId: undefined,
        penName: "",
        bookStatus: undefined,
        categoryId: undefined,
        serialStatus: undefined,
        isFree: undefined,
        isSigned: undefined,
        language: "",
        createDateRange: [],
        latestChapterTimeRange: []
      });
      pagination.currentPage = 1;
      fetchData();
    },
    categoryOptions,
    categoryLoading,
    remoteMethodCategory: (query: string) => fetchCategoryOptions(query)
  };
}
