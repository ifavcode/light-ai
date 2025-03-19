<script setup lang="ts">
import { getPicToVideoDetailsApi, getPicToVideoListApi } from '@/api/ai-tools';
import type { PicToVideo } from '@/types';
import { RedoOutlined } from '@ant-design/icons-vue';

const page = reactive({
  pageNum: 1,
  pageSize: 10
})

const transList = ref<PicToVideo[]>([])
const loadingSet = ref(new Set())
async function getPicToVideoAllow() {
  const { data: res } = await getPicToVideoListApi(page)
  if (res.code === 200) {
    transList.value = res.data
  }
}

async function getPicToVideoDetails(id: number, index: number) {
  try {
    loadingSet.value.add(id)
    const { data: res } = await getPicToVideoDetailsApi(id)
    if (res.code === 200) {
      transList.value[index] = res.data
    }
  } catch (error) {

  } finally {
    loadingSet.value.delete(id)
  }

}

const isSm = computed(() => {
  return document.body.clientWidth < 480
})

onMounted(() => {
  getPicToVideoAllow()
})

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- <div class="bg-white p-4 rounded-md">
      <p>手动刷新、速度更快</p>
    </div> -->
    <div v-if="transList.length === 0" class="bg-white p-4 rounded-md">
      <p class="text-gray-600">
        <span>你还没有使用记录哦，快去试试吧</span>
        <span class="text-blue-500 font-semibold ml-2 underline cursor-pointer"
          @click="$router.push('/ai_tools')">GO</span>
      </p>
    </div>
    <div v-for="(item, index) in transList" :key="item.id">
      <a-card class="shadow-md hover:shadow-lg transition-shadow" :title="`ID: ${item.id}`">
        <!-- 媒体展示区域 -->
        <div class="mb-4 flex gap-2">
          <a-image v-if="item.imgUrl" :src="item.imgUrl" :width="200" class="w-52 object-cover max-sm:w-1/2" preview />
          <video v-if="item.videoUrl" :src="item.videoUrl" controls class="w-52 object-contain max-sm:w-1/2"></video>
        </div>

        <!-- 信息展示 -->
        <a-descriptions :column="isSm ? 1 : 2" bordered :label-style="{ width: '100px' }">
          <a-descriptions-item label="模型">
            <div>
              {{ item.model }}
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="提示词">
            <div>
              {{ item.prompt }}
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="时长">
            <div>
              {{ item.duration }}秒
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <div class="flex items-center w-1/2">
              <a-tag
                :color="item.taskStatus === 'SUCCEEDED' ? 'green' : (item.taskStatus === 'FAILED' ? 'error' : 'orange')">
                {{ item.taskStatus || '刷新获取状态' }}
              </a-tag>
              <div class="flex items-center">
                <RedoOutlined :class="loadingSet.has(item.id) ? 'loading-active ' : ''"
                  class=" cursor-pointer hover-primary" @click="getPicToVideoDetails(item.id, index)" />
                <div class="ml-2  w-12">
                  <span class="text-gray-500" v-show="loadingSet.has(item.id)">更新中</span>
                </div>
              </div>
            </div>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 底部时间 -->
        <div class="mt-4 text-gray-500 text-sm">
          创建时间: {{ new Date(item.createTime).toLocaleString() }}
        </div>
      </a-card>
    </div>
  </div>
</template>

<style>
.loading-active {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>