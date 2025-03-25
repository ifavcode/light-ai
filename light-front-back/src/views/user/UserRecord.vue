<script setup lang="ts">
import { Page, User } from "@/api/type";
import { getUserRecordPageApi } from "@/api/user";
import { onMounted, ref } from "vue";

defineOptions({
  name: "UserList"
});

async function loadData() {
  try {
    const res = await getUserRecordPageApi({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      username: searchKeyword.value
    });
    userList.value = res.data;
    tableData.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {}
}

const userList = ref<Partial<Page<User[]>>>({});

// 表格数据
const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref("");
const selectedUsers = ref([]);

// 日期格式化
const formatDate = dateString => {
  return new Date(dateString).toLocaleString();
};

// 分页处理
const handleSizeChange = val => {
  pageSize.value = val;
  loadData();
};

const handlePageChange = val => {
  currentPage.value = val;
  loadData();
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

// 多选处理
const handleSelectionChange = selection => {
  selectedUsers.value = selection.map(item => item.id);
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="app-container">
    <!-- 功能按钮区 -->
    <div class="mb-4">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名"
        style="width: 200px; margin-left: 10px"
        @keyup.enter="handleSearch"
        clearable
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="头像" width="100">
        <template #default="{ row }">
          <el-avatar v-if="row.user" :size="40" :src="row.user.avatar" />
        </template>
      </el-table-column>
      <el-table-column label="昵称" width="112">
        <template #default="{ row }">
          <p class="line-clamp-1 w-28">
            {{ row.user ? row.user.nickname : "匿名用户" }}
          </p>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="rowIp" label="rowIP" width="180" /> -->
      <el-table-column prop="ip" label="IP" width="180" />
      <el-table-column prop="agent" label="agent" />
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      class="mt-4"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 30, 40]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>
