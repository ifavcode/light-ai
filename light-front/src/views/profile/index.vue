<script setup lang="ts">
import { useUserStore } from '@/stores/userStore';
import dayjs from 'dayjs'

const { user } = useUserStore()

function editProfile() {
  window.$message.warn('暂不支持修改')
}

</script>

<template>
  <div class="shadow bg-white rounded-md p-4">
    <!-- 头部信息 -->
    <div class="flex items-center gap-6 mb-8">
      <!-- 头像 -->
      <div class="w-20 h-20 rounded-full bg-gray-100 overflow-hidden">
        <img :src="user?.avatar" alt="头像" class="w-full h-full object-cover">
      </div>

      <!-- 基本信息 -->
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-gray-800 mb-1">{{ user?.nickname }}</h2>
        <p class="text-gray-500">{{ user?.username }}</p>

        <!-- 统计信息 -->
        <div class="flex gap-6 mt-3">
          <div class="text-center">
            <div class="text-blue-600 font-bold">0</div>
            <div class="text-sm text-gray-500">消耗token</div>
          </div>
          <div class="text-center">
            <div class="text-blue-600 font-bold">0</div>
            <div class="text-sm text-gray-500">对话数</div>
          </div>
          <div class="text-center">
            <div class="text-blue-600 font-bold">0</div>
            <div class="text-sm text-gray-500">站内信</div>
          </div>
        </div>
      </div>

      <!-- 编辑按钮 -->
      <button
        class="self-start px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer active:bg-gray-100 disabled:cursor-not-allowed"
        disabled @click="editProfile">
        编辑资料
      </button>
    </div>

    <!-- 个人简介 -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">个人简介</h3>
      <p class="text-gray-600 leading-relaxed">
        暂无
      </p>
    </div>

    <!-- 详细信息 -->
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="flex items-center py-2 border-t border-gray-100">
        <span class="text-gray-500 w-24">所在地：</span>
        <span class="text-gray-800">未知</span>
      </div>
      <div class="flex items-center py-2 border-t border-gray-100">
        <span class="text-gray-500 w-24">邮箱：</span>
        <span class="text-gray-800">暂无</span>
      </div>
      <div class="flex items-center py-2 border-t border-gray-100">
        <span class="text-gray-500 w-24">GitHub：</span>
        <a href="#" class="text-blue-600 hover:underline">暂无</a>
      </div>
      <div class="flex items-center py-2 border-t border-gray-100">
        <span class="text-gray-500 w-24">加入时间：</span>
        <span class="text-gray-800">{{ dayjs(user?.createTime).format('YYYY年MM月DD日') }}</span>
      </div>
    </div>
  </div>
</template>