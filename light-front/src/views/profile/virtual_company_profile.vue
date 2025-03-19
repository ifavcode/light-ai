<script setup lang="ts">
import { getVirtualCompoanyListApi } from '@/api/ai-tools';
import type { VirtualCompany } from '@/types';
import dayjs from 'dayjs';

const vcList = ref<VirtualCompany[]>([])

async function getVirtualCompoanyList() {
  try {
    const { data: res } = await getVirtualCompoanyListApi()
    vcList.value = res.data
  } catch (error) {

  }
}

onMounted(() => {
  getVirtualCompoanyList()
})

</script>

<template>
  <div class="w-full flex gap-4 flex-col">
    <div v-if="vcList.length === 0" class="bg-white p-4 rounded-md">
      <p class="text-gray-600">
        <span>你还没有使用记录哦，快去试试吧</span>
        <span class="text-blue-500 font-semibold ml-2 underline cursor-pointer"
          @click="$router.push('/ai_tools')">GO</span>
      </p>
    </div>
    <div v-for="item in vcList" class="">
      <div class="shadow-md cursor-pointer px-4 py-6 rounded-md bg-white hover:bg-gray-100 transition-all duration-100">
        <div class="flex flex-col md:flex-row md:items-start gap-4">
          <!-- 左侧用户信息 -->
          <div class="flex items-center md:block md:w-40">
            <a-avatar :src="item.user.avatar" :size="48" class="!flex-shrink-0" />
            <div class="ml-3 md:ml-0 md:mt-2">
              <span class="text-sm font-medium text-gray-700">
                {{ item.user.nickname }}
              </span>
            </div>
          </div>

          <!-- 主要内容区域 -->
          <div class="flex-1">
            <!-- 标题行 -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-lg font-semibold text-gray-800">
                {{ item.prompt }}
              </span>
              <a-tag :color="item.taskStatus === 'SUCCEEDED' ? 'green' : ''" class="!m-0">
                {{ item.taskStatus }}
              </a-tag>
            </div>

            <!-- 详细信息 -->
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex flex-wrap gap-4">
                <div>
                  <span class="font-medium">模型：</span>
                  <span class="text-gray-500">{{ item.model }}</span>
                </div>
                <div>
                  <span class="font-medium">创建时间：</span>
                  <span class="text-gray-500">{{ dayjs(item.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
                <div v-if="item.endTime">
                  <span class="font-medium">完成时间：</span>
                  <span class="text-gray-500">{{ dayjs(item.endTime).format('YYYY-MM-DD HH:mm') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>