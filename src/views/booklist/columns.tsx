import {
  getAdminBookList,
  adminDeleteBook,
  adminUpdateBookStatus
} from "@/api/booklist";
import { getCategoryList } from "@/api/bookcategory";
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDictStoreHook } from "@/store/modules/dict";

export function useColumns() {
  const dictStore = useDictStoreHook();
  const loading = ref(true);
  const dataList = ref([]);

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

  // 字典辅助工具
  const getLabel = (dictName: string, keyValue: any) => {
    const list = dictStore.dictData[dictName] || [];
    const item = list.find(i => String(i.key) === String(keyValue));
    return item ? item.value : "未知";
  };

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
    } catch (_error) {
      // 修复：error -> _error
      ElMessage.error("请求失败", _error);
    } finally {
      loading.value = false;
    }
  };

  const fetchCategoryOptions = async (_isSearch = false, query = "") => {
    // 修复：isSearch -> _isSearch
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

  // 修改状态（连载/审核）
  const handleUpdateStatus = async (row: any, updateParams: any) => {
    const isBookStatus = updateParams.bookStatus !== undefined;
    const typeLabel = isBookStatus ? "审核" : "连载";
    const dictName = isBookStatus ? "bookStatus" : "bookSerialStatus";
    const newValue = isBookStatus
      ? updateParams.bookStatus
      : updateParams.serialStatus;

    const targetLabel = getLabel(dictName, newValue);
    const rollbackValue = isBookStatus
      ? row.bookStatus
      : newValue === 0
        ? 1
        : 0;

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
        throw new Error(res.msg);
      }
    } catch (error: any) {
      // 回滚数据
      if (isBookStatus) {
        row.bookStatus = rollbackValue;
      } else {
        row.serialStatus = rollbackValue;
      }

      if (error !== "cancel") ElMessage.error(error.message || "更新失败");
    }
  };

  const columns: TableColumnList = [
    { label: "书籍ID", prop: "bookId", width: 90 },
    { label: "封面", prop: "coverImageUrl", slot: "coverImageUrl", width: 100 },
    { label: "标题", prop: "title", align: "left" },
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
      formatter: ({ bookStatus }) => getLabel("bookStatus", bookStatus)
    },
    {
      label: "操作",
      prop: "operation",
      slot: "operation",
      fixed: "right",
      width: 220
    }
  ];

  onMounted(() => {
    fetchData();
    fetchCategoryOptions(false);
  });

  return {
    loading,
    columns,
    dataList,
    pagination,
    adaptiveConfig: { offsetBottom: 110 },
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
      } catch (_e) {
        // 修复：e -> _e
        console.error(_e, "删除失败");
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
      fetchData();
    },
    dictData: dictStore.dictData,
    getDictLabel: getLabel,
    categoryOptions,
    categoryLoading,
    remoteMethodCategory: (query: string) =>
      fetchCategoryOptions(query !== "", query)
  };
}
