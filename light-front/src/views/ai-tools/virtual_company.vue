<script setup lang="ts">
import { createVirtualCompoanyApi, getAiToolApi, getVirtualCompoanyAllowApi, getVirtualCompoanyLastApi } from '@/api/ai-tools'
import { Constant, ExecStatus, type AiTool, type VirtualCompany, type VirtualCompanyDTO } from '@/types'
import { enhanceCodeBlock, marked } from '@/utils'
import Cookies from 'js-cookie'
import { io, Socket } from 'socket.io-client'

const toolDetail = ref<Partial<AiTool>>({})
const route = useRoute()
const { id } = route.query
const isAllow = ref(true)
const scrollRef = ref<HTMLElement>()
const virtualCompanyDTO = reactive<VirtualCompanyDTO>({
  model: '',
  prompt: ''
})
const virtualCompany = ref<Partial<VirtualCompany>>({
  replyContent: '',
  errorContent: ''
})

async function getAiTool() {
  if (!id) return
  const { data: res } = await getAiToolApi(id as string)
  if (res.code === 200) {
    toolDetail.value = res.data
  }
}

async function getVirtualCompoanyAllow() {
  const { data: res } = await getVirtualCompoanyAllowApi()
  if (res.code === 200) {
    isAllow.value = res.data
    if (!isAllow.value) {
      getVirtualCompoanyLast()
    }
  }
}

async function getVirtualCompoanyLast() {
  const { data: res } = await getVirtualCompoanyLastApi()
  if (res.code === 200) {
    virtualCompany.value = res.data
    scrollToBottom()
  }
}

async function createVirtualCompoany() {
  try {
    await createVirtualCompoanyApi(virtualCompanyDTO)
    window.$message.success('需求提交成功，耗时可能较久，可前往个人中心查看')
    isAllow.value = false
  } catch (error: any) {
    window.$message.error(error.message)
  }
}

const isRunning = ref(false)
let socket: Socket
function initSocket() {
  if (socket) {
    socket.close()
  }
  const token = Cookies.get(Constant.JWT_HEADER_NAME)
  if (!token) {
    return
  }
  socket = io('', {
    path: '/dev-api/socket/', extraHeaders: {
      [Constant.JWT_HEADER_NAME]: token
    }
  });
  socket.on("connect", () => {
    console.log('socket已连接');
    socket.emit('connect2')
  });

  socket.on("vcWorking", (e) => {
    const status = parseInt(e.status)
    const data = e.data
    if (status === ExecStatus.ERROR) {
      virtualCompany.value.errorContent += data
      isRunning.value = false
    } else if (status === ExecStatus.FINISH) {
      isRunning.value = false
    } else if (status === ExecStatus.RUNNING) {
      virtualCompany.value.replyContent += data
    }
    scrollToBottom()
  });

  socket.on("disconnect", () => {
    console.log('socket已断开连接');
  });
}

function scrollToBottom() {
  nextTick(() => {
    scrollRef.value?.scrollTo({
      top: scrollRef.value.scrollHeight
    })
  })
}

onMounted(() => {
  getVirtualCompoanyAllow()
  getAiTool()
  initSocket()
})

</script>

<template>
  <div class="w-full mt-16 pb-4">
    <div class="w-[1200px] m-auto mt-8 max-sm:w-full">
      <Common_tool_header :toolDetail="toolDetail" />
      <div class="mt-4 w-full border p-4 border-gray-200 rounded-md shadow bg-white">
        <p v-show="!isAllow" class="text-red-500 font-semibold mb-2">
          <span>上一个转化任务进行中或等待确认</span>
          <span class="px-2 text-blue-500 underline cursor-pointer hover:text-blue-400"
            @click="$router.push({ name: 'virtualCompanyProfile' })">GO</span>
        </p>
        <p class="">😊说说需求吧!</p>
        <p class="mb-2 text-sm text-gray-500">例如（写一个HTML的贪吃蛇）</p>
        <div class="relative">
          <textarea class="focus:outline-none border-2 border-gray-400 
              bg-white
          focus:border-blue-400 rounded-md placeholder:text-sm text-sm placeholder:text-gray-400
           focus:placeholder:text-blue-400 p-2 resize-none w-full h-28
           transition duration-100" placeholder="产品经理 / 架构师 / 项目经理 / 工程师正在等待您的需求" v-model="virtualCompanyDTO.prompt"
            :disabled="!isAllow" />
          <button
            class="w-fit px-6 py-2 rounded-md text-white text-sm mt-10 bg-linear-65 from-purple-500 to-pink-500 cursor-pointer
             transition duration-100 hover:from-purple-400 hover:to-pink-400 absolute bottom-4 right-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
            :disabled="!isAllow || virtualCompanyDTO.prompt === ''" @click="createVirtualCompoany">
            帮我做
          </button>
        </div>
        <div class="mt-2">
          <p class="mb-2">
            <span>工作报告</span>
            <span v-show="!isAllow" class="ml-2 text-xs text-green-500">工作中</span>
          </p>
          <div class="bg-gray-50 w-full min-h-30 overflow-y-scroll rounded-md p-2" ref="scrollRef">
            <p class="text-xs text-gray-500" v-show="isAllow">还没开始工作，快去提交需求吧</p>
            <div class="w-full max-h-screen markdown" v-enhanceCode
              v-html="enhanceCodeBlock(marked.parse(virtualCompany.replyContent as string) as string)"
              >

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

</style>