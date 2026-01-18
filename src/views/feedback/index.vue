<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { PureTable } from "@pureadmin/table";
import { updateFeedbackStatus } from "@/api/feedback";
import { ElMessage } from "element-plus";

defineOptions({ name: "FeedbackManagement" });

const {
  loading,
  columns,
  dataList,
  pagination,
  searchParams,
  dictData,
  fetchData,
  handleDelete,
  onSizeChange,
  onCurrentChange,
  getDictLabel
} = useColumns();

const dialogVisible = ref(false);
const submitLoading = ref(false);
const currentRow = ref<any>(null);
const updateForm = reactive({
  status: 0,
  handleResult: ""
});

const handleProcess = (row: any) => {
  currentRow.value = row;
  updateForm.status = row.status;
  updateForm.handleResult = row.handleResult || "";
  dialogVisible.value = true;
};

const confirmUpdate = async () => {
  if (!updateForm.handleResult.trim())
    return ElMessage.warning("请输入处理结果");
  submitLoading.value = true;
  try {
    const res = await updateFeedbackStatus({
      id: currentRow.value.id,
      status: updateForm.status,
      handleResult: updateForm.handleResult
    });
    if (res.code === 200) {
      ElMessage.success("更新成功");
      dialogVisible.value = false;
      fetchData();
    }
  } finally {
    submitLoading.value = false;
  }
};
</script>

<template>
  <div class="main">
    <el-form
      :inline="true"
      :model="searchParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="反馈类型">
        <el-select
          v-model="searchParams.feedbackType"
          placeholder="全部"
          clearable
          class="!w-[160px]"
        >
          <el-option
            v-for="item in dictData.feedbackType"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="反馈状态">
        <el-select
          v-model="searchParams.status"
          placeholder="全部"
          clearable
          class="!w-[160px]"
        >
          <el-option
            v-for="item in dictData.feedbackStatus"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="fetchData"
          >查询</el-button
        >
      </el-form-item>
    </el-form>

    <div class="m-4 p-4 bg-bg_color">
      <pure-table
        border
        adaptive
        align-whole="center"
        row-key="id"
        showOverflowTooltip
        :loading="loading"
        :data="dataList"
        :columns="columns"
        :pagination="pagination"
        @page-size-change="onSizeChange"
        @page-current-change="onCurrentChange"
      >
        <template #feedbackType="{ row }">
          <el-tag
            :type="row.feedbackType === 3 ? 'danger' : 'info'"
            effect="plain"
          >
            {{ getDictLabel("feedbackType", row.feedbackType) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="
              row.status === 2
                ? 'success'
                : row.status === 0
                  ? 'danger'
                  : 'warning'
            "
          >
            {{ getDictLabel("feedbackStatus", row.status) }}
          </el-tag>
        </template>

        <template #operation="{ row }">
          <el-button link type="primary" @click="handleProcess(row)"
            >处理</el-button
          >
          <el-button link type="danger" @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </pure-table>
    </div>

    <el-dialog v-model="dialogVisible" title="反馈状态处理" width="500px">
      <el-form :model="updateForm" label-width="100px">
        <el-form-item label="反馈状态">
          <el-radio-group v-model="updateForm.status">
            <el-radio
              v-for="item in dictData.feedbackStatus"
              :key="item.value"
              :label="Number(item.value)"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input
            v-model="updateForm.handleResult"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的处理方案..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="confirmUpdate"
          >提交</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.main {
  margin: 12px;
}

.search-form {
  border-radius: 8px;
}
</style>
