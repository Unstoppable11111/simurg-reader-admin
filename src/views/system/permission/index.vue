<template>
  <div class="pure-table-container">
    <el-table
      v-loading="loading"
      :data="dataList"
      :loading="loading"
      row-key="id"
      :expand-row-keys="expandRowKeys"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column
        label="权限名称"
        prop="description"
        align="left"
        class-name="table_first_column"
      >
        <template #default="{ row }">
          <span
            :style="{
              paddingLeft: `${getLevelPadding(row.level || 0)}px`
            }"
          >
            <span class="inline-block mr-1">
              <component
                :is="useRenderIcon(row.icon)"
                v-if="row.icon"
                :style="{ paddingTop: '1px' }"
              />
            </span>
            <span>{{ transformI18n(row.description || "") }}</span>
          </span>
        </template>
      </el-table-column>

      <el-table-column label="权限标识" prop="permKey" />

      <el-table-column label="权限类型" prop="type" width="100">
        <template #default="{ row }">
          <el-tag :type="getPermissionType(row.type)" effect="plain">
            {{ getPermissionTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="ID" prop="id" width="80" />

      <el-table-column label="父级ID" prop="parentId" width="80" />

      <el-table-column label="创建时间" prop="createDate" width="150" />

      <el-table-column label="更新时间" prop="updateDate" width="150" />

      <el-table-column label="操作" fixed="right" width="210">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog('修改', row)">
            修改
          </el-button>
          <el-button link type="primary" @click="handleAddChild(row)">
            添加下级
          </el-button>
          <el-popconfirm
            :title="`确认删除权限【${transformI18n(row.description || '')}】吗？`"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="45%"
      draggable
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="35">
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="权限类型" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio label="M">菜单</el-radio>
                <el-radio label="A">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="父级权限" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="higherPermissionOptions"
                placeholder="选择父级权限"
                clearable
                filterable
                :props="{ value: 'id', label: 'description' }"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="权限标识" prop="permKey">
              <el-input
                v-model="formData.permKey"
                placeholder="请输入权限标识"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="权限描述" prop="description">
              <el-input
                v-model="formData.description"
                placeholder="请输入权限描述"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="图标" prop="icon">
              <el-input
                v-model="formData.icon"
                placeholder="请输入图标类名"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { transformI18n } from "@/plugins/i18n";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission
} from "@/api/permission";
import type { PermissionItem } from "@/api/permission";

// 数据
const loading = ref(true);
const dataList = ref<PermissionItem[]>([]);
const expandRowKeys = ref<number[]>([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formData = ref<Partial<PermissionItem>>({
  type: "M",
  parentId: 0
});
const formRef = ref();
const higherPermissionOptions = ref<PermissionItem[]>([]);

// 表单验证规则
const formRules = {
  permKey: [{ required: true, message: "请输入权限标识", trigger: "blur" }],
  description: [{ required: true, message: "请输入权限描述", trigger: "blur" }]
};

// 获取层级缩进
const getLevelPadding = (level: number) => {
  return level * 20;
};

// 权限类型处理
const getPermissionType = (type: string) => {
  switch (type) {
    case "M":
      return "primary";
    case "A":
      return "info";
    default:
      return "default";
  }
};

const getPermissionTypeText = (type: string) => {
  switch (type) {
    case "M":
      return "菜单";
    case "A":
      return "按钮";
    default:
      return "未知";
  }
};

// 展开/收起行
const toggleExpand = async (row: PermissionItem) => {
  const index = expandRowKeys.value.indexOf(row.id);
  if (index > -1) {
    expandRowKeys.value.splice(index, 1);
  } else {
    expandRowKeys.value.push(row.id);
  }
};

// 获取权限数据
const fetchPermissions = async () => {
  loading.value = true;
  try {
    const { data } = await getPermissionTree();
    dataList.value = formatTreeData(data, 0);
  } catch (error) {
    console.error("获取权限数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 格式化树形数据，添加层级信息
const formatTreeData = (
  nodes: PermissionItem[],
  level: number
): PermissionItem[] => {
  return nodes.map(node => {
    const formattedNode = {
      ...node,
      level
    } as PermissionItem & { level: number };

    if (node.childPermissions && node.childPermissions.length > 0) {
      formattedNode.childPermissions = formatTreeData(
        node.childPermissions,
        level + 1
      );
    }

    return formattedNode;
  });
};

// 格式化上级权限选项
const formatHigherPermissionOptions = (treeList: any[]) => {
  if (!treeList || !treeList.length) return [];

  const newTreeList = [];
  for (let i = 0; i < treeList.length; i++) {
    const item = { ...treeList[i] };
    item.description = transformI18n(item.description || "");
    if (item.childPermissions && item.childPermissions.length > 0) {
      item.children = formatHigherPermissionOptions(item.childPermissions);
    }
    newTreeList.push(item);
  }
  return newTreeList;
};

// 打开对话框
const openDialog = (title: string, row?: PermissionItem) => {
  dialogTitle.value = title;
  higherPermissionOptions.value = formatHigherPermissionOptions(
    JSON.parse(JSON.stringify(dataList.value))
  );

  if (title === "修改" && row) {
    formData.value = {
      ...row,
      menuType: row.type === "M" ? 0 : 3
    };
  } else {
    formData.value = {
      type: "M",
      parentId: 0,
      permKey: "",
      description: "",
      icon: ""
    };
  }

  dialogVisible.value = true;
};

// 添加子权限
const handleAddChild = (parent: PermissionItem) => {
  openDialog("新增", {
    parentId: parent.id,
    type: "M",
    permKey: "",
    description: "",
    icon: ""
  } as PermissionItem);
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();

    if (dialogTitle.value === "新增") {
      await createPermission(formData.value as PermissionItem);
      ElMessage.success("新增权限成功");
    } else {
      await updatePermission(formData.value as PermissionItem);
      ElMessage.success("修改权限成功");
    }

    dialogVisible.value = false;
    fetchPermissions();
  } catch (error) {
    console.error("提交表单失败:", error);
  }
};

// 删除权限
const handleDelete = async (row: PermissionItem) => {
  try {
    await deletePermission(row.id);
    ElMessage.success("删除成功");
    fetchPermissions();
  } catch (error) {
    console.error("删除权限失败:", error);
  }
};

onMounted(() => {
  fetchPermissions();
});
</script>

<style scoped>
.table_first_column {
  padding-left: 20px;
}
</style>
