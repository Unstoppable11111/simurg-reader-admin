<script setup>
import { ref, reactive, computed } from "vue";
import { useColumns } from "./columns";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import {
  adminCreateBook,
  adminUpdateBookInfo,
  getAdminBookDetail,
  adminExportBook,
  adminImportBook
} from "@/api/booklist";
import ReUpload from "@/views/components/ReUpload/index.vue";

const {
  loading,
  columns,
  dataList,
  pagination,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange,
  refresh,
  handleDeleteBook,
  handleUpdateStatus,
  searchParams,
  handleSearch,
  handleReset,
  dictData,
  getDictLabel,
  categoryOptions,
  remoteMethodCategory
} = useColumns();

// --- 状态控制 ---
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);
const loadingDetail = ref(false);
const isUploading = ref(false); // 控制上传状态的核心变量
const importRef = ref(null);

// 封面预览
const coverPreviewList = computed(() =>
  dataList.value.map(v => v.coverImageUrl).filter(Boolean)
);

// 表单数据初始化
const formData = reactive({
  bookId: null,
  title: "",
  description: "",
  protagonistIntroduction: "",
  language: "zh",
  isFree: 0,
  coverImageUrl: "",
  categoryIdList: []
});

// 校验规则
const rules = {
  title: [{ required: true, message: "请输入书籍标题", trigger: "blur" }],
  description: [{ required: true, message: "请输入书籍描述", trigger: "blur" }],
  coverImageUrl: [
    { required: true, message: "请上传封面图片", trigger: "change" }
  ],
  categoryIdList: [
    { required: true, message: "请至少选择一个作品分类", trigger: "change" }
  ]
};

// 重置表单逻辑
const resetForm = () => {
  Object.assign(formData, {
    bookId: null,
    title: "",
    description: "",
    protagonistIntroduction: "",
    language: "zh",
    isFree: 0,
    coverImageUrl: "",
    categoryIdList: []
  });
  isUploading.value = false; // 关闭弹窗时务必重置上传状态
  if (formRef.value) formRef.value.clearValidate();
};

const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = async row => {
  isEdit.value = true;
  resetForm();
  dialogVisible.value = true;
  loadingDetail.value = true;
  try {
    const res = await getAdminBookDetail(row.bookId);
    if (res.code === 200 && res.data) {
      const detail = res.data;
      Object.assign(formData, {
        ...detail,
        categoryIdList:
          detail.bookCategoryResponseList?.map(c => c.categoryId) || []
      });
    }
  } catch (error) {
    ElMessage.error("获取详情失败");
  } finally {
    loadingDetail.value = false;
  }
};

/**
 * 提交表单
 */
const submitForm = async () => {
  if (!formRef.value) return;

  // 核心拦截：如果图片正在上传，拒绝提交请求
  if (isUploading.value) {
    ElMessage.warning("封面图片正在上传中，请稍后再试");
    return;
  }

  try {
    await formRef.value.validate();
    const res = isEdit.value
      ? await adminUpdateBookInfo(formData)
      : await adminCreateBook(formData);

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? "修改成功" : "新增成功");
      dialogVisible.value = false;
      refresh();
    }
  } catch (error) {
    console.error("表单校验失败", error);
  }
};

// 导出与导入逻辑
const handleExport = async () => {
  const ids = dataList.value.map(item => item.bookId).filter(Boolean);
  if (ids.length === 0) return ElMessage.warning("无数据可导出");
  const response = await adminExportBook(ids);
  const blob = new Blob([response.data], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `书籍列表_${dayjs().format("YYYYMMDD")}.xlsx`;
  link.click();
};

const uploadFile = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const res = await adminImportBook(fd);
  if (res.code === 200) {
    ElMessage.success("导入成功");
    refresh();
  }
  event.target.value = "";
};
</script>

<template>
  <div class="main-content">
    <el-form :inline="true" :model="searchParams" class="search-form">
      <el-form-item label="书籍标题">
        <el-input
          v-model="searchParams.title"
          placeholder="请输入标题"
          clearable
        />
      </el-form-item>

      <el-form-item label="书籍状态">
        <el-select
          v-model="searchParams.bookStatus"
          placeholder="状态"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="item in dictData.bookStatus"
            :key="item.key"
            :label="item.value"
            :value="item.key"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="作品分类">
        <el-select
          v-model="searchParams.categoryId"
          placeholder="分类"
          clearable
          filterable
          remote
          :remote-method="remoteMethodCategory"
          style="width: 180px"
        >
          <el-option
            v-for="item in categoryOptions"
            :key="item.categoryId"
            :label="item.categoryName"
            :value="item.categoryId"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>

      <el-form-item style="margin-left: auto">
        <el-button type="primary" @click="openAddDialog">新增书籍</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
        <el-button type="info" @click="importRef.click()">导入</el-button>
        <input
          ref="importRef"
          type="file"
          style="display: none"
          accept=".xls,.xlsx"
          @change="uploadFile"
        />
      </el-form-item>
    </el-form>

    <pure-table
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="bookId"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #coverImageUrl="{ row, $index }">
        <el-image
          v-if="row.coverImageUrl"
          preview-teleported
          :src="row.coverImageUrl"
          :preview-src-list="coverPreviewList"
          :initial-index="$index"
          fit="cover"
          class="w-[50px] h-[70px] rounded shadow-sm cursor-pointer"
        />
        <span v-else>-</span>
      </template>

      <template #serialStatusSwitch="{ row }">
        <el-switch
          v-model="row.serialStatus"
          :active-value="0"
          :inactive-value="1"
          :active-text="getDictLabel('bookSerialStatus', 0)"
          :inactive-text="getDictLabel('bookSerialStatus', 1)"
          inline-prompt
          style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          @change="val => handleUpdateStatus(row, { serialStatus: val })"
        />
      </template>

      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)"
          >编辑</el-button
        >

        <el-dropdown
          trigger="click"
          style="margin-left: 8px"
          @command="cmd => handleUpdateStatus(row, { bookStatus: cmd })"
        >
          <el-button
            size="small"
            :type="
              String(row.bookStatus) === '2'
                ? 'success'
                : String(row.bookStatus) === '3'
                  ? 'danger'
                  : 'warning'
            "
          >
            {{ getDictLabel("bookStatus", row.bookStatus) }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in dictData.bookStatus"
                :key="item.key"
                :command="item.key"
                :disabled="String(item.key) === String(row.bookStatus)"
              >
                切换至: {{ item.value }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          type="danger"
          size="small"
          style="margin-left: 8px"
          @click="handleDeleteBook(row.bookId)"
        >
          删除
        </el-button>
      </template>
    </pure-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑书籍' : '新增书籍'"
      width="600px"
      @close="resetForm"
    >
      <div v-loading="loadingDetail">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
        >
          <el-form-item label="书籍标题" prop="title">
            <el-input v-model="formData.title" />
          </el-form-item>

          <el-form-item label="封面图片" prop="coverImageUrl">
            <ReUpload
              v-model="formData.coverImageUrl"
              @loading="val => (isUploading = val)"
            />
          </el-form-item>

          <el-form-item label="作品分类" prop="categoryIdList">
            <el-select
              v-model="formData.categoryIdList"
              multiple
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="item in categoryOptions"
                :key="item.categoryId"
                :label="item.categoryName"
                :value="item.categoryId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="书籍描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isUploading"
          :disabled="isUploading"
          @click="submitForm"
        >
          {{ isUploading ? "图片上传中..." : "确定保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-form {
  margin-bottom: 16px;
}
</style>
