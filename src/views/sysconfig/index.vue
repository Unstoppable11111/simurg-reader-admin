<template>
  <div>
    <el-form :inline="true" class="mb-4 flex justify-between items-center">
      <div class="flex items-center">
        <el-form-item label="配置键" class="mb-0">
          <el-input
            v-model="searchParams.SysConfigTitle"
            placeholder="请输入配置键"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item class="mb-0">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>

        <el-form-item class="mb-0 ml-4">
          <el-button
            type="warning"
            :disabled="multipleSelection.length === 0"
            @click="handleBatchGet"
            >批量获取配置值</el-button
          >
          <el-button
            type="danger"
            :disabled="multipleSelection.length === 0"
            @click="handleBatchDelete"
            >批量删除</el-button
          >
        </el-form-item>
      </div>

      <el-form-item class="mb-0">
        <el-button type="primary" @click="openAddDialog"
          >新增 SysConfig</el-button
        >
      </el-form-item>
    </el-form>

    <pure-table
      ref="tableRef"
      adaptive
      :adaptiveConfig="adaptiveConfig"
      row-key="configKey"
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
      @selection-change="handleSelectionChange"
      @page-size-change="onSizeChange"
      @page-current-change="onCurrentChange"
    >
      <template #imageUrl="{ row }">
        <el-image
          preview-teleported
          :src="row.imageUrl"
          :preview-src-list="dataList.map(v => v.imageUrl)"
          fit="cover"
          class="w-[100px]"
        />
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
                await ElMessageBox.confirm('确定删除该 SysConfig？', '提示', {
                  type: 'warning'
                });
                // 注意：这里仍然使用单条删除 API
                await delSysConfigList(row.configKey);
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

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑系统配置' : '新增系统配置'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="配置键" prop="configKey">
          <el-input
            v-model="formData.configKey"
            placeholder="请输入配置键(configKey)"
          />
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <el-input
            v-model="formData.configValue"
            placeholder="请输入配置值"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="配置描述" prop="description">
          <el-input
            v-model="formData.description"
            placeholder="请输入配置描述"
            type="textarea"
          />
        </el-form-item>

        <!-- <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item> -->
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useColumns } from "./columns";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  editSysConfigList,
  delSysConfigList,
  addSysConfigList,
  batchDeleteSysConfig,
  batchGetSysConfig
} from "@/api/sysconfig";

// 表单相关
const dialogVisible = ref(false);
const formRef = ref();
const isEdit = ref(false);
const multipleSelection = ref<any[]>([]); // 选中项的数据列表

// 用于展示批量获取结果
// const batchResult = ref<any[]>([]); // 移除，因为我们直接用 ElMessageBox 弹窗显示结果

// ✅ 修正：formData 字段必须与配置表的字段对齐，并且是响应式对象
const formData = reactive({
  // 核心字段：对应表格的 prop
  configKey: "", // 配置键(唯一标识)
  configValue: "", // 配置值
  description: "" // 配置描述
  // 状态字段：作为系统配置管理常见属性保留
  // status: 1 // 默认启用 (1)
});

// ✅ 修正：表单规则
const rules = {
  configKey: [
    { required: true, message: "请输入配置键(唯一标识)", trigger: "blur" }
  ],
  configValue: [{ required: true, message: "请输入配置值", trigger: "blur" }]
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

/**
 * 💡 多选状态变化处理
 */
const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val;
};

// 🗑️ 批量删除 (使用 configKey)
const handleBatchDelete = async () => {
  const selectedKeys = multipleSelection.value
    .map(item => item.configKey)
    .filter(Boolean);

  if (selectedKeys.length === 0) {
    ElMessage.warning("请至少选择一个配置项进行删除");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedKeys.length} 个配置项吗？删除后不可恢复！`,
      "批量删除提示",
      { type: "warning" }
    );

    const res = await batchDeleteSysConfig(selectedKeys);

    if (res.code === 200) {
      ElMessage.success(`成功删除了 ${selectedKeys.length} 个配置项`);
      refresh();
    } else {
      ElMessage.error(res.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("批量删除请求失败");
    }
  }
};

// ⚙️ 批量获取配置 (处理返回对象格式)
const handleBatchGet = async () => {
  const selectedKeys = multipleSelection.value
    .map(item => item.configKey)
    .filter(Boolean);

  if (selectedKeys.length === 0) {
    ElMessage.warning("请至少选择一个配置项进行获取");
    return;
  }

  try {
    const res = await batchGetSysConfig(selectedKeys); // 假设后端返回的是对象 { configKey: configValue, ... }

    if (
      res.code === 200 &&
      res.data &&
      typeof res.data === "object" &&
      !Array.isArray(res.data)
    ) {
      const dataObject = res.data as Record<string, string>;
      const displayContent = Object.keys(dataObject)
        .map(key => `**${key}**: ${dataObject[key]}`)
        .join("<br>");

      ElMessageBox.alert(
        `批量获取的配置值如下：<br>${displayContent}`,
        "批量配置值",
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: "确定"
        }
      );
    } else {
      ElMessage.error(res.msg || "批量获取失败或数据格式不匹配");
    }
  } catch (error) {
    ElMessage.error("批量获取配置请求失败");
  }
};

// 🟢 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// ✏️ 打开编辑弹窗
const openEditDialog = (row: any) => {
  isEdit.value = true; // ✅ 修正：逐个属性赋值，确保响应式更新和数据对齐
  formData.configKey = row.configKey;
  formData.configValue = row.configValue;
  formData.description = row.description;
  formData.status = row.status; // 💡 如果您的后端返回数据中包含其他字段（如 SysConfigTitle），此处也应忽略或设置
  // 假设我们只关心核心配置字段。
  formRef.value?.clearValidate();
  dialogVisible.value = true;
};

// 🧹 重置表单
const resetForm = () => {
  // ✅ 修正：只重置核心字段
  formData.configKey = "";
  formData.configValue = "";
  formData.description = "";
  formData.status = 1;
  formRef.value?.clearValidate();
};

// 💾 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();

    if (isEdit.value) {
      // ⚠️ 编辑时传入整个 formData，包含 configKey
      const res = await editSysConfigList(formData);
      if (res.code == 200) ElMessage.success("修改成功");
    } else {
      const res = await editSysConfigList(formData);
      if (res.code == 200) ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    refresh(); // 刷新列表
  } catch (error) {
    ElMessage.error("提交失败");
  }
};
</script>
<style scoped>
.main-content {
  width: auto !important;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 确保 flex 布局中的子项不会换行 */
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.ml-4 {
  margin-left: 1rem;
}

.mb-0 {
  margin-bottom: 0 !important;
}
</style>
