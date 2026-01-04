<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useColumns } from "./columns";
import { ArrowDown, Search, Refresh, Delete } from "@element-plus/icons-vue";

const route = useRoute();
const {
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
} = useColumns();

onMounted(() => {
  // 🟢 核心：从路由获取 bookId 并初始化数据
  if (route.query.bookId) {
    searchParams.bookId = String(route.query.bookId);

    // 1. 加载列表
    fetchData();

    // 2. 加载下拉框前10条数据（修复了你代码中函数名调错的问题）
    remoteSearchChapters();
  }
});

/** 重置搜索 */
const resetSearch = () => {
  searchParams.chapterId = undefined;
  searchParams.userId = undefined;
  searchParams.commentStatus = undefined;
  // 重置后恢复展示默认前10条章节
  remoteSearchChapters();
  fetchData();
};
</script>

<template>
  <div class="main-content p-4">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" class="!mb-0">
        <el-form-item label="所属书籍ID">
          <el-input v-model="searchParams.bookId" disabled class="!w-[150px]" />
        </el-form-item>

        <el-form-item label="书籍名称">
          <el-input
            :value="route.query.bookTitle"
            disabled
            placeholder="书籍名称"
          />
        </el-form-item>

        <el-form-item label="所属章节">
          <el-select
            v-model="searchParams.chapterId"
            filterable
            remote
            reserve-keyword
            placeholder="输入章节标题搜索"
            :remote-method="remoteSearchChapters"
            :loading="selectLoading"
            clearable
            class="!w-[250px]"
            @change="fetchData"
            @focus="!chapterOptions.length && remoteSearchChapters()"
          >
            <el-option
              v-for="item in chapterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="用户ID">
          <el-input
            v-model="searchParams.userId"
            placeholder="输入用户ID"
            clearable
            @change="fetchData"
          />
        </el-form-item>

        <el-form-item label="评论状态">
          <el-select
            v-model="searchParams.commentStatus"
            placeholder="全部状态"
            clearable
            class="!w-[150px]"
            @change="fetchData"
          >
            <el-option
              v-for="item in dictData.bookCommentStatus"
              :key="item.key"
              :label="item.value"
              :value="item.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <pure-table
      row-key="commentId"
      adaptive
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #status="{ row }">
        <el-tag
          :type="
            row.commentStatus === 2
              ? 'success'
              : row.commentStatus === 1
                ? 'warning'
                : row.commentStatus === 3
                  ? 'danger'
                  : 'info'
          "
        >
          {{ getDictLabel("bookCommentStatus", row.commentStatus) }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-dropdown @command="(s: number) => handleStatusChange(row, s)">
          <el-button link type="primary">
            状态切换<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in dictData.bookCommentStatus"
                :key="item.key"
                :command="Number(item.key)"
                :disabled="Number(row.commentStatus) === Number(item.key)"
              >
                切换至：{{ item.value }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          link
          type="danger"
          :icon="Delete"
          class="!ml-4"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </pure-table>
  </div>
</template>

<style scoped>
.ml-4 {
  margin-left: 16px;
}
</style>
