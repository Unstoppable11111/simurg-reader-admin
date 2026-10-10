<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { getToken } from "@/utils/auth";
import { ElMessage } from "element-plus";
import { Plus, ZoomIn, Delete } from "@element-plus/icons-vue";

defineOptions({ name: "ReUpload" });

const props = defineProps({
  modelValue: { type: String, default: "" },
  limit: { type: Number, default: 1 },
  tip: { type: String, default: "" }
});

// 新增 loading 事件
const emit = defineEmits(["update:modelValue", "loading"]);

const baseUrl = import.meta.env.VITE_API_URL || "/admin";
const uploadAction = `${baseUrl}/file/upload`;

const previewVisible = ref(false);
const previewImageUrl = ref("");

const headers = computed(() => {
  const token = getToken();
  return token
    ? { Authorization: token.accessToken, RefreshToken: token.refreshToken }
    : {};
});

const fileList = ref([]);

watch(
  () => props.modelValue,
  val => {
    if (val) {
      if (fileList.value.length > 0 && fileList.value[0].url === val) return;
      fileList.value = [{ name: "image", url: val }];
    } else {
      fileList.value = [];
    }
  },
  { immediate: true }
);

// 🟢 新增：上传进度/开始上传
const handleProgress = () => {
  emit("loading", true); // 通知父组件：正在上传，请锁定按钮
};

// 🟢 修改：上传成功逻辑
const handleSuccess = (res: any) => {
  emit("loading", false); // 通知父组件：上传结束，解锁按钮
  if (res.code === 200) {
    emit("update:modelValue", res.data);
    ElMessage.success("上传成功");
  } else {
    fileList.value = [];
    ElMessage.error(res.msg || "上传失败");
  }
};

// 🟢 新增：上传失败逻辑（网络错误等）
const handleError = (err: any) => {
  emit("loading", false); // 通知父组件：上传异常，解锁按钮
  ElMessage.error("接口请求失败");
};

const handleRemove = () => {
  fileList.value = [];
  emit("update:modelValue", "");
};

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
      :on-progress="handleProgress"
      :on-success="handleSuccess"
      :on-error="handleError"
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
    <div v-if="tip || $slots.tip" class="el-upload__tip text-gray-400 text-xs mt-1.5 leading-normal">
      <slot name="tip">{{ tip }}</slot>
    </div>

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
:deep(.hide-add .el-upload--picture-card) {
  display: none;
}

:deep(.el-upload-list--picture-card .el-upload-list__item),
:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}
</style>
