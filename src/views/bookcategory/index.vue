<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  editCategoryList,
  delCategoryList,
  addCategoryList
} from "@/api/bookcategory";

// 1. 从 useColumns 获取数据和方法
const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange,
  searchParams,
  handleSearch,
  handleReset,
  refresh
} = useColumns();

// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);

// 2. 表单数据：完全对应 columns.ts 和 API 需求
const formData = reactive({
  categoryId: null,
  categoryName: "", // 分类名称
  iconImageUrl: "", // Icon 图片
  coverImageUrl: "", // 封面图片
  categoryDescription: "", // 描述
  sortOrder: 0 // 排序
});

// 3. 表单校验规则
const rules = {
  categoryName: [
    { required: true, message: "请输入分类名称", trigger: "blur" }
  ],
  iconImageUrl: [
    { required: true, message: "请输入或上传 Icon 图片", trigger: "blur" }
  ],
  sortOrder: [{ required: true, message: "请输入排序序号", trigger: "blur" }]
};

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑弹窗
const openEditDialog = (row: any) => {
  isEdit.value = true;
  // 使用 Object.assign 复制数据，避免直接赋值导致引用问题
  Object.assign(formData, {
    categoryId: Number(row.categoryId),
    categoryName: row.categoryName,
    iconImageUrl: row.iconImageUrl,
    coverImageUrl: row.coverImageUrl,
    categoryDescription: row.categoryDescription,
    sortOrder: row.sortOrder
  });
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  formData.categoryId = null;
  formData.categoryName = "";
  formData.iconImageUrl = "";
  formData.coverImageUrl = "";
  formData.categoryDescription = "";
  formData.sortOrder = 0;
  // 清除校验结果
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();

    if (isEdit.value) {
      const res = await editCategoryList(formData);
      if (res.code == 200) ElMessage.success("修改成功");
    } else {
      const res = await addCategoryList(formData);
      if (res.code == 200) ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    refresh(); // 刷新列表
  } catch (error) {
    console.error(error);
    // 校验不通过或 API 错误
  }
};
</script>

<template>
  <div class="main-content">
    <el-form :inline="true" class="mb-4">
      <el-form-item label="分类名称">
        <el-input
          v-model="searchParams.categoryName"
          placeholder="请输入分类名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>

      <el-form-item style="margin-left: auto">
        <el-button type="primary" @click="openAddDialog">新增分类</el-button>
      </el-form-item>
    </el-form>

    <pure-table
      ref="tableRef"
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="categoryId"
      alignWhole="center"
      :loading="loading"
      :loading-config="loadingConfig"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #imageUrl="{ row }">
        <el-image
          v-if="row.iconImageUrl"
          preview-teleported
          :src="row.iconImageUrl"
          :preview-src-list="[row.iconImageUrl]"
          fit="contain"
          class="w-[50px] h-[50px]"
        />
        <span v-else>-</span>
      </template>

      <template #coverImageUrl="{ row }">
        <el-image
          v-if="row.coverImageUrl"
          preview-teleported
          :src="row.coverImageUrl"
          :preview-src-list="[row.coverImageUrl]"
          fit="cover"
          class="w-[80px] h-[50px]"
        />
        <span v-else>-</span>
      </template>

      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)">
          编辑
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="
            async () => {
              try {
                await ElMessageBox.confirm('确定删除该分类？', '提示', {
                  type: 'warning',
                  confirmButtonText: '删除',
                  cancelButtonText: '取消'
                });
                const res = await delCategoryList(row.categoryId);
                if (res.code === 200) {
                  ElMessage.success('删除成功');
                  refresh();
                }
              } catch (err) {
                // 取消删除不做处理
              }
            }
          "
        >
          删除
        </el-button>
      </template>
    </pure-table>

    <el-dialog
      :title="isEdit ? '编辑分类' : '新增分类'"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input
            v-model="formData.categoryName"
            placeholder="请输入分类名称"
          />
        </el-form-item>

        <el-form-item label="Icon 地址" prop="iconImageUrl">
          <el-input
            v-model="formData.iconImageUrl"
            placeholder="请输入 Icon 图片 URL"
          />
        </el-form-item>

        <el-form-item label="封面地址" prop="coverImageUrl">
          <el-input
            v-model="formData.coverImageUrl"
            placeholder="请输入封面图片 URL"
          />
        </el-form-item>

        <el-form-item label="分类描述" prop="categoryDescription">
          <el-input
            v-model="formData.categoryDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>

        <el-form-item label="排序序号" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
