<script setup lang="ts">
import { getAiToolsApi } from '@/api/ai-tools';
import type { AiTool } from '@/types';
import dayjs from 'dayjs';

const router = useRouter()
const aiTools = ref<AiTool[]>([])

async function getAiTools() {
  const { data: res } = await getAiToolsApi()
  if (res.code === 200) {
    aiTools.value = res.data
  }
}

function handleClick(item: AiTool, index: number) {
  router.push({ name: item.routeName, query: { id: item.id } })
}

onMounted(() => {
  getAiTools()
})

</script>

<template>
  <div class="w-full mt-16">
    <div class="w-[1200px] m-auto mt-8 flex gap-8 max-sm:w-full max-sm:px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="(tool, index) in aiTools" :key="tool.id" @click="handleClick(tool, index)"
          class="group relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-lg transition-all duration-500 shadow cursor-pointer">
          <div
            class="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(124,58,237,0.6),transparent_70%)] pointer-events-none"
            :style="{ '--x': `80%`, '--y': `80%` }">
          </div>

          <div class="overflow-hidden rounded-xl w-56 h-56">
            <div v-show="!tool.toolImage"
              class="w-full h-full flex items-center justify-center space-y-4 flex-col bg-gradient-to-br from-gray-800 to-gray-900 ">
              <span class="text-gray-400 text-sm font-light">该工具未上传图片</span>
            </div>
            <ImageComp :url="tool.toolImage"
              class-names="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>

          <div class="mt-6">
            <h3
              class="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3 w-fit">
              {{ tool.toolName }}
            </h3>

            <p class="text-sm leading-relaxed line-clamp-3 font-light">
              {{ tool.desc }}
            </p>

            <div class="mt-4 border-t border-white/10 flex justify-between items-center">
              <span class="text-gray-500 text-sm">{{ dayjs(tool.createTime).format('YYYY年MM月DD日上传') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>