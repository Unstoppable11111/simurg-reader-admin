<script setup>
import { ref, reactive, computed } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue"; // 确保引入了图标
import dayjs from "dayjs";
import {
  adminCreateBook,
  adminUpdateBookInfo,
  getAdminBookDetail,
  adminExportBook,
  adminImportBook
} from "@/api/booklist";
// 1. 引入上传组件
import ReUpload from "@/views/components/ReUpload/index.vue";

const {
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  adaptiveConfig,
  onSizeChange,
  onCurrentChange,
  refresh,
  handleDeleteBook,
  handleUpdateStatus,
  searchParams,
  handleSearch,
  handleReset,
  STATUS_MAP,
  categoryOptions,
  categoryLoading,
  remoteMethodCategory
} = useColumns();

// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);
const loadingDetail = ref(false);

// 审核状态选项
const bookStatusOptions = [
  { label: "未发布", value: 0 },
  { label: "审核中", value: 1 },
  { label: "已发布", value: 2 },
  { label: "已下架", value: 3 }
];

// 计算列表内所有封面的预览数组
const coverPreviewList = computed(() =>
  dataList.value.map(v => v.coverImageUrl).filter(Boolean)
);

// 表单数据
const formData = reactive({
  bookId: null,
  title: "",
  description: "",
  protagonistIntroduction: "",
  language: "zh",
  isFree: 0,
  coverImageUrl: "",
  chapterTitle: "",
  chapterContent: "",
  authorTestimonial: "",
  publishDate: "",
  isSigned: 0,
  categoryIdList: []
});

// 校验规则
const rules = {
  title: [{ required: true, message: "请输入书籍标题", trigger: "blur" }],
  description: [{ required: true, message: "请输入书籍描述", trigger: "blur" }],
  coverImageUrl: [
    { required: true, message: "请上传封面图片", trigger: "change" }
  ],
  language: [{ required: true, message: "请输入作品语言", trigger: "blur" }],
  categoryIdList: [
    {
      required: true,
      message: "请至少选择一个作品分类",
      trigger: "change",
      validator: (rule, value, callback) => {
        if (!value || value.length === 0)
          return callback(new Error("请至少选择一个作品分类"));
        callback();
      }
    }
  ],
  chapterTitle: [
    {
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value)
          return callback(new Error("请输入第一章节标题"));
        callback();
      },
      trigger: "blur"
    }
  ],
  chapterContent: [
    {
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value)
          return callback(new Error("请输入第一章节内容"));
        callback();
      },
      trigger: "blur"
    }
  ]
};

const resetForm = () => {
  formData.bookId = null;
  formData.title = "";
  formData.description = "";
  formData.protagonistIntroduction = "";
  formData.coverImageUrl = "";
  formData.language = "zh";
  formData.isFree = 0;
  formData.chapterTitle = "";
  formData.chapterContent = "";
  formData.authorTestimonial = "";
  formData.publishDate = "";
  formData.isSigned = 0;
  formData.categoryIdList = [];
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
      const categoryIdArray = detail.bookCategoryResponseList
        ? detail.bookCategoryResponseList
            .map(c => c.categoryId)
            .filter(id => id !== undefined)
        : [];

      Object.assign(formData, {
        bookId: detail.bookId,
        title: detail.title,
        description: detail.description,
        protagonistIntroduction: detail.protagonistIntroduction || "",
        coverImageUrl: detail.coverImageUrl,
        language: detail.languagestring || detail.language || "zh",
        isFree: detail.isFree,
        isSigned: detail.isSigned,
        publishDate: detail.publishDate
          ? dayjs(detail.publishDate).format("YYYY-MM-DD HH:mm:ss")
          : "",
        authorTestimonial: detail.authorTestimonial || "",
        categoryIdList: categoryIdArray
      });
      if (formRef.value) formRef.value.clearValidate();
    }
  } catch (error) {
    ElMessage.error("获取详情失败");
  } finally {
    loadingDetail.value = false;
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (isEdit.value) {
      const updateData = {
        ...formData,
        publishDate: formData.publishDate
          ? new Date(formData.publishDate).getTime()
          : null
      };
      const res = await adminUpdateBookInfo(updateData);
      if (res.code === 200) ElMessage.success("修改成功");
    } else {
      const res = await adminCreateBook(formData);
      if (res.code == 200) ElMessage.success(`新增成功`);
    }
    dialogVisible.value = false;
    refresh();
  } catch (error) {}
};

// 导入导出逻辑 (保持你原有的不变)
const importRef = ref(null);
const handleExport = async () => {
  /* 保持原样 */
};
const handleImport = () => {
  importRef.value?.click();
};
const uploadFile = async event => {
  /* 保持原样 */
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
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="作者ID">
        <el-input
          v-model.number="searchParams.authorId"
          placeholder="请输入作者ID"
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
            v-for="item in bookStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
          :loading="categoryLoading"
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
        <el-button type="info" @click="handleImport">导入</el-button>
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
      alignWhole="center"
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
          active-text="连载中"
          inactive-text="已完结"
          inline-prompt
          style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          :before-change="
            () =>
              handleUpdateStatus(row, {
                serialStatus: row.serialStatus === 0 ? 1 : 0
              })
          "
        />
      </template>

      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)"
          >编辑</el-button
        >

        <el-dropdown
          trigger="click"
          style="margin-left: 4px"
          @command="cmd => handleUpdateStatus(row, { bookStatus: cmd })"
        >
          <el-button
            size="small"
            :type="
              row.bookStatus === 2
                ? 'success'
                : row.bookStatus === 3
                  ? 'danger'
                  : row.bookStatus === 1
                    ? 'warning'
                    : 'info'
            "
          >
            {{ STATUS_MAP.BOOK[row.bookStatus] || "未知" }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in bookStatusOptions"
                :key="item.value"
                :command="item.value"
                :disabled="item.value === row.bookStatus"
              >
                切换至: {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          type="danger"
          size="small"
          style="margin-left: 4px"
          @click="
            async () => {
              try {
                await ElMessageBox.confirm(
                  `确定删除书籍《${row.title}》？`,
                  '提示',
                  { type: 'warning' }
                );
                await handleDeleteBook(row.bookId);
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
            <ReUpload v-model="formData.coverImageUrl" />
          </el-form-item>

          <el-form-item label="作品分类" prop="categoryIdList">
            <el-select
              v-model="formData.categoryIdList"
              placeholder="多选分类"
              filterable
              multiple
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

          <el-form-item label="主角介绍" prop="protagonistIntroduction">
            <el-input
              v-model="formData.protagonistIntroduction"
              type="textarea"
              :rows="2"
            />
          </el-form-item>

          <el-form-item label="是否免费" prop="isFree">
            <el-radio-group v-model="formData.isFree">
              <el-radio :value="1">是</el-radio>
              <el-radio :value="0">否</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="是否签约" prop="isSigned">
            <el-radio-group v-model="formData.isSigned">
              <el-radio :value="1">是</el-radio>
              <el-radio :value="0">否</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="作品语言" prop="language">
            <el-input v-model="formData.language" />
          </el-form-item>

          <el-form-item v-if="isEdit" label="发布日期" prop="publishDate">
            <el-date-picker
              v-model="formData.publishDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <div v-if="!isEdit">
            <el-divider>创建第一章</el-divider>
            <el-form-item label="章节标题" prop="chapterTitle">
              <el-input v-model="formData.chapterTitle" />
            </el-form-item>
            <el-form-item label="章节内容" prop="chapterContent">
              <el-input
                v-model="formData.chapterContent"
                type="textarea"
                :rows="5"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
