<script setup lang="ts">
import { getAiToolApi } from '@/api/ai-tools';
import type { AiTool } from '@/types';

const toolDetail = ref<Partial<AiTool>>({})
const route = useRoute()
const { id } = route.query

async function getAiTool() {
  if (!id) return
  const { data: res } = await getAiToolApi(id as string)
  if (res.code === 200) {
    toolDetail.value = res.data
  }
}

onMounted(() => {
  getAiTool()
})
</script>

<template>
  <div class="w-full mt-16 pb-4">
    <div class="w-[1200px] m-auto mt-8 max-sm:w-full">
      <Common_tool_header :toolDetail="toolDetail" />
      <div class="mt-4 w-full">
        <iframe class="w-full max-w-[700px] h-[800px] m-auto shadow" src="https://www.guetzjb.cn/choujiang"></iframe>
      </div>
    </div>
  </div>
</template>