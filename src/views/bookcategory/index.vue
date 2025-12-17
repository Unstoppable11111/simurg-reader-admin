<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  editCategoryList,
  delCategoryList,
  addCategoryList
} from "@/api/bookcategory";
// 引入你之前创建的上传组件
import ReUpload from "@/views/components/ReUpload/index.vue";

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

// 2. 表单数据
const formData = reactive({
  categoryId: null,
  categoryName: "",
  iconImageUrl: "",
  coverImageUrl: "",
  categoryDescription: "",
  sortOrder: 0
});

// 3. 表单校验规则
const rules = {
  categoryName: [
    { required: true, message: "请输入分类名称", trigger: "blur" }
  ],
  iconImageUrl: [
    { required: true, message: "请上传分类 Icon", trigger: "change" }
  ],
  sortOrder: [{ required: true, message: "请输入排序序号", trigger: "blur" }]
};

// --- 预览优化：计算列表内所有的图片用于预览浏览 ---
const iconPreviewList = computed(() =>
  dataList.value.map(v => v.iconImageUrl).filter(Boolean)
);
const coverPreviewList = computed(() =>
  dataList.value.map(v => v.coverImageUrl).filter(Boolean)
);

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑弹窗
const openEditDialog = (row: any) => {
  isEdit.value = true;
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
  Object.assign(formData, {
    categoryId: null,
    categoryName: "",
    iconImageUrl: "",
    coverImageUrl: "",
    categoryDescription: "",
    sortOrder: 0
  });
  if (formRef.value) formRef.value.clearValidate();
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const apiCall = isEdit.value ? editCategoryList : addCategoryList;
    const res = await apiCall(formData);

    if (res.code == 200) {
      ElMessage.success(isEdit.value ? "修改成功" : "新增成功");
      dialogVisible.value = false;
      refresh();
    }
  } catch (error) {
    console.error(error);
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
      <template #imageUrl="{ row, $index }">
        <el-image
          v-if="row.iconImageUrl"
          preview-teleported
          :src="row.iconImageUrl"
          :preview-src-list="iconPreviewList"
          :initial-index="$index"
          fit="contain"
          class="w-[40px] h-[40px] rounded cursor-pointer"
        />
        <span v-else>-</span>
      </template>

      <template #coverImageUrl="{ row, $index }">
        <el-image
          v-if="row.coverImageUrl"
          preview-teleported
          :src="row.coverImageUrl"
          :preview-src-list="coverPreviewList"
          :initial-index="$index"
          fit="cover"
          class="w-[80px] h-[45px] rounded cursor-pointer shadow-sm"
        />
        <span v-else>-</span>
      </template>

      <template #operation="{ row }">
        <el-button type="primary" link @click="openEditDialog(row)"
          >编辑</el-button
        >
        <el-button
          type="danger"
          link
          @click="
            async () => {
              try {
                await ElMessageBox.confirm('确定删除该分类？', '提示', {
                  type: 'warning'
                });
                const res = await delCategoryList(row.categoryId);
                if (res.code === 200) {
                  ElMessage.success('删除成功');
                  refresh();
                }
              } catch (err) {}
            }
          "
        >
          删除
        </el-button>
      </template>
    </pure-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="520px"
      destroy-on-close
      @close="resetForm"
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

        <el-form-item label="分类 Icon" prop="iconImageUrl">
          <ReUpload v-model="formData.iconImageUrl" />
          <div class="text-xs text-gray-400 mt-1">
            建议尺寸 100x100，支持 png/jpg
          </div>
        </el-form-item>

        <el-form-item label="分类封面" prop="coverImageUrl">
          <ReUpload v-model="formData.coverImageUrl" />
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
            style="width: 150px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

:deep(.el-upload--picture-card) {
  --el-upload-picture-card-size: 80px; /* 适当调小分类弹窗内的上传框尺寸 */
}
</style>
