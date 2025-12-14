// src/views/book/book-admin/columns.ts

import {
  getAdminBookList,
  adminDeleteBook,
  adminUpdateBookStatus
} from "@/api/booklist";
// 引入分类 API 方法
import { getCategoryList } from "@/api/bookcategory";
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 状态映射常量
const STATUS_MAP = {
  BOOK: { 0: "未发布", 1: "审核中", 2: "已发布", 3: "已下架" },
  SERIAL: { 0: "连载中", 1: "已完结" }
};

export function useColumns() {
  // --- 书籍列表查询参数 ---
  const paramsData = reactive({
    page: 1,
    size: 20,
    orderDirection: "desc",
    title: "",
    authorId: undefined,
    bookStatus: undefined,
    categoryId: undefined // 筛选分类ID (保持单选，列表筛选常用)
  });

  const dataList = ref([]);
  const loading = ref(true);

  // --- 分类相关状态 ---
  const categoryOptions = ref([]);
  const categoryLoading = ref(false);

  /**
   * 异步获取分类列表
   * @param {boolean} isSearch - 是否为搜索调用 (搜索时 page 总是 1)
   * @param {string} query - 搜索关键词
   */
  const fetchCategoryOptions = async (isSearch = false, query = "") => {
    categoryLoading.value = true;
    try {
      const currentParams = {
        page: 1,
        size: 20, // 默认加载前 20 条，搜索时也只加载前 20 条匹配项
        orderDirection: "asc",
        categoryName: query // 搜索时传入 query
      };

      const res = await getCategoryList(currentParams);

      if (res.code === 200 && res.data) {
        // 假设分页结构是 { records: [], total: 0 }
        categoryOptions.value = res.data.records || [];
      } else {
        if (!isSearch) categoryOptions.value = [];
        ElMessage.warning(res.msg || "获取分类列表失败");
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
      if (!isSearch) categoryOptions.value = [];
    } finally {
      categoryLoading.value = false;
    }
  };

  /**
   * 远程搜索函数：Element-Select 的 remote-method 钩子
   */
  const remoteMethodCategory = query => {
    // 远程搜索的关键：只有当有输入时才触发搜索，否则加载默认列表
    if (query !== "") {
      fetchCategoryOptions(true, query);
    } else {
      // 搜索框清空时，重新加载默认的前 20 条列表
      fetchCategoryOptions(false);
    }
  };

  // 表格列配置 (使用数组字面量)
  const columns = [
    { label: "书籍ID", prop: "bookId" },
    { label: "标题", prop: "title", minWidth: 200 },
    {
      label: "作者信息",
      prop: "authorInfo.penName",
      formatter: ({ authorInfo }) =>
        `${authorInfo?.penName || "-"} (ID: ${authorInfo?.userId || "-"})`
    },
    {
      label: "连载状态",
      prop: "serialStatus",
      width: 120,
      slot: "serialStatusSwitch"
    },
    {
      label: "审核状态",
      prop: "bookStatus",
      width: 100,
      formatter: ({ bookStatus }) => STATUS_MAP.BOOK[bookStatus] || "未知"
    },
    {
      label: "分类",
      prop: "bookCategoryResponseList",
      width: 120,
      // 确保显示所有分类名称，用顿号或逗号分隔
      formatter: ({ bookCategoryResponseList }) =>
        bookCategoryResponseList?.map(c => c.categoryName).join("、") || "无"
    },
    {
      label: "字数(万)",
      prop: "totalWordCountPublished",
      width: 100,
      formatter: ({ totalWordCountPublished }) =>
        totalWordCountPublished
          ? (totalWordCountPublished / 10000).toFixed(2)
          : "0.00"
    },
    {
      label: "操作",
      prop: "operation",
      slot: "operation",
      fixed: "right"
    }
  ];

  // 分页配置
  const pagination = reactive({
    pageSize: 20,
    currentPage: 1,
    pageSizes: [20, 40, 60],
    total: 0,
    align: "right",
    background: true,
    size: "default"
  });

  // Loading 配置
  const loadingConfig = reactive({
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

  const adaptiveConfig = {
    offsetBottom: 110
  };

  // --- 书籍数据获取函数 ---
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
        // 筛选分类ID (保持单选)
        ...(paramsData.categoryId && { categoryId: paramsData.categoryId })
      };

      const res = await getAdminBookList(queryParams);

      if (res.code === 200 && res.data?.records) {
        dataList.value = res.data.records;
        pagination.total = Number(res.data.total) || 0;
      } else {
        dataList.value = [];
        pagination.total = 0;
        if (res.code !== 200) ElMessage.warning(res.msg || "获取书籍列表失败");
      }
    } catch (error) {
      console.error("获取列表失败:", error);
      ElMessage.error("请求失败");
      dataList.value = [];
      pagination.total = 0;
    } finally {
      loading.value = false;
    }
  };

  // 分页切换
  function onSizeChange(val) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    fetchData();
  }

  function onCurrentChange(val) {
    pagination.currentPage = val;
    fetchData();
  }

  // 搜索和重置
  const handleSearch = () => {
    pagination.currentPage = 1;
    fetchData();
  };

  const handleReset = () => {
    paramsData.title = "";
    paramsData.authorId = undefined;
    paramsData.bookStatus = undefined;
    paramsData.categoryId = undefined; // 重置筛选分类ID

    // 重新加载默认分类列表
    fetchCategoryOptions(false);

    pagination.currentPage = 1;
    fetchData();
  };

  // 删除和状态更新函数 (保持不变)
  const handleDeleteBook = async bookId => {
    try {
      const res = await adminDeleteBook(bookId);
      if (res.code === 200) {
        ElMessage.success("删除成功");
        fetchData();
        return true;
      } else {
        ElMessage.error(res.msg || "删除失败");
        return false;
      }
    } catch (error) {
      console.error("删除书籍失败:", error);
      ElMessage.error("请求失败");
      return false;
    }
  };

  const handleUpdateStatus = async (row, updateParams) => {
    const isBookStatus = updateParams.bookStatus !== undefined;
    const typeLabel = isBookStatus ? "审核" : "连载";
    const newValue = isBookStatus
      ? updateParams.bookStatus
      : updateParams.serialStatus;
    const statusMap = isBookStatus ? STATUS_MAP.BOOK : STATUS_MAP.SERIAL;

    const originalStatus = isBookStatus ? row.bookStatus : row.serialStatus;

    if (isBookStatus) {
      row.bookStatus = updateParams.bookStatus;
    } else {
      row.serialStatus = updateParams.serialStatus;
    }

    try {
      await ElMessageBox.confirm(
        `确定要将《${row.title}》的${typeLabel}状态切换为【${statusMap[newValue]}】吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const params = {
        bookId: row.bookId,
        ...updateParams
      };

      const res = await adminUpdateBookStatus(params);

      if (res.code === 200) {
        ElMessage.success(`${typeLabel}状态更新成功`);
      } else {
        if (isBookStatus) {
          row.bookStatus = originalStatus;
        } else {
          row.serialStatus = originalStatus;
        }
        ElMessage.error(res.msg || `${typeLabel}状态更新失败`);
      }
    } catch (error) {
      if (isBookStatus) {
        row.bookStatus = originalStatus;
      } else {
        row.serialStatus = originalStatus;
      }
      if (error !== "cancel") {
        ElMessage.error("请求失败或操作取消");
      }
    }
    return true;
  };

  onMounted(() => {
    fetchData();
    // 初始加载默认的前 20 条分类
    fetchCategoryOptions(false);
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
    handleDeleteBook,
    handleUpdateStatus,
    searchParams: paramsData,
    handleSearch,
    handleReset,
    STATUS_MAP,
    // 导出分类选项、加载状态和远程搜索方法
    categoryOptions,
    categoryLoading,
    remoteMethodCategory
  };
}
