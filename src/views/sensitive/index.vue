<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { addSensitiveWord, updateSensitiveWord } from "@/api/sensitive";
import { ElMessage, type FormInstance } from "element-plus";
import {
  Plus,
  Delete,
  Search,
  Refresh,
  Collection
} from "@element-plus/icons-vue";

const {
  loading,
  columns,
  dataList,
  pagination,
  searchParams,
  dictData,
  getDictLabel,
  fetchData,
  handleBatchDelete,
  onReloadCache
} = useColumns();

const dialogVisible = ref(false);
const ruleFormRef = ref<FormInstance>();
const multiSelection = ref<any[]>([]);

const form = reactive({
  id: undefined,
  word: "",
  level: 1,
  type: 1,
  replaceWord: "",
  status: 1
});

const rules = {
  word: [{ required: true, message: "内容不能为空", trigger: "blur" }],
  level: [{ required: true, message: "请选择级别", trigger: "change" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
};

const handleOpenDialog = (row?: any) => {
  dialogVisible.value = true;
  if (row) {
    Object.assign(form, row);
  } else {
    Object.assign(form, {
      id: undefined,
      word: "",
      level: 1,
      type: 1,
      replaceWord: "",
      status: 1
    });
  }
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      const api = form.id ? updateSensitiveWord : addSensitiveWord;
      const res = await api(form as any);
      if (res.code === 200) {
        ElMessage.success(form.id ? "更新成功" : "添加成功");
        dialogVisible.value = false;
        fetchData();
      }
    }
  });
};

const handleSelectionChange = (val: any[]) => {
  multiSelection.value = val;
};

const onSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};
</script>

<template>
  <div class="main-content p-4">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="关键词">
          <el-input
            v-model="searchParams.word"
            placeholder="搜索内容"
            clearable
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="级别">
          <el-select
            v-model="searchParams.level"
            placeholder="全部"
            clearable
            class="!w-[120px]"
          >
            <el-option
              v-for="i in dictData.sensitiveWordLevel"
              :key="i.key"
              :label="i.value"
              :value="Number(i.key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch"
            >查询</el-button
          >
          <el-button :icon="Plus" @click="handleOpenDialog()">新增</el-button>
          <el-button type="warning" :icon="Collection" @click="onReloadCache"
            >重载缓存</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="multiSelection.length > 0" class="mb-4">
      <el-button
        type="danger"
        :icon="Delete"
        @click="handleBatchDelete(multiSelection.map(v => v.id))"
      >
        批量删除 ({{ multiSelection.length }})
      </el-button>
    </div>

    <pure-table
      row-key="id"
      adaptive
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @selection-change="handleSelectionChange"
      @page-current-change="
        val => {
          pagination.currentPage = val;
          fetchData();
        }
      "
      @page-size-change="
        val => {
          pagination.pageSize = val;
          fetchData();
        }
      "
    >
      <template #level="{ row }">
        <el-tag
          :type="
            row.level === 3 ? 'danger' : row.level === 2 ? 'warning' : 'info'
          "
        >
          {{ getDictLabel("sensitiveWordLevel", row.level) }}
        </el-tag>
      </template>
      <template #type="{ row }">
        <el-tag effect="plain">{{
          getDictLabel("sensitiveWordType", row.type)
        }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'">
          {{ row.status === 1 ? "启用" : "禁用" }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button link type="primary" @click="handleOpenDialog(row)"
          >编辑</el-button
        >
        <el-button link type="danger" @click="handleBatchDelete([row.id])"
          >删除</el-button
        >
      </template>
    </pure-table>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑' : '新增'"
      width="450px"
      destroy-on-close
    >
      <el-form
        ref="ruleFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="pr-4"
      >
        <el-form-item label="词内容" prop="word">
          <el-input v-model="form.word" />
        </el-form-item>
        <el-form-item label="敏感级别" prop="level">
          <el-select v-model="form.level" class="w-full">
            <el-option
              v-for="i in dictData.sensitiveWordLevel"
              :key="i.key"
              :label="i.value"
              :value="Number(i.key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="敏感类型" prop="type">
          <el-select v-model="form.type" class="w-full">
            <el-option
              v-for="i in dictData.sensitiveWordType"
              :key="i.key"
              :label="i.value"
              :value="Number(i.key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="替换词" prop="replaceWord">
          <el-input v-model="form.replaceWord" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm(ruleFormRef)"
          >确认</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>
