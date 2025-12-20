import {
  getAdminBookList,
  adminDeleteBook,
  adminUpdateBookStatus
} from "@/api/booklist";
import { getCategoryList } from "@/api/bookcategory";
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
// 🟢 引入你刚才展示的这个文件
import { usePublicDict } from "@/utils/dict";
export function useColumns() {
  // 🟢 这里的解构必须完全对应你 usePublicDict 暴露的名称
  const { dictData, getDictLabel, refreshDict } = usePublicDict();

  const loading = ref(true);
  const dataList = ref([]);

  // --- 分页与查询参数 ---
  const paramsData = reactive({
    page: 1,
    size: 20,
    orderDirection: "desc",
    title: "",
    authorId: undefined,
    bookStatus: undefined,
    categoryId: undefined
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

  // --- 业务请求逻辑 ---
  const fetchData = async () => {
    loading.value = true;
    try {
      const queryParams = {
        page: pagination.currentPage,
        size: pagination.pageSize,
        orderDirection: paramsData.orderDirection,
        ...(paramsData.title && { title: paramsData.title }),
        ...(paramsData.authorId && { authorId: paramsData.authorId }),
        ...(paramsData.bookStatus !== undefined && {
          bookStatus: paramsData.bookStatus
        }),
        ...(paramsData.categoryId && { categoryId: paramsData.categoryId })
      };

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

  /** 获取分类列表（业务数据） */
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

  /** 修改书籍状态（连载/审核） */
  const handleUpdateStatus = async (row: any, updateParams: any) => {
    const isBookStatus = updateParams.bookStatus !== undefined;
    const typeLabel = isBookStatus ? "审核" : "连载";

    // 🟢 使用 getDictLabel
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
        if (isBookStatus) row.bookStatus = updateParams.bookStatus;
      } else {
        throw new Error(res.msg || "更新失败");
      }
    } catch (error: any) {
      if (isBookStatus) {
        row.bookStatus = oldBookStatus;
      } else {
        row.serialStatus = oldSerialStatus;
      }
      if (error !== "cancel") ElMessage.error(error.message || "更新失败");
    }
  };

  // --- 表格列配置 ---
  const columns: TableColumnList = [
    { label: "书籍ID", prop: "bookId", width: 200 },
    { label: "封面", prop: "coverImageUrl", slot: "coverImageUrl", width: 200 },
    { label: "标题", prop: "title", align: "left" },
    { label: "语言", prop: "language", align: "left" },
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
      // 🟢 格式化输出
      formatter: ({ bookStatus }) => getDictLabel("bookStatus", bookStatus)
    },
    {
      label: "操作",
      prop: "operation",
      slot: "operation",
      fixed: "right",
      width: 350
    }
  ];

  onMounted(() => {
    // 🟢 对应你 Hook 里的方法名，虽然 Hook 的 onMounted 已经调了，这里手动调一下 refreshDict 也没问题（双保险）
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

    // 🟢 暴露给 index.vue
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
        console.error("删除失败:", error);
      }
    },
    handleUpdateStatus,
    searchParams: paramsData,
    handleSearch: () => {
      pagination.currentPage = 1;
      fetchData();
    },
    handleReset: () => {
      paramsData.title = "";
      paramsData.bookStatus = undefined;
      paramsData.categoryId = undefined;
      pagination.currentPage = 1;
      fetchData();
    },
    categoryOptions,
    categoryLoading,
    remoteMethodCategory: (query: string) => fetchCategoryOptions(query)
  };
}
