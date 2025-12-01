<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import { editBannerList, delBannerList, addBannerList } from "@/api/banner";
// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);

// 表单数据（与 API 字段对齐）
const formData = reactive({
  id: null,
  bannerTitle: "",
  imageUrl: "",
  redirectUrl: "",
  linkType: null, // 默认内部页面
  roleTypes: null, // 默认关联作者
  sortOrder: 0,
  status: 1 // 默认启用
});

// 表单规则
const rules = {
  bannerTitle: [
    { required: true, message: "请输入 Banner 标题", trigger: "blur" }
  ],
  imageUrl: [{ required: true, message: "请上传图片", trigger: "blur" }],
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
  Object.assign(formData, { ...row });
  // 🔧 强制转换 roleTypes 为 number（避免字符串 "2" 导致不匹配）
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
  formRef.value?.clearValidate();
};

// 💾 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();

    // TODO: 替换为你的实际 API
    if (isEdit.value) {
      // await updateBanner(formData);
      // ElMessage.success("更新成功");
      const res = await editBannerList(formData);
      if (res.code == 200) ElMessage.success("修改成功");
    } else {
      // await addBanner(formData);
      const res = await addBannerList(formData);
      if (res.code == 200) ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    refresh(); // 刷新列表
  } catch (error) {
    ElMessage.error("提交失败");
  }
};
</script>

<template>
  <div>
    <!-- 🔍 搜索区域 -->
    <el-form :inline="true" class="mb-4">
      <!-- 搜索条件 -->
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

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>

      <!-- ➕ 新增按钮（放在最右边） -->
      <el-form-item style="margin-left: auto">
        <el-button type="primary" @click="openAddDialog">新增 Banner</el-button>
      </el-form-item>
    </el-form>

    <!-- 📋 表格 -->
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
      <!-- 图片插槽 -->
      <template #imageUrl="{ row }">
        <el-image
          preview-teleported
          :src="row.imageUrl"
          :preview-src-list="dataList.map(v => v.imageUrl)"
          fit="cover"
          class="w-[100px]"
        />
      </template>

      <template #roleTypes="{ row }">
        <span
          :style="{
            color:
              row.roleTypes == 2
                ? '#67c23a'
                : row.roleTypes == 3
                  ? '#f56c6c'
                  : '#909399',
            fontWeight: 'bold'
          }"
        >
          {{ row.roleTypes == 2 ? "作者可见" : "读者可见" }}
        </span>
      </template>

      <!-- 状态插槽（带颜色） -->
      <template #status="{ row }">
        <span
          :style="{
            color:
              row.status === 1
                ? '#67c23a'
                : row.status === 0
                  ? '#f56c6c'
                  : '#909399',
            fontWeight: 'bold'
          }"
        >
          {{ row.status === 1 ? "启用" : row.status === 0 ? "禁用" : "—" }}
        </span>
      </template>

      <!-- 操作插槽 -->
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
                await ElMessageBox.confirm('确定删除该 Banner？', '提示', {
                  type: 'warning'
                });
                await delBannerList(row.id);
                ElMessage.success('删除成功');
                refresh();
              } catch (err) {
                if (err !== 'cancel') ElMessage.error('删除失败');
              }
            }
          "
        >
          删除
        </el-button>
      </template>
    </pure-table>

    <!-- 🪟 弹窗表单 -->
    <el-dialog
      :title="isEdit ? '编辑 Banner' : '新增 Banner'"
      v-model="dialogVisible"
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

        <el-form-item label="图片地址" prop="imageUrl">
          <el-input v-model="formData.imageUrl" placeholder="请输入图片 URL" />
          <!-- 建议后续替换为 el-upload -->
        </el-form-item>

        <el-form-item label="跳转地址" prop="redirectUrl">
          <el-input
            v-model="formData.redirectUrl"
            placeholder="请输入跳转链接"
          />
        </el-form-item>

        <el-form-item label="链接类型" prop="linkType">
          <el-select v-model="formData.linkType" placeholder="请选择">
            <el-option :value="0" label="内部页面" />
            <el-option :value="1" label="外部链接" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联角色">
          <!-- 示例：多选角色（根据你实际需求调整） -->
          <el-select v-model="formData.roleTypes" placeholder="全部用户可见">
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
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.main-content {
  width: auto !important;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
