<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useColumns } from "./columns";
import { ElMessage } from "element-plus";
import {
  ArrowDown,
  Reading,
  Comment,
  Star,
  Search,
  Refresh,
  Plus,
  Download,
  Upload
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import {
  adminCreateBook,
  adminUpdateBookInfo,
  getAdminBookDetail,
  adminExportBook,
  adminImportBook,
  adminBookdown_template
} from "@/api/booklist";
import ReUpload from "@/views/components/ReUpload/index.vue";

const router = useRouter();

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
const isUploading = ref(false);
const importRef = ref(null);
const showMore = ref(false); // 控制更多筛选条件的显示

// 跳转逻辑
const goToChapters = row => {
  router.push({
    name: "chapter",
    query: { bookId: String(row.bookId), bookTitle: row.title }
  });
};
const goToComments = row => {
  router.push({
    name: "bookcomment",
    query: { bookId: String(row.bookId), bookTitle: row.title }
  });
};
const goToRating = row => {
  router.push({
    name: "rating",
    query: { bookId: String(row.bookId), bookTitle: row.title }
  });
};

// 封面预览
const coverPreviewList = computed(() =>
  dataList.value.map(v => v.coverImageUrl).filter(Boolean)
);

// 表单数据初始化
const defaultFormData = {
  bookId: null,
  title: "",
  description: "",
  protagonistIntroduction: "",
  authorTestimonial: "",
  language: "zh",
  isFree: 0,
  coverImageUrl: "",
  categoryIdList: [],
  chapterTitle: "",
  chapterContent: ""
};

const formData = reactive({ ...defaultFormData });

const rules = computed(() => ({
  title: [{ required: true, message: "请输入书籍标题", trigger: "blur" }],
  description: [{ required: true, message: "请输入书籍描述", trigger: "blur" }],
  coverImageUrl: [
    { required: true, message: "请上传封面图片", trigger: "change" }
  ],
  categoryIdList: [
    { required: true, message: "请至少选择一个作品分类", trigger: "change" }
  ],
  language: [
    { required: true, message: "请选择或输入作品语言", trigger: "change" }
  ],
  isFree: [{ required: true, message: "请选择是否免费", trigger: "change" }],
  ...(isEdit.value
    ? {}
    : {
        chapterTitle: [
          { required: true, message: "请输入首章章节标题", trigger: "blur" }
        ],
        chapterContent: [
          { required: true, message: "请输入首章正文内容", trigger: "blur" }
        ]
      })
}));

const resetForm = () => {
  Object.assign(formData, defaultFormData);
  isUploading.value = false;
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
        language: detail.languagestring || detail.language || "zh",
        categoryIdList:
          detail.bookCategoryResponseList?.map(c => c.categoryId) || []
      });
    }
  } catch (error) {
  } finally {
    loadingDetail.value = false;
  }
};

const submitForm = async () => {
  if (!formRef.value || isUploading.value) return;
  try {
    await formRef.value.validate();
    let res;
    if (isEdit.value) {
      res = await adminUpdateBookInfo({
        bookId: formData.bookId,
        title: formData.title,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl,
        language: formData.language,
        isFree: formData.isFree,
        protagonistIntroduction: formData.protagonistIntroduction,
        authorTestimonial: formData.authorTestimonial,
        categoryList: formData.categoryIdList
      });
    } else {
      res = await adminCreateBook({
        title: formData.title,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl,
        categoryIdList: formData.categoryIdList,
        language: formData.language,
        isFree: formData.isFree,
        chapterTitle: formData.chapterTitle,
        chapterContent: formData.chapterContent,
        protagonistIntroduction: formData.protagonistIntroduction,
        authorTestimonial: formData.authorTestimonial
      });
    }

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? "修改成功" : "新增成功");
      dialogVisible.value = false;
      refresh();
    }
  } catch (error) {}
};

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
  <div class="main-content p-4">
    <div
      class="search-form-container bg-bg_color p-6 mb-4 rounded-lg shadow-sm border border-gray-100"
    >
      <el-form :model="searchParams" label-width="80px">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="书籍标题">
              <el-input
                v-model="searchParams.title"
                placeholder="请输入标题"
                clearable
                class="!w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="书籍状态">
              <el-select
                v-model="searchParams.bookStatus"
                placeholder="全部"
                clearable
                class="!w-full"
              >
                <el-option
                  v-for="item in dictData.bookStatus || []"
                  :key="item.key"
                  :label="item.value"
                  :value="item.key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="作品分类">
              <el-select
                v-model="searchParams.categoryId"
                placeholder="分类项"
                clearable
                filterable
                remote
                :remote-method="remoteMethodCategory"
                class="!w-full"
              >
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.categoryId"
                  :label="item.categoryName"
                  :value="item.categoryId"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            class="flex justify-end items-start gap-2"
          >
            <el-button type="primary" :icon="Search" @click="handleSearch"
              >搜索</el-button
            >
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            <el-button link type="primary" @click="showMore = !showMore">
              {{ showMore ? "收起" : "更多" }}
              <el-icon class="ml-1" :class="{ 'rotate-180': showMore }"
                ><ArrowDown
              /></el-icon>
            </el-button>
          </el-col>
        </el-row>

        <transition name="el-zoom-in-top">
          <div
            v-show="showMore"
            class="more-filters mt-4 pt-4 border-t border-dashed border-gray-200"
          >
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="书籍ID">
                  <el-input
                    v-model="searchParams.bookId"
                    placeholder="ID"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="作者笔名">
                  <el-input
                    v-model="searchParams.penName"
                    placeholder="笔名"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="作者ID">
                  <el-input
                    v-model="searchParams.authorId"
                    placeholder="作者ID"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="连载状态">
                  <el-select
                    v-model="searchParams.serialStatus"
                    placeholder="全部"
                    clearable
                    class="!w-full"
                  >
                    <el-option label="连载中" :value="0" /><el-option
                      label="已完结"
                      :value="1"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mt-4">
              <el-col :span="6">
                <el-form-item label="是否免费">
                  <el-select
                    v-model="searchParams.isFree"
                    placeholder="全部"
                    clearable
                    class="!w-full"
                  >
                    <el-option label="否" :value="0" /><el-option
                      label="是"
                      :value="1"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="是否签约">
                  <el-select
                    v-model="searchParams.isSigned"
                    placeholder="全部"
                    clearable
                    class="!w-full"
                  >
                    <el-option label="否" :value="0" /><el-option
                      label="是"
                      :value="1"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="作品语言">
                  <el-input
                    v-model="searchParams.language"
                    placeholder="zh/en"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="创建时间">
                  <el-date-picker
                    v-model="searchParams.createDateRange"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                    range-separator="-"
                    class="!w-full"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mt-4">
              <el-col :span="12">
                <el-form-item label="章节更新">
                  <el-date-picker
                    v-model="searchParams.latestChapterTimeRange"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                    range-separator="-"
                    class="!w-full"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </transition>
      </el-form>

      <div class="toolbar-btns flex gap-3 mt-4 pt-4 border-t border-gray-100">
        <el-button type="primary" :icon="Plus" @click="openAddDialog"
          >新增书籍</el-button
        >
        <el-button type="success" :icon="Download" @click="handleExport"
          >导出数据</el-button
        >
        <el-button type="info" :icon="Upload" @click="importRef.click()"
          >批量导入</el-button
        >
        <input
          ref="importRef"
          type="file"
          style="display: none"
          accept=".xls,.xlsx"
          @change="uploadFile"
        />
      </div>
    </div>

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
          :model-value="row.serialStatus"
          :active-value="0"
          :inactive-value="1"
          :active-text="getDictLabel('bookSerialStatus', 0)"
          :inactive-text="getDictLabel('bookSerialStatus', 1)"
          inline-prompt
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          @change="val => handleUpdateStatus(row, { serialStatus: val })"
        />
      </template>

      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)"
          >编辑</el-button
        >
        <el-button
          type="warning"
          size="small"
          :icon="Reading"
          class="ml-2"
          @click="goToChapters(row)"
          >章节</el-button
        >
        <el-button
          color="#626aef"
          size="small"
          :icon="Comment"
          class="ml-2"
          @click="goToComments(row)"
          >评论</el-button
        >
        <el-button
          color="#13ce66"
          size="small"
          :icon="Star"
          class="ml-2"
          @click="goToRating(row)"
          >评分</el-button
        >

        <el-dropdown
          trigger="click"
          class="ml-2"
          @command="cmd => handleUpdateStatus(row, { bookStatus: cmd })"
        >
          <el-button
            size="small"
            :type="String(row.bookStatus) === '2' ? 'success' : 'primary'"
          >
            {{ getDictLabel("bookStatus", row.bookStatus) }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in dictData.bookStatus || []"
                :key="item.key"
                :command="item.key"
              >
                {{ item.value }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          type="danger"
          size="small"
          class="ml-2"
          @click="handleDeleteBook(row.bookId)"
          >删除</el-button
        >
      </template>
    </pure-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑书籍' : '新增书籍'"
      width="840px"
      top="5vh"
      @close="resetForm"
    >
      <div
        v-loading="loadingDetail"
        class="max-h-[75vh] overflow-y-auto px-1 pr-2"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="85px"
          class="book-dialog-form"
        >
          <el-row :gutter="24">
            <!-- 左侧：封面上传（契合 3:4 书籍封面比例） -->
            <el-col :span="8">
              <el-form-item
                label="封面图片"
                prop="coverImageUrl"
                class="book-cover-form-item"
              >
                <div class="flex flex-col items-center w-full">
                  <ReUpload
                    v-model="formData.coverImageUrl"
                    tip="建议尺寸：600 × 800 像素（比例 3:4），大小不超过 2MB，支持 JPG / PNG"
                    class="book-cover-upload"
                    @loading="val => (isUploading = val)"
                  />
                </div>
              </el-form-item>
            </el-col>

            <!-- 右侧：书籍核心属性 -->
            <el-col :span="16">
              <el-form-item label="书籍标题" prop="title">
                <el-input
                  v-model="formData.title"
                  placeholder="请输入书籍名称"
                />
              </el-form-item>

              <el-form-item label="作品分类" prop="categoryIdList">
                <el-select
                  v-model="formData.categoryIdList"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  filterable
                  placeholder="请选择作品分类（支持多选）"
                  class="w-full"
                >
                  <el-option
                    v-for="item in categoryOptions"
                    :key="item.categoryId"
                    :label="item.categoryName"
                    :value="item.categoryId"
                  />
                </el-select>
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="13">
                  <el-form-item label="作品语言" prop="language">
                    <el-select
                      v-model="formData.language"
                      placeholder="选择或输入语言"
                      filterable
                      allow-create
                      class="w-full"
                    >
                      <el-option label="中文 (zh)" value="zh" />
                      <el-option label="英语 (en)" value="en" />
                      <el-option label="日语 (ja)" value="ja" />
                      <el-option label="韩语 (ko)" value="ko" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="11">
                  <el-form-item
                    label="是否免费"
                    prop="isFree"
                    label-width="70px"
                  >
                    <el-radio-group v-model="formData.isFree">
                      <el-radio :value="0">收费</el-radio>
                      <el-radio :value="1">免费</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="主角介绍" prop="protagonistIntroduction">
                <el-input
                  v-model="formData.protagonistIntroduction"
                  placeholder="选填：主要角色介绍或性格设定"
                />
              </el-form-item>

              <el-form-item label="作者感言" prop="authorTestimonial">
                <el-input
                  v-model="formData.authorTestimonial"
                  placeholder="选填：作者写给读者的话"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="书籍描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="书籍简介与故事背景概要..."
            />
          </el-form-item>

          <!-- 初始首章内容（创建新书必填，编辑时通过专门的章节管理维护） -->
          <div
            v-if="!isEdit"
            class="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
          >
            <div
              class="mb-3 font-semibold text-gray-800 text-sm flex items-center gap-2"
            >
              <span class="w-1.5 h-4 bg-primary rounded-full inline-block" />
              <span>初始首章内容</span>
              <span class="text-xs text-gray-400 font-normal"
                >（创建新书必填，后续可在章节列表中管理）</span
              >
            </div>
            <el-form-item label="首章标题" prop="chapterTitle">
              <el-input
                v-model="formData.chapterTitle"
                placeholder="例如：第一章 初入江湖"
              />
            </el-form-item>
            <el-form-item label="首章正文" prop="chapterContent" class="!mb-0">
              <el-input
                v-model="formData.chapterContent"
                type="textarea"
                :rows="5"
                placeholder="请输入首章正文内容..."
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-end gap-3">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="isUploading"
            :disabled="isUploading"
            @click="submitForm"
          >
            {{ isUploading ? "上传中..." : "保存" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.search-form-container {
  background: #fff;
  transition: all 0.3s ease;
}

.ml-2 {
  margin-left: 8px;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

/* 展开图标动画 */
.rotate-180 {
  transform: rotate(180deg);
}

.el-icon {
  transition: transform 0.3s ease;
}

/* 更多筛选背景微调 */
.more-filters {
  padding: 15px;
  background-color: #fafafa;
  border-radius: 4px;
}

/* 仅针对搜索栏表单项清除底部外边距，避免影响弹窗表单 */
.search-form-container :deep(.el-form-item) {
  margin-bottom: 0 !important;
}

.search-form-container :deep(.el-row) {
  margin-bottom: 12px;
}

.search-form-container :deep(.el-row:last-child) {
  margin-bottom: 0;
}

/* 弹窗表单样式优化 */
.book-dialog-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.book-cover-form-item :deep(.el-form-item__label) {
  width: 100% !important;
  justify-content: flex-start;
  margin-bottom: 6px;
  font-weight: 500;
}

.book-cover-form-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 3:4 书籍封面卡片样式 */
.book-cover-upload :deep(.el-upload--picture-card),
.book-cover-upload :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 135px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
}

.book-cover-upload :deep(.el-upload--picture-card) {
  border: 1px dashed #dcdfe6;
  background-color: #fbfbfb;
  transition: all 0.25s ease;
}

.book-cover-upload :deep(.el-upload--picture-card:hover) {
  border-color: var(--el-color-primary, #409eff);
  background-color: #f0f7ff;
}

.book-cover-upload :deep(.el-upload__tip) {
  text-align: center;
  max-width: 190px;
  line-height: 1.4;
  margin-top: 8px;
}
</style>
