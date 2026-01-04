<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useColumns } from "./columns";
import { Search, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const route = useRoute();
const {
  loading,
  columns,
  dataList,
  pagination,
  searchParams,
  fetchData,
  onSizeChange,
  onCurrentChange
} = useColumns();

onMounted(() => {
  // 🟢 必须从 URL 获取 bookId
  const bId = route.query.bookId;
  if (!bId) {
    ElMessage.error("未获取到书籍ID，无法加载评分列表");
    return;
  }

  searchParams.bookId = String(bId);
  fetchData();
});

/** 触发搜索 */
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

/** 重置搜索（保留 bookId） */
const resetSearch = () => {
  // 🟢 注意：重置时不能清空 bookId，因为它从 URL 获取且是必须的
  searchParams.userId = undefined;
  handleSearch();
};
</script>

<template>
  <div class="main-content p-4">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" class="!mb-0">
        <el-form-item label="当前书籍ID">
          <el-input v-model="searchParams.bookId" disabled class="!w-[150px]" />
        </el-form-item>

        <el-form-item label="书籍名称">
          <el-input
            :value="route.query.bookTitle"
            disabled
            placeholder="书籍名称"
            class="!w-[200px]"
          />
        </el-form-item>

        <el-form-item label="用户ID筛选">
          <el-input
            v-model="searchParams.userId"
            placeholder="输入用户ID查询"
            clearable
            class="!w-[180px]"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <pure-table
      row-key="ratingId"
      adaptive
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #rating="{ row }">
        <el-rate
          v-model="row.rating"
          disabled
          show-score
          text-color="#ff9900"
          score-template="{value} 分"
        />
      </template>
    </pure-table>
  </div>
</template>

<style scoped>
/* 保持 Pure Admin 风格的间距 */
.main-content {
  margin: 12px;
}
</style>
