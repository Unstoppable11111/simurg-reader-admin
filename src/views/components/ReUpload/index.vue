<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { getToken } from "@/utils/auth";
import { ElMessage } from "element-plus";
// 引入所需的图标
import { Plus, ZoomIn, Delete } from "@element-plus/icons-vue";

defineOptions({ name: "ReUpload" });

const props = defineProps({
  modelValue: { type: String, default: "" },
  limit: { type: Number, default: 1 }
});

const emit = defineEmits(["update:modelValue"]);

// 1. 统一代理前缀
const baseUrl = import.meta.env.VITE_API_URL || "/admin";
const uploadAction = `${baseUrl}/file/upload`;

// 预览相关的响应式变量
const previewVisible = ref(false);
const previewImageUrl = ref("");

// 2. 自动携带 Token
const headers = computed(() => {
  const token = getToken();
  return token
    ? { Authorization: token.accessToken, RefreshToken: token.refreshToken }
    : {};
});

const fileList = ref([]);

// 3. 监听外部回显
watch(
  () => props.modelValue,
  val => {
    if (val) {
      // 避免重复赋值导致列表闪烁
      if (fileList.value.length > 0 && fileList.value[0].url === val) return;
      fileList.value = [{ name: "image", url: val }];
    } else {
      fileList.value = [];
    }
  },
  { immediate: true }
);

// 上传成功逻辑
const handleSuccess = (res: any) => {
  if (res.code === 200) {
    emit("update:modelValue", res.data);
    ElMessage.success("上传成功");
  } else {
    fileList.value = [];
    ElMessage.error(res.msg || "上传失败");
  }
};

// 移除图片逻辑
const handleRemove = () => {
  fileList.value = [];
  emit("update:modelValue", "");
};

// 🟢 处理预览逻辑
const handlePictureCardPreview = (file: any) => {
  previewImageUrl.value = file.url;
  previewVisible.value = true;
};
</script>

<template>
  <div class="re-upload-container">
    <el-upload
      v-model:file-list="fileList"
      :action="uploadAction"
      :headers="headers"
      list-type="picture-card"
      :limit="limit"
      :on-success="handleSuccess"
      :class="{ 'hide-add': fileList.length >= limit }"
    >
      <el-icon><Plus /></el-icon>

      <template #file="{ file }">
        <div class="w-full h-full">
          <img
            class="el-upload-list__item-thumbnail object-cover"
            :src="file.url"
            alt=""
          />
          <span class="el-upload-list__item-actions">
            <span
              class="el-upload-list__item-preview"
              @click="handlePictureCardPreview(file)"
            >
              <el-icon><ZoomIn /></el-icon>
            </span>
            <span class="el-upload-list__item-delete" @click="handleRemove">
              <el-icon><Delete /></el-icon>
            </span>
          </span>
        </div>
      </template>
    </el-upload>

    <el-dialog
      v-model="previewVisible"
      append-to-body
      title="查看图片"
      width="50%"
    >
      <img
        class="w-full h-auto rounded"
        :src="previewImageUrl"
        alt="Preview Image"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
/* 当有图片时隐藏上传按钮 */
:deep(.hide-add .el-upload--picture-card) {
  display: none;
}

/* 统一缩略图显示尺寸 */
:deep(.el-upload-list--picture-card .el-upload-list__item),
:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}
</style>
