<script setup lang="ts">
import type { AiTool } from '@/types';
import dayjs from 'dayjs';
import { LeftOutlined } from '@ant-design/icons-vue';
import { marked } from 'marked';


const { toolDetail } = defineProps<{
  toolDetail: Partial<AiTool>
}>()

</script>

<template>
  <div
    class="w-full group relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-lg transition-all duration-500 shadow">
    <div
      class="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(124,58,237,0.6),transparent_70%)] pointer-events-none"
      :style="{ '--x': `80%`, '--y': `80%` }">
    </div>

    <div class="flex gap-4 relative">
      <div class="overflow-hidden rounded-xl w-72 h-56 max-sm:w-48 max-sm:h-48">
        <div v-show="!toolDetail.toolImage"
          class="w-full h-full flex items-center justify-center space-y-4 flex-col bg-gradient-to-br from-gray-800 to-gray-900">
          <span class="text-gray-400 text-sm font-light">该工具未上传图片</span>
        </div>
        <ImageComp :url="toolDetail.toolImage"
          class-names="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div class="flex-1 shrink-0">
        <h3
          class="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3 w-fit flex items-center cursor-pointer"
          title="返回" @click="$router.back()">
          <LeftOutlined class="mr-1" style="color: #AD46FF;font-size: 14px;" />
          <span>{{ toolDetail.toolName }}</span>
        </h3>

        <div class="markdown" v-html="marked.parse(toolDetail.desc || '')">
        </div>

        <div class="mt-4 border-t border-white/10 flex justify-between items-center">
          <span class="text-gray-500 text-sm">{{ dayjs(toolDetail.createTime).format('YYYY年MM月DD日上传') }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex items-center gap-4 mb-6">
        <div class="relative">
          <img :src="toolDetail.user?.avatar"
            class="w-14 h-14 rounded-full border-2 border-white/20 hover:border-cyan-400 transition-all cursor-pointer contain-layout">
        </div>
        <div>
          <h3 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {{ toolDetail.user?.nickname }}
          </h3>
          <p class="text-gray-600 text-sm">上传者</p>
        </div>
      </div>
    </div>
  </div>
</template>