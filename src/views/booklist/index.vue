<script setup>
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import dayjs from "dayjs"; // 引入 dayjs
import {
  adminCreateBook,
  adminUpdateBookInfo,
  getAdminBookDetail,
  adminExportBook,
  adminImportBook
} from "@/api/booklist";

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
console.log(categoryOptions, "categoryOptions----------");

// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);
const loadingDetail = ref(false);

// 2. 审核状态选项
const bookStatusOptions = [
  { label: "未发布", value: 0 },
  { label: "审核中", value: 1 },
  { label: "已发布", value: 2 },
  { label: "已下架", value: 3 }
];

// 3. 表单数据 - 🚨 关键修改: 调整字段名称和新增可选字段
const formData = reactive({
  bookId: null,
  title: "", // 必须
  description: "", // 必须
  protagonistIntroduction: "", // 新增：非必须
  language: "zh", // 必须
  isFree: 0, // 必须
  coverImageUrl: "", // 必须
  chapterTitle: "", // 新增：新增时必须
  chapterContent: "", // 新增：新增时必须
  authorTestimonial: "", // 新增：非必须
  publishDate: "",
  isSigned: 0,
  // 统一用于绑定分类 ID 数组
  categoryIdList: []
});

// 4. 表单校验规则 - 🚨 关键修改: 校验 categoryIdList，并新增/调整字段校验
const rules = {
  title: [{ required: true, message: "请输入书籍标题", trigger: "blur" }],
  description: [{ required: true, message: "请输入书籍描述", trigger: "blur" }],
  coverImageUrl: [
    { required: true, message: "请输入或上传封面图片 URL", trigger: "blur" }
  ],
  language: [{ required: true, message: "请输入作品语言", trigger: "blur" }],
  categoryIdList: [
    {
      required: true,
      message: "请至少选择一个作品分类",
      trigger: "change",
      validator: (rule, value, callback) => {
        // 校验 categoryIdList 数组是否有值
        if (!value || value.length === 0) {
          return callback(new Error("请至少选择一个作品分类"));
        }
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
  formData.protagonistIntroduction = ""; // 重置
  formData.coverImageUrl = "";
  formData.language = "zh";
  formData.isFree = 0;
  formData.chapterTitle = "";
  formData.chapterContent = "";
  formData.authorTestimonial = ""; // 重置
  formData.publishDate = "";
  formData.isSigned = 0;
  formData.categoryIdList = []; // 重置为数组

  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = async row => {
  isEdit.value = true;
  // 1. 确保在打开前和数据加载前清除校验状态
  if (formRef.value) {
    formRef.value.clearValidate();
  }

  resetForm(); // 确保所有字段被重置

  // 确保在数据加载前清除旧表单的验证提示（如果有）
  if (formRef.value) {
    formRef.value.clearValidate();
  }

  // 重新赋值 formData 以防残留旧数据（或者使用 Object.assign 初始化）
  // resetForm(); // 最好还是调用 resetForm 确保所有字段初始化，但要确保它不会导致立即验证

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
        publishDate: dayjs(detail.publishDate).format("YYYY-MM-DD HH:mm:ss"),
        authorTestimonial: detail.authorTestimonial || "",
        // 关键：正确赋值数组
        categoryIdList: categoryIdArray
      });

      // 🚨 核心改动：在数据加载完成后，再次清除校验状态，确保 Select 组件在接收到初始值后没有残留的错误。
      // 使用 nextTick 可能会更稳妥，确保 DOM 更新完成
      // await nextTick(); // 如果不引入 nextTick，先不加
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    } else {
      ElMessage.error(res.msg || "获取书籍详情失败");
      dialogVisible.value = false;
    }
  } catch (error) {
    ElMessage.error("请求书籍详情失败");
    dialogVisible.value = false;
  } finally {
    loadingDetail.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();

    if (isEdit.value) {
      // 编辑逻辑
      const updateInfoData = {
        bookId: formData.bookId,
        title: formData.title,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl,
        language: formData.language,
        isFree: formData.isFree,
        publishDate: new Date(formData.publishDate).getTime(),
        isSigned: formData.isSigned,
        protagonistIntroduction: formData.protagonistIntroduction, // 新增
        authorTestimonial: formData.authorTestimonial, // 新增
        // 🚨 关键修改: 更新接口字段为 categoryIdList
        categoryIdList: formData.categoryIdList
      };

      const resInfo = await adminUpdateBookInfo(updateInfoData);

      if (resInfo.code === 200) {
        ElMessage.success("书籍基本信息修改成功");
      } else {
        ElMessage.error(resInfo.msg || "信息更新失败");
      }
    } else {
      // 新增逻辑
      const createData = {
        title: formData.title,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl,
        language: formData.language,
        isFree: formData.isFree,
        protagonistIntroduction: formData.protagonistIntroduction, // 新增
        authorTestimonial: formData.authorTestimonial, // 新增
        // 🚨 关键修改: 新增接口字段为 categoryIdList
        categoryIdList: formData.categoryIdList,
        chapterTitle: formData.chapterTitle,
        chapterContent: formData.chapterContent
      };
      const res = await adminCreateBook(createData);
      if (res.code == 200) ElMessage.success(`新增成功 (ID: ${res.data})`);
      else ElMessage.error(res.msg || "新增失败");
    }

    dialogVisible.value = false;
    refresh();
  } catch (error) {
    console.error("提交失败:", error);
  }
};

// 导入导出 (保持不变)
const importRef = ref(null);

const handleExport = async () => {
  try {
    const ids = dataList.value
      .map(item => item.bookId)
      .filter(id => id !== undefined);

    const response = await adminExportBook(ids);

    if (!response || !response.data || response.data.size === 0) {
      ElMessage.error("文件内容为空或请求失败");
      return;
    }

    let fileName = "书籍列表.xlsx";
    const contentDisposition = response.headers["content-disposition"];

    if (contentDisposition) {
      const matches = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (matches && matches[1]) {
        fileName = decodeURIComponent(matches[1].replace(/['"]/g, ""));
      }
    }

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`文件 ${fileName} 开始下载`);
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败，请检查网络或后端配置");
  }
};

const handleImport = () => {
  importRef.value?.click();
};
const uploadFile = async event => {
  const target = event.target;
  const file = target.files?.[0];

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await adminImportBook(formData);
      if (res.code === 200) {
        ElMessage.success("导入成功");
        refresh();
      } else {
        ElMessage.error(res.msg || "导入失败");
      }
    } catch (error) {
      ElMessage.error("导入请求失败");
    } finally {
      target.value = "";
    }
  }
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
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="作者ID">
        <el-input
          v-model.number="searchParams.authorId"
          placeholder="请输入作者ID"
          clearable
          style="width: 120px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="书籍状态">
        <el-select
          v-model="searchParams.bookStatus"
          placeholder="请选择状态"
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
          placeholder="请选择/搜索分类"
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
        <el-button @click="refresh">刷新列表</el-button>
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
      ref="tableRef"
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="bookId"
      alignWhole="center"
      :loading="loading"
      :loading-config="loadingConfig"
      :data="dataList"
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #serialStatusSwitch="{ row }">
        <el-switch
          v-model="row.serialStatus"
          :active-value="0"
          :inactive-value="1"
          :before-change="
            () =>
              handleUpdateStatus(row, {
                serialStatus: row.serialStatus === 0 ? 1 : 0
              })
          "
          active-text="连载中"
          inactive-text="已完结"
          inline-prompt
          style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
        />
      </template>

      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)">
          编辑
        </el-button>

        <el-dropdown
          trigger="click"
          style="margin-left: 4px"
          @command="
            command =>
              handleUpdateStatus(row, {
                bookStatus: command
              })
          "
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
              <div>
                <el-dropdown-item
                  v-for="item in bookStatusOptions"
                  :key="item.value"
                  :command="item.value"
                  :disabled="item.value === row.bookStatus"
                >
                  切换至: {{ item.label }}
                </el-dropdown-item>
              </div>
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
                  {
                    type: 'warning',
                    confirmButtonText: '删除',
                    cancelButtonText: '取消'
                  }
                );
                await handleDeleteBook(row.bookId);
              } catch (err) {
                // ...
              }
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
      destroy-on-close
      @close="resetForm"
    >
      <div v-loading="loadingDetail">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
        >
          <el-divider v-if="isEdit">基本信息</el-divider>

          <el-form-item label="书籍标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入书籍标题" />
          </el-form-item>

          <el-form-item label="封面图片URL" prop="coverImageUrl">
            <el-input
              v-model="formData.coverImageUrl"
              placeholder="请输入封面图片 URL"
            />
          </el-form-item>

          <el-form-item label="作品分类" prop="categoryIdList">
            <el-select
              v-model="formData.categoryIdList"
              placeholder="请选择/搜索作品分类 (可多选)"
              filterable
              remote
              multiple
              :loading="categoryLoading"
              :remote-method="remoteMethodCategory"
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
              placeholder="请输入书籍描述"
            />
          </el-form-item>

          <el-form-item label="主角介绍" prop="protagonistIntroduction">
            <el-input
              v-model="formData.protagonistIntroduction"
              type="textarea"
              :rows="2"
              placeholder="请输入主角介绍 (非必填)"
            />
          </el-form-item>

          <!-- <el-form-item label="作者感言" prop="authorTestimonial">
            <el-input
              v-model="formData.authorTestimonial"
              type="textarea"
              :rows="2"
              placeholder="请输入作者的感言 (非必填)"
            />
          </el-form-item> -->

          <el-form-item label="是否免费" prop="isFree">
            <el-radio-group v-model="formData.isFree">
              <el-radio :value="1" label="是" />
              <el-radio :value="0" label="否" />
            </el-radio-group>
          </el-form-item>

          <el-form-item label="是否签约" prop="isSigned">
            <el-radio-group v-model="formData.isSigned">
              <el-radio :value="1" label="是" />
              <el-radio :value="0" label="否" />
            </el-radio-group>
          </el-form-item>

          <el-form-item label="作品语言" prop="language">
            <el-input
              v-model="formData.language"
              placeholder="请输入作品语言"
            />
          </el-form-item>

          <el-form-item v-if="isEdit" label="发布日期" prop="publishDate">
            <el-date-picker
              v-model="formData.publishDate"
              type="datetime"
              placeholder="选择发布日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <div v-if="!isEdit">
            <el-divider>创建第一章</el-divider>
            <el-form-item label="章节标题" prop="chapterTitle">
              <el-input
                v-model="formData.chapterTitle"
                placeholder="请输入第一章节标题"
              />
            </el-form-item>
            <el-form-item label="章节内容" prop="chapterContent">
              <el-input
                v-model="formData.chapterContent"
                type="textarea"
                :rows="5"
                placeholder="请输入第一章节内容"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-form {
  margin-bottom: 16px;
}
</style>
