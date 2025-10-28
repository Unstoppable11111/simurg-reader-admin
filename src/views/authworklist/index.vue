<template>
  <div class="authworklist-box">
    <el-form class="form-box" :model="form" label-width="120px">
      <el-form-item class="form-item" label="作品id：" label-position="left">
        <el-input class="w-[180px]!" v-model="form.workId"/>
      </el-form-item>

      <el-form-item class="form-item" label="作品名称：" label-position="left">
        <el-input class="w-[180px]!" v-model="form.workName"/>
      </el-form-item>

      <el-form-item class="form-item" label="作者QID" label-position="left">
        <el-input class="w-[180px]!" v-model="form.authorQid"/>
      </el-form-item>

      <el-form-item class="form-item" label="作者笔名" label-position="left">
        <el-input class="w-[180px]!" v-model="form.authorPenName"/>
      </el-form-item>

      <el-form-item class="form-item" label="作品语言" label-position="left">
        <el-input class="w-[180px]!" v-model="form.language"/>
      </el-form-item>

      <el-form-item class="form-item" label="作品分类" label-position="left">
        <el-input class="w-[180px]!" v-model="form.category"/>
      </el-form-item>

      <el-form-item class="form-item" label="连载状态" label-position="left">
        <el-input class="w-[180px]!" v-model="form.serialStatus"/>
      </el-form-item>

      <el-form-item class="form-item" label="上架状态" label-position="left">
        <el-input class="w-[180px]!" v-model="form.onlineStatus"/>
      </el-form-item>

      <el-form-item class="form-item" label="签约状态" label-position="left">
        <el-input class="w-[180px]!" v-model="form.contractStatus"/>
      </el-form-item>

      <el-form-item class="button-group">
        <el-button class="query-btn" type="primary">查询</el-button>
        <el-button class="reset-btn">重置</el-button>
      </el-form-item>
    </el-form>


    <el-table :data="tableData" height="250" style="width: 100%">
      <el-table-column prop="bookId" label="作品ID"  />
      <el-table-column prop="bookName" label="作品名称" />
      <el-table-column prop="authorQid" label="作者QID" />
      <el-table-column prop="name" label="作者笔名" />
      <el-table-column prop="level" label="作者等级（SW）" />
      <el-table-column prop="language" label="作品语言" />
      <el-table-column prop="status" label="连载状态" />
      <el-table-column prop="publishStrCount" label="已发布总字数" />
      <el-table-column prop="readerNum" label="累计总阅读人数" />
      <el-table-column prop="collectNum" label="累计总收藏人数" />
      <el-table-column prop="emount" label="累计金豆收入" />
      <el-table-column fixed="right" label="操作" width="120">
        <div class="oper-btn">
          <el-button link type="primary" size="small" @click="queryWorkList()"
            >数据详情</el-button
          >
          <el-button link type="primary" size="small">管理章节</el-button>
          <el-button link type="primary" size="small">修改信息</el-button>
        </div>
      </el-table-column>
    </el-table>

  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { useAuthwork } from './useauthwork';
import { use } from 'echarts/types/src/extension.js';

const {
  queryWorkList
} = useAuthwork();

defineOptions({
  name: "Authworklist"
});

// 定义表单数据对象，与v-model绑定
const form = ref({
  workId: '', // 作品id
  workName: '', // 作品名称
  authorQid: '', // 作者QID
  authorPenName: '', // 作者笔名
  language: '', // 作品语言
  grade: '', // 作品分级
  category: '', // 作品分类
  serialStatus: '', // 连载状态
  onlineStatus: '', // 上架状态
  isExpired: '', // 是否期满
  contractStatus: '', // 签约状态
  vipStatus: '' // 入V状态
});

const tableData = [
  {
    bookId: '6224869',
    bookName: 'Bir Adim Arkanda',
    authorQid: '4485639967',
    name: "Kitaplargerceklerdir",
    level: '1',
    language: '土耳其语',
    status: '连载中',
    publishStrCount: '0',
    readerNum: '0',
    collectNum: '0',
    emount: '0'
  },
  {
    bookId: '6224869',
    bookName: 'Bir Adim Arkanda',
    authorQid: '4485639967',
    name: "Kitaplargerceklerdir",
    level: '1',
    language: '土耳其语',
    status: '连载中',
    publishStrCount: '0',
    readerNum: '0',
    collectNum: '0',
    emount: '0'
  }
]

</script>

<style lang='scss' scoped>
.authworklist-box {
}
.form-box {
  display: flex;
  flex-wrap: wrap;
}
.form-item {
  display: flex !important;
  flex-direction: column;
  margin-right: 10px;
}
.button-group {
  margin-top: 29px;
  margin-left: 0px !important;
}
:deep(.el-form-item__content) {
  margin-left: 0px !important;
}
.oper-btn {
  display: flex;
  flex-wrap: wrap;
}
</style>
