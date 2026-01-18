<template>
  <div class="pure-table-container">
    <div class="flex justify-between mb-4">
      <!-- 根据权限树查询菜单 -->
      <el-input
        v-model="searchKeyword"
        placeholder="请输入菜单名称"
        clearable
        style="width: 200px; margin-right: 10px"
        @input="handleSearch"
      />

      <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
        新增菜单
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="dataList"
      :loading="loading"
      row-key="id"
    >
      <el-table-column
        label="菜单名称"
        prop="title"
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
            <span>{{ transformI18n(row.title || "") }}</span>
          </span>
        </template>
      </el-table-column>

      <el-table-column label="菜单类型" prop="menuType" width="100">
        <template #default="{ row }">
          <el-tag :type="getMenuType(row.menuType)" effect="plain">
            {{ getMenuTypeText(row.menuType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="路由地址" prop="path" />

      <!-- <el-table-column label="权限标识" prop="auths" /> -->

      <el-table-column label="上级菜单">
        <template #default="{ row }">
          {{ getParentMenuTitle(row.parentId) }}
        </template>
      </el-table-column>

      <el-table-column label="ID" prop="id" width="80" />

      <el-table-column label="排序" prop="sortOrder" width="80" />

      <el-table-column label="操作" fixed="right" width="210">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog('修改', row)">
            修改
          </el-button>
          <el-button link type="primary" @click="handleAddChild(row)">
            添加下级
          </el-button>
          <el-popconfirm
            :title="`确认删除菜单【${transformI18n(row.title || '')}】吗？`"
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
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="formData.menuType">
                <el-radio :label="0" :value="0">菜单</el-radio>
                <el-radio :label="3" :value="3">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="上级菜单" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="higherMenuOptions"
                placeholder="选择上级菜单"
                clearable
                filterable
                :props="{
                  value: 'id',
                  label: 'title',
                  children: 'children',
                  disabled: 'disabled'
                }"
                :check-strictly="true"
                node-key="id"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="菜单名称" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入菜单名称"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="路由地址" prop="path">
              <el-input
                v-model="formData.path"
                placeholder="请输入路由地址"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col
            v-if="formData.menuType !== 3"
            :xs="24"
            :sm="12"
            :md="12"
            :lg="12"
            :xl="12"
          >
            <el-form-item label="组件路径" prop="component">
              <el-input
                v-model="formData.component"
                placeholder="请输入组件路径"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col
            v-if="formData.menuType === 3"
            :xs="24"
            :sm="12"
            :md="12"
            :lg="12"
            :xl="12"
          >
            <el-form-item label="权限标识" prop="auths">
              <el-input
                v-model="formData.auths"
                placeholder="请输入权限标识"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="图标" prop="icon">
              <IconSelect v-model="formData.icon" class="w-full" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="formData.sortOrder"
                placeholder="请输入排序"
                :min="0"
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <!-- <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="是否缓存">
              <el-switch v-model="formData.keepAlive" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="显示链接">
              <el-switch v-model="formData.showLink" />
            </el-form-item>
          </el-col> -->
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
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CirclePlus } from "@element-plus/icons-vue";
import { transformI18n } from "@/plugins/i18n";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission
} from "@/api/permission";
import type { PermissionItem } from "@/api/permission";
import { transformPermissionToPureMenus } from "@/utils/utils";
import { IconSelect } from "@/components/ReIcon";

// 数据
const loading = ref(true);
const dataList = ref<any[]>([]);
const originalDataList = ref<any[]>([]); // 存储原始数据
const searchKeyword = ref(""); // 搜索关键词

// 查询参数
const queryParams = ref({
  parentId: undefined
});

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formData = ref<any>({
  menuType: 0,
  parentId: 0,
  title: "",
  path: "",
  component: "",
  auths: "",
  icon: "",
  sortOrder: 99,
  frameSrc: "",
  frameLoading: true,
  keepAlive: false,
  showLink: true
});
const formRef = ref();
const higherMenuOptions = ref<any[]>([]);

// 表单验证规则
const formRules = {
  title: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入路由地址", trigger: "blur" }],
  menuType: [{ required: true, message: "请选择菜单类型", trigger: "change" }],
  icon: [{ required: false, message: "请选择图标", trigger: "change" }],
  parentId: [{ required: false, message: "请选择上级菜单", trigger: "change" }],
  auths: [
    // 仅当菜单类型为按钮(3)时才必填权限标识
    {
      validator: (rule, value, callback) => {
        if (formData.value.menuType === 3 && !value) {
          callback(new Error("按钮类型必须填写权限标识"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

// 获取层级缩进
const getLevelPadding = (level: number) => {
  return level * 20;
};

// 菜单类型处理
const getMenuType = (type: number) => {
  switch (type) {
    case 0:
      return "primary";
    case 3:
      return "info";
    default:
      return "default";
  }
};

const getMenuTypeText = (type: number) => {
  switch (type) {
    case 0:
      return "菜单";
    case 3:
      return "按钮";
    default:
      return "未知";
  }
};

// 获取上级菜单标题
const getParentMenuTitle = (parentId: number) => {
  if (parentId === 0) {
    return "主菜单";
  }

  const findTitle = (items: any[]): string => {
    for (const item of items) {
      if (item.id === parentId) {
        return item.title ? transformI18n(item.title) : "";
      }
      if (item.children && item.children.length > 0) {
        const found = findTitle(item.children);
        if (found) return found;
      }
    }
    return "";
  };
  console.log("dataList.value:", dataList.value);

  return findTitle(dataList.value) || "";
};

// 搜索过滤树形数据
const filterTreeData = (data: any[], keyword: string) => {
  if (!keyword) {
    return data;
  }

  const searchLower = keyword.toLowerCase();

  const filterRecursively = (nodes: any[]) => {
    return nodes.filter(node => {
      // 检查当前节点是否匹配
      const isMatch =
        node.title && node.title.toLowerCase().includes(searchLower);

      // 检查子节点是否有匹配项
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterRecursively(node.children);

        // 如果子节点有匹配项，则当前节点也要保留
        if (filteredChildren.length > 0) {
          // 创建新节点并更新children
          node.children = filteredChildren;
          return true;
        }
      }

      // 返回当前节点是否匹配
      return isMatch;
    });
  };

  return filterRecursively(data);
};

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    // 如果搜索关键词为空，显示原始数据
    dataList.value = [...originalDataList.value];
  } else {
    // 否则根据关键词过滤数据
    dataList.value = filterTreeData(
      [...originalDataList.value],
      searchKeyword.value.trim()
    );
  }
};

// 处理查询
const handleQuery = () => {
  // 重新获取数据
  fetchPermissions();
};

// 获取权限数据
const fetchPermissions = async () => {
  loading.value = true;
  try {
    const { data } = await getPermissionTree();
    // 将权限数据转换为Pure Admin菜单格式
    const transformedData = transformPermissionToPureMenus(data);

    // 保存原始数据
    originalDataList.value = [...transformedData];

    // 如果有搜索关键词，进行过滤；否则显示全部
    if (searchKeyword.value.trim()) {
      dataList.value = filterTreeData(
        transformedData,
        searchKeyword.value.trim()
      );
    } else {
      dataList.value = [...transformedData];
    }
  } catch (error) {
    console.error("获取权限数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 格式化上级菜单选项
const formatHigherMenuOptions = (treeList: any[]) => {
  // 添加主菜单选项
  const options = [
    {
      id: 0,
      title: "主菜单",
      disabled: false,
      children: [] // 添加空的children属性以保持结构一致性
    }
  ];

  // 直接使用原始树形结构，不进行扁平化处理
  const treeOptions = treeList.map(item => ({
    ...item,
    title: item.title || item.description || item.permKey || "",
    children: item.children ? formatTreeChildren(item.children) : []
  }));

  return options.concat(treeOptions);
};

// 递归处理子菜单
function formatTreeChildren(children: any[]) {
  return children.map(item => ({
    ...item,
    title: item.title || item.description || item.permKey || "",
    children: item.children ? formatTreeChildren(item.children) : []
  }));
}

// 打开对话框
const openDialog = (title: string, row?: any) => {
  dialogTitle.value = title;

  higherMenuOptions.value = formatHigherMenuOptions(dataList.value);
  console.log("Higher menu options:", higherMenuOptions.value);

  if (title === "修改" && row) {
    // 修改时，回显当前的菜单类型和上级菜单
    formData.value = {
      id: row.id,
      menuType: row.menuType,
      parentId: row.parentId,
      title: row.title || "",
      name: row.name || "",
      path: row.path || "",
      component: row.component || "",
      sortOrder: row.sortOrder || 99,
      redirect: row.redirect || "",
      icon: row.icon || "", // 确保图标值正确回显
      extraIcon: row.extraIcon || "",
      enterTransition: row.enterTransition || "",
      leaveTransition: row.leaveTransition || "",
      activePath: row.activePath || "",
      auths: row.auths || "",
      frameSrc: row.frameSrc || "",
      frameLoading: row.frameLoading !== undefined ? row.frameLoading : true,
      keepAlive: row.keepAlive || false,
      hiddenTag: row.hiddenTag || false,
      fixedTag: row.fixedTag || false,
      showLink: row.showLink !== undefined ? row.showLink : true,
      showParent: row.showParent || false
    };
  } else {
    // 新增时，如果是添加子菜单则使用传入的parentId，否则默认为0
    const parentId = row?.parentId !== undefined ? row.parentId : 0;

    formData.value = {
      menuType: row?.menuType ?? 0,
      parentId: parentId, // 使用传入的parentId或默认为0
      title: row?.title ?? "",
      path: row?.path ?? "",
      component: row?.component ?? "",
      auths: row?.auths ?? "",
      icon: row?.icon ?? "", // 保持为空，避免组件初始化错误
      sortOrder: row?.sortOrder ?? 99,
      frameSrc: row?.frameSrc ?? "",
      frameLoading: row?.frameLoading ?? true,
      keepAlive: row?.keepAlive ?? false,
      showLink: row?.showLink ?? true,
      name: row?.name ?? "",
      redirect: row?.redirect ?? "",
      extraIcon: row?.extraIcon ?? "",
      enterTransition: row?.enterTransition ?? "",
      leaveTransition: row?.leaveTransition ?? "",
      activePath: row?.activePath ?? "",
      frameLoading: row?.frameLoading ?? true,
      hiddenTag: row?.hiddenTag ?? false,
      fixedTag: row?.fixedTag ?? false,
      showParent: row?.showParent ?? false
    };
  }

  dialogVisible.value = true;
};

// 处理创建新菜单
const handleCreate = () => {
  openDialog("新增");
};

// 添加子菜单
const handleAddChild = (parent: any) => {
  openDialog("新增", {
    menuType: 0,
    parentId: parent.id,
    title: "",
    path: "",
    component: "",
    auths: "",
    icon: "", // 确保图标为空
    sortOrder: 99,
    frameSrc: "",
    frameLoading: true,
    keepAlive: false,
    showLink: true
  });
};

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate();

    // 将表单数据转换为权限数据格式
    const permissionData: PermissionItem = {
      id: formData.value.id,
      parentId: formData.value.parentId,
      permKey: formData.value.path || formData.value.permKey,
      description: formData.value.title,
      type: formData.value.menuType === 3 ? "A" : "M", // 按钮类型为A，其他为M
      icon: formData.value.icon || "", // 确保图标值不为undefined
      auths: formData.value.auths,
      // 将菜单字段映射到权限字段
      menuType: formData.value.menuType,
      name: formData.value.name,
      component: formData.value.component,
      sortOrder: formData.value.sortOrder,
      redirect: formData.value.redirect,
      extraIcon: formData.value.extraIcon,
      enterTransition: formData.value.enterTransition,
      leaveTransition: formData.value.leaveTransition,
      activePath: formData.value.activePath,
      frameSrc: formData.value.frameSrc,
      frameLoading: formData.value.frameLoading,
      keepAlive: formData.value.keepAlive,
      hiddenTag: formData.value.hiddenTag,
      fixedTag: formData.value.fixedTag,
      showLink: formData.value.showLink,
      showParent: formData.value.showParent,
      childPermissions: [] // 新增时通常为空
    };

    if (dialogTitle.value === "新增") {
      await createPermission(permissionData);
      ElMessage.success("新增菜单成功");
    } else {
      await updatePermission(permissionData);
      ElMessage.success("修改菜单成功");
    }

    dialogVisible.value = false;
    fetchPermissions();
  } catch (error) {
    console.error("提交表单失败:", error);
  }
};

// 删除菜单
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除菜单【${transformI18n(row.title || "")}】吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deletePermission(row.id);
    ElMessage.success("删除成功");
    fetchPermissions();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除菜单失败:", error);
    }
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
