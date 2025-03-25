<script setup lang="ts">
import { Page, User } from "@/api/type";
import { deleteUserApi, getUserPageApi, updateUserApi } from "@/api/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";

defineOptions({
  name: "UserList"
});

async function loadData() {
  try {
    const res = await getUserPageApi({
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

// 对话框相关
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  username: "",
  nickname: "",
  avatar: ""
});

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

// 添加用户
const handleAdd = () => {
  isEdit.value = false;
  Object.keys(form).forEach(key => (form[key] = ""));
  dialogVisible.value = true;
};

// 编辑用户
const handleEdit = row => {
  isEdit.value = true;
  Object.assign(form, row);
  dialogVisible.value = true;
};

// 提交表单
const submitForm = async () => {
  try {
    if (isEdit.value) {
      // 执行更新操作
      await updateUserApi(form.id, {
        username: form.username,
        nickname: form.nickname,
        avatar: form.avatar
      });
    } else {
      // 执行新增操作
      form.id = tableData.value.length + 1;
      tableData.value.unshift({ ...form });
    }
    dialogVisible.value = false;
    ElMessage.success(isEdit.value ? "修改成功" : "添加成功");
    await loadData();
  } catch (error) {
    ElMessage.success(isEdit.value ? "修改失败" : "添加失败");
  }
};

// 删除单个用户
const handleDelete = row => {
  ElMessageBox.confirm("确认删除该用户？", "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteUserApi([row.id]);
    await loadData();
    ElMessage.success("删除成功");
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (!selectedUsers.value.length) {
    ElMessage.warning("请选择要删除的用户");
    return;
  }

  ElMessageBox.confirm("确认删除选中用户？", "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteUserApi(selectedUsers.value);
    await loadData();
    ElMessage.success("删除成功");
  });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="app-container">
    <!-- 功能按钮区 -->
    <div class="mb-4">
      <el-button type="primary" @click="handleAdd">添加用户</el-button>
      <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
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
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="roles" label="角色" width="100">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag v-for="role in row.roles">{{ role.roleSymbol }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="180" />
      <el-table-column label="头像" width="120">
        <template #default="{ row }">
          <el-avatar :size="40" :src="row.avatar" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)"
            >删除</el-button
          >
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

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="30%"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-input v-model="form.avatar" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
