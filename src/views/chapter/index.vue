<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useColumns } from "./columns";
import { ArrowDown, Plus, Upload } from "@element-plus/icons-vue";
import { adminUpdateChapterNumber, type ChapterListItem } from "@/api/chapter";
import {
  getAdminChapterDetail,
  adminCreateChapter,
  adminUpdateChapter,
  adminImportChapters,
  adminChapterdown_template
} from "@/api/chapter";
import { ElMessage } from "element-plus";

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
  onCurrentChange
} = useColumns();

// 初始化逻辑
onMounted(() => {
  if (route.query.bookId) {
    searchParams.bookId = String(route.query.bookId);
    // searchParams.bookTitle =
    fetchData();
  }
});

// 弹窗表单状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const formLoading = ref(false);
const formData = reactive({
  bookId: "",
  chapterId: undefined,
  chapterTitle: "",
  chapterNumber: 1,
  chapterContent: "",
  isDrafts: 0
});
const downloadTemplate = async () => {
  const res = await adminChapterdown_template();
  if (res.code === 200 && res.data) {
    const link = document.createElement("a");
    link.href = res.data; // 后端给的绝对路径
    link.style.display = "none";
    // 关键：不设置 target="_blank" 就不会跳新窗口
    link.click();
  }
};
/** 打开弹窗 */
const openDialog = async (row?: any) => {
  if (!searchParams.bookId) return ElMessage.warning("请先指定书籍ID");

  if (row) {
    isEdit.value = true;
    formLoading.value = true;
    dialogVisible.value = true;
    try {
      const res = await getAdminChapterDetail(
        String(row.bookId),
        String(row.chapterId)
      );
      if (res.code === 200) {
        Object.assign(formData, res.data);
      }
    } finally {
      formLoading.value = false;
    }
  } else {
    isEdit.value = false;
    Object.assign(formData, {
      bookId: searchParams.bookId,
      chapterId: undefined,
      chapterTitle: "",
      chapterNumber: pagination.total + 1,
      chapterContent: "",
      isDrafts: 0
    });
    dialogVisible.value = true;
  }
};

/** 快速更新章节序号 */
const quickUpdateNumber = async (row: any, newNumber: number) => {
  if (row.chapterNumber === newNumber) return;

  try {
    // 调用更新接口，注意根据后端要求传参
    // 这里复用 adminUpdateChapter，或者如果是专门的接口请替换
    const res = await adminUpdateChapterNumber({
      bookId: String(row.bookId),
      chapterId: String(row.chapterId),
      chapterNumber: newNumber
      // 如果后端更新序号需要带上标题，请补充：chapterTitle: row.chapterTitle
    } as any);

    if (res.code === 200) {
      ElMessage.success("章节序号更新成功");
      fetchData(); // 刷新列表
    }
  } catch (error) {
    ElMessage.error("章节序号更新失败");
  }
};

/** 提交表单 */
const submitForm = async () => {
  if (!formData.chapterTitle) return ElMessage.warning("请输入章节标题");
  if (!formData.chapterContent) return ElMessage.warning("请输入章节内容");
  try {
    let res;
    if (isEdit.value) {
      res = await adminUpdateChapter({
        bookId: formData.bookId,
        chapterId: String(formData.chapterId),
        chapterTitle: formData.chapterTitle,
        chapterContent: formData.chapterContent
      } as any);
    } else {
      res = await adminCreateChapter({
        bookId: formData.bookId,
        chapterTitle: formData.chapterTitle,
        chapterContent: formData.chapterContent,
        chapterNumber: formData.chapterNumber,
        isDrafts: formData.isDrafts
      } as any);
    }
    dialogVisible.value = false;
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? "修改成功" : "新增成功");
      fetchData();
    } else {
      ElMessage.error(res?.msg || res?.message || "操作异常");
    }
  } catch (error) {
    dialogVisible.value = false;
    ElMessage.error(error?.msg || error?.message || "操作异常");
  }
};

// 导入功能
const importRef = ref<HTMLInputElement>();
const handleImport = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !searchParams.bookId) return;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("bookId", String(searchParams.bookId));

  try {
    const res = await adminImportChapters(fd);
    if (res.code === 200) {
      ElMessage.success("导入成功");
      fetchData();
    }
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
};
</script>

<template>
  <div class="main-content p-4">
    <el-card shadow="never" class="mb-4">
      <div class="flex items-center justify-between">
        <el-form :inline="true" class="!mb-0">
          <el-form-item label="所属书籍ID">
            <el-input
              v-model="searchParams.bookId"
              placeholder="输入BookID"
              disabled
              @change="fetchData"
            />
          </el-form-item>
          <el-form-item label="书籍名称">
            <el-input
              :value="route.query.bookTitle"
              placeholder="输入书籍名称"
              disabled
              @change="fetchData"
            />
          </el-form-item>
          <el-form-item label="章节名称">
            <el-input
              v-model="searchParams.chapterTitle"
              placeholder="输入章节名称"
            />
          </el-form-item>
          <el-form-item label="章节序号">
            <el-input
              v-model="searchParams.chapterNumber"
              placeholder="输入章节序号"
            />
          </el-form-item>
          <el-form-item label="章节状态">
            <el-select
              v-model="searchParams.bookChaptersStatus"
              placeholder="全部状态"
              clearable
              class="!w-[150px]"
            >
              <el-option
                v-for="item in dictData.bookChaptersStatus"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">查询</el-button>
          </el-form-item>
        </el-form>

        <div class="flex items-center gap-2">
          <el-button type="success" :icon="Plus" @click="openDialog()"
            >新增章节</el-button
          >
          <el-button type="warning" plain @click="downloadTemplate">
            下载模板
          </el-button>
          <el-button type="info" :icon="Upload" @click="importRef?.click()"
            >批量导入</el-button
          >
        </div>
      </div>
    </el-card>

    <input
      ref="importRef"
      type="file"
      hidden
      accept=".txt,.zip,.xlsx"
      @change="handleImport"
    />

    <pure-table
      row-key="chapterId"
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
            row.bookChaptersStatus === 2
              ? 'success'
              : row.bookChaptersStatus === 1
                ? 'primary'
                : row.bookChaptersStatus === 3
                  ? 'danger'
                  : 'info'
          "
        >
          {{ getDictLabel("bookChaptersStatus", row.bookChaptersStatus) }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" @click="openDialog(row)"
          >编辑内容</el-button
        >
        <el-popover
          placement="top"
          title="修改章节序号"
          :width="200"
          trigger="click"
        >
          <template #reference>
            <el-button link type="warning" class="ml-2">修改章节序号</el-button>
          </template>
          <div class="flex flex-col gap-2">
            <el-input-number
              v-model="row.tempNumber"
              :min="1"
              size="small"
              class="!w-full"
              @focus="row.tempNumber = row.chapterNumber"
            />
            <el-button
              type="primary"
              size="small"
              @click="quickUpdateNumber(row, row.tempNumber)"
            >
              确定
            </el-button>
          </div>
        </el-popover>
        <el-dropdown
          class="ml-2"
          @command="(s: number) => handleStatusChange(row, s)"
        >
          <el-button link type="primary">
            状态切换<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in dictData.bookChaptersStatus"
                :key="item.key"
                :command="Number(item.key)"
                :disabled="Number(row.bookChaptersStatus) === Number(item.key)"
              >
                切换至：{{ item.value }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-popconfirm title="确定删除该章节吗？" @confirm="handleDelete(row)">
          <template #reference>
            <el-button link type="danger" class="ml-2">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </pure-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑章节内容' : '新增章节'"
      width="850px"
      top="5vh"
      destroy-on-close
    >
      <el-form v-loading="formLoading" :model="formData" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="isEdit ? 16 : 10">
            <el-form-item label="章节标题">
              <el-input
                v-model="formData.chapterTitle"
                placeholder="请输入章节标题"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="章节序号">
              <el-input-number
                v-model="formData.chapterNumber"
                :min="1"
                :disabled="isEdit"
                class="!w-full"
              />
            </el-form-item>
          </el-col>

          <el-col v-if="!isEdit" :span="6">
            <el-form-item label="存为草稿">
              <el-switch
                v-model="formData.isDrafts"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="章节正文">
          <el-input
            v-model="formData.chapterContent"
            type="textarea"
            :rows="18"
            placeholder="在此输入或粘贴章节内容..."
            resize="none"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span v-if="!isEdit" class="mr-4 text-gray-400 text-sm">
          模式：{{
            formData.isDrafts ? "【草稿】保存后不可见" : "【发布】保存后即公开"
          }}
        </span>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认提交数据</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ml-2 {
  margin-left: 8px;
}
</style>
