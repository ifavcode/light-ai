<script setup lang="ts">
import { getAiAllowListApi } from '@/api/setting';
import { userRecordApi } from '@/api/user';
import type { AllowList } from '@/types';
import { getAssetsImg, modelImageMap, modelImages } from '@/utils';


const router = useRouter()

function startUse() {
  router.push({
    name: 'oneToOne'
  })
}

const aiAllowList = ref<AllowList[]>([])
async function getAiAllowList() {
  const { data: res } = await getAiAllowListApi()
  if (res.data) {
    aiAllowList.value = res.data
  }
}

async function userRecord() {
  userRecordApi()
}

onMounted(() => {
  getAiAllowList()
  userRecord()
})

</script>

<template>
  <div class="w-full">
    <main class="w-[1200px] m-auto py-22 px-14 max-sm:w-full max-sm:px-7">
      <div class="sm:flex sm:gap-2 max-sm:px-7">
        <div>
          <div class="max-sm:flex max-sm:items-center">
            <!-- <RadiantText
              class="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
              :duration="5">
              <span class="text-7xl font-semibold font-mono">轻AI</span>
            </RadiantText> -->
            <SparklesText text="轻AI" :colors="{ first: '#9E7AFF', second: '#FE8BBB' }" :sparkles-count="6"
              class="my-8" />
            <!-- <h1 class="text-7xl font-semibold font-mono">
              <span>轻AI</span>
            </h1> -->
            <div class="flex-1 flex justify-center items-center relative sm:hidden">
              <img class="size-20" src="@/assets/logo.svg" alt="">
              <!-- <LiquidLogo :image-url="getAssetsImg('/logo.svg')" /> -->
              <div class="size-50 absolute top-[50%] left-[50%] translate-[-50% -50%]"></div>
            </div>
          </div>
          <p class="mt-10 font-mono text-3xl leading-11">轻松使用各家最热门、最强大的
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">AI产品</span>
            <br />
            便捷高效。
          </p>
          <p class="bg-clip-text text-transparent w-fit bg-linear-65 from-purple-500 to-pink-500 font-mono mt-6">
            “ 轻轻松松用AI ”</p>
          <div class="text-white mt-8">
            <!-- <button
              class="w-fit px-7 py-2 rounded-full text-white text-sm mt-10 bg-linear-65 from-purple-500 to-pink-500 cursor-pointer transition duration-100 hover:from-purple-400 hover:to-pink-400"
              @click="startUse">
              开始使用
            </button> -->
            <RainbowButton @click="startUse">开始使用</RainbowButton>
          </div>
        </div>
        <div class="flex-1 flex justify-center items-center relative max-sm:hidden">
          <img class="size-50" src="@/assets/logo.svg" alt="">
           <!-- <LiquidLogo class="size-50" :image-url="getAssetsImg('/logo.svg')" /> -->
          <div class="g-gradation-bg size-50 absolute top-[50%] left-[50%] translate-[-50% -50%]"></div>
        </div>
      </div>
      <div class="mt-20 flex gap-4 flex-col max-sm:mt-14 relative">
        <div class="sm:absolute right-0 max-sm:flex max-sm:justify-center">
          <IconCloud :images="modelImages" />
        </div>
        <div>
          <span>😊😊😊</span>
          <p class="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 font-mono font-semibold">
            多模型支持：</p>
        </div>
        <div v-for="item in aiAllowList" class="flex gap-2 items-center">
          <div class="w-14 flex justify-center items-center mr-2">
            <img :src="modelImageMap[item.value]" alt="">
          </div>
          <p>{{ item.label }}</p>
          <p class="text-gray-500 text-sm">（{{ item.model }}）</p>
          <p>
            <i class="iconfont text-green-500">&#xe769;</i>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
