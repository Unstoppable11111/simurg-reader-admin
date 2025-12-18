<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import { editBannerList, delBannerList, addBannerList } from "@/api/banner";
// 引入公共组件
import ReUpload from "@/views/components/ReUpload/index.vue";

// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);
const isUploading = ref(false); // 🟢 新增：图片上传状态

// 表单数据
const formData = reactive({
  id: null,
  bannerTitle: "",
  imageUrl: "",
  redirectUrl: "",
  linkType: null,
  roleTypes: null,
  sortOrder: 0,
  status: 1
});

// 表单规则
const rules = {
  bannerTitle: [
    { required: true, message: "请输入 Banner 标题", trigger: "blur" }
  ],
  imageUrl: [{ required: true, message: "请上传图片", trigger: "change" }],
  redirectUrl: [{ required: true, message: "请输入跳转地址", trigger: "blur" }],
  linkType: [{ required: true, message: "请选择链接类型", trigger: "change" }]
};

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

// 🟢 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// ✏️ 打开编辑弹窗
const openEditDialog = (row: any) => {
  isEdit.value = true;
  resetForm(); // 先重置状态
  Object.assign(formData, { ...row });
  if (typeof formData.roleTypes === "string") {
    formData.roleTypes = Number(formData.roleTypes);
  }
  dialogVisible.value = true;
};

// 🧹 重置表单
const resetForm = () => {
  formData.id = null;
  formData.bannerTitle = "";
  formData.imageUrl = "";
  formData.redirectUrl = "";
  formData.linkType = null;
  formData.roleTypes = null;
  formData.sortOrder = 0;
  formData.status = 1;
  isUploading.value = false; // 🟢 重置上传状态
  formRef.value?.clearValidate();
};

// 💾 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  // 🟢 拦截逻辑：图片上传中不允许提交
  if (isUploading.value) {
    ElMessage.warning("图片正在上传中，请稍后...");
    return;
  }

  try {
    await formRef.value.validate();
    let res;
    if (isEdit.value) {
      res = await editBannerList(formData);
      if (res.code == 200) ElMessage.success("修改成功");
    } else {
      res = await addBannerList(formData);
      if (res.code == 200) ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    refresh();
  } catch (error) {
    // 校验失败或接口报错
    console.error(error);
  }
};
</script>

<template>
  <div>
    <el-form :inline="true" class="mb-4">
      <el-form-item label="Banner标题">
        <el-input
          v-model="searchParams.bannerTitle"
          placeholder="请输入标题"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="链接类型">
        <el-select
          v-model="searchParams.linkType"
          placeholder="全部"
          clearable
          style="width: 120px"
        >
          <el-option :value="0" label="内部页面" />
          <el-option :value="1" label="外部链接" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="searchParams.status"
          placeholder="全部"
          clearable
          style="width: 120px"
        >
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
      <el-form-item style="margin-left: auto">
        <el-button type="primary" @click="openAddDialog">新增 Banner</el-button>
      </el-form-item>
    </el-form>

    <pure-table
      ref="tableRef"
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="id"
      alignWhole="center"
      :loading="loading"
      :loading-config="loadingConfig"
      :data="
        dataList.slice(
          (pagination.currentPage - 1) * pagination.pageSize,
          pagination.currentPage * pagination.pageSize
        )
      "
      :columns="columns"
      :pagination="pagination"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #imageUrl="{ row }">
        <el-image
          preview-teleported
          :src="row.imageUrl"
          :preview-src-list="[row.imageUrl]"
          fit="cover"
          class="w-[100px] h-[50px] rounded"
        />
      </template>

      <template #roleTypes="{ row }">
        <span
          :style="{
            color: row.roleTypes == 2 ? '#67c23a' : '#f56c6c',
            fontWeight: 'bold'
          }"
        >
          {{ row.roleTypes == 2 ? "作者可见" : "读者可见" }}
        </span>
      </template>
      <template #status="{ row }">
        <span
          :style="{
            color: row.status === 1 ? '#67c23a' : '#f56c6c',
            fontWeight: 'bold'
          }"
        >
          {{ row.status === 1 ? "启用" : "禁用" }}
        </span>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="openEditDialog(row)"
          >编辑</el-button
        >
        <el-button
          type="danger"
          size="small"
          @click="
            async () => {
              try {
                await ElMessageBox.confirm('确定删除该 Banner？', '提示', {
                  type: 'warning'
                });
                await delBannerList(row.id);
                ElMessage.success('删除成功');
                refresh();
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
      :title="isEdit ? '编辑 Banner' : '新增 Banner'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="Banner标题" prop="bannerTitle">
          <el-input v-model="formData.bannerTitle" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="上传图片" prop="imageUrl">
          <ReUpload
            v-model="formData.imageUrl"
            @loading="val => (isUploading = val)"
          />
        </el-form-item>

        <el-form-item label="跳转地址" prop="redirectUrl">
          <el-input
            v-model="formData.redirectUrl"
            placeholder="请输入跳转链接"
          />
        </el-form-item>
        <el-form-item label="链接类型" prop="linkType">
          <el-select
            v-model="formData.linkType"
            placeholder="请选择"
            class="w-full"
          >
            <el-option :value="0" label="内部页面" />
            <el-option :value="1" label="外部链接" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联角色">
          <el-select
            v-model="formData.roleTypes"
            placeholder="全部用户可见"
            class="w-full"
          >
            <el-option :value="2" label="作者可见" />
            <el-option :value="3" label="读者可见" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isUploading"
          :disabled="isUploading"
          @click="submitForm"
        >
          {{ isUploading ? "上传中..." : "保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
