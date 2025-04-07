<script setup lang="ts">
import { ArrowUpOutlined, DownOutlined, LoadingOutlined, MessageOutlined, PlusOutlined, PauseOutlined, CopyOutlined, FireOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { Constant, MessageRole, ModelInputType, ModelType, type AllowList, type CreateQianwenDto, type DialogGroup, type Message, type Page, type replyQianwenDTO } from '../../types/index';
import Cookies from 'js-cookie'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { getAiAllowListApi } from '@/api/setting';
import { cancelRequestApi, createDialogGroupApi, getAudioHistoryApi, getQianwenDialogGroupApi, getQianwenDialogGroupOneApi, sendMsgApi, speakTextApi } from '@/api/ai';
import { modelImageMap, marked, enhanceCodeBlock, classifyFile, getUrlToBase64, randomFileName } from '@/utils';
import 'katex/dist/katex.min.css'
import 'katex/dist/katex.min.js'
import router from '@/router';
import ClipboardJS from 'clipboard'
import { useUserStore } from '@/stores/userStore';
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';
import { pathRewrite } from '@/utils/request';
import { io, Socket } from 'socket.io-client';
import { uploadFileApi } from '@/api/user';
import { nanoid } from 'nanoid'

const userStore = useUserStore()
const route = useRoute()
const finishFlag = ref(true)
let es: EventSourcePolyfill
let timeoutTimer: number | null = null
function conncetServerSseApi() {
  es = new EventSourcePolyfill("/dev-api/qianwen/connect", {
    headers: {
      Authorization: Cookies.get(Constant.JWT_HEADER_NAME) as string
    }
  });

  es.onmessage = (event) => {
  };

  es.addEventListener('ai', (event: MessageEvent | any) => {
    const data: replyQianwenDTO = JSON.parse(event.data);
    if (data.choices && data.choices[0].finish_reason && data.choices[0].finish_reason != null) {
      if (data.choices[0].delta && data.choices[0].delta.attach) {
        const id = data.choices[0].delta.attach.id // 最新一条消息记录的主键ID
        const len = createQianwenDto.message.length
        if (createQianwenDto.message[len - 1].role === MessageRole.ASSISTANT && id) {
          createQianwenDto.message[len - 1].id = id
        } else {
          // 异常，不存储朗读记录
        }
      } else {
        finishFlag.value = true
        clearAutoScroll()
      }
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
    }
    if (data.choices[0].delta) {
      if (data.choices[0].delta.reasoning_content) {
        if (!createQianwenDto.message[createQianwenDto.message.length - 1].reasoningContent) {
          createQianwenDto.message[createQianwenDto.message.length - 1].reasoningContent = ''
        }
        createQianwenDto.message[createQianwenDto.message.length - 1].reasoningContent += data.choices[0].delta.reasoning_content
      }
      if (data.choices[0].delta.content) {
        createQianwenDto.message[createQianwenDto.message.length - 1].content += data.choices[0].delta.content
      }
    }
  })

  es.onerror = (error) => {
    if (!userStore.user) return
    window.$message.error('网络异常，请重试')
    console.error("EventSource failed:", error);
  };
}

const aiAllowList = ref<AllowList[]>([])
const modelToModelName = ref<Record<string, string>>({})
async function getAiAllowList() {
  const { data: res } = await getAiAllowListApi()
  if (res.data) {
    aiAllowList.value = res.data
    modelToModelName.value = res.data.reduce((pre, cur) => {
      pre[cur.value] = cur.label
      return pre
    }, {} as Record<string, string>)
    if (!route.query.g) {
      const aiModelTypeStorage = localStorage.getItem(Constant.MODEL_SELECT_ONE)
      if (aiModelTypeStorage) {
        const obj = JSON.parse(aiModelTypeStorage)
        createQianwenDto.aiModelType = obj.value
      }
    }
    const isReasoning = localStorage.getItem(Constant.IS_REASONING)
    if (isReasoning) {
      createQianwenDto.reasoning = isReasoning === '1' ? true : false
    }
  }
}

function toggleModel(obj: AllowList) {
  createQianwenDto.aiModelType = obj.value
  localStorage.setItem(Constant.MODEL_SELECT_ONE, JSON.stringify(obj))
  imageList.value = []
  createQianwenDto.mediaUrl = ''
}

// { role: MessageRole.USER, content: '你是谁？' }, { role: MessageRole.ASSISTANT, content: '我是' }
const createQianwenDto: CreateQianwenDto = reactive({
  message: [],
  aiModelType: ModelType.QIAN_WEN,
  reasoning: false,
  dialogContent: '',
  dialogGroupId: -1,
  inputType: ModelInputType.TEXT,
  mediaUrl: ''
})
async function createDialogGroup(inputType: ModelInputType): Promise<number> {
  const { data: res } = await createDialogGroupApi({
    groupName: createQianwenDto.dialogContent.substring(0, Math.min(50, createQianwenDto.dialogContent.length)),
    aiModelType: createQianwenDto.aiModelType,
    inputType
  })
  if (res.code === 200) {
    dialogGroups.value.unshift(res.data)
    return res.data.id
  }
  return -1
}

async function sendMsg() {
  if (imageList.value.length !== 0) {
    if (loading.value) {
      window.$message.warning('等待图片上传完成')
      return
    }
    createQianwenDto.inputType = classifyFile(imageList.value[0].originFileObj?.name || imageList.value[0].fileName || '')
    if (createQianwenDto.inputType === ModelInputType.OTHER) {
      window.$message.warning('不支持此类型的附件，请上传其他类型')
      return
    }
    createQianwenDto.mediaUrl = imageList.value[0].response?.data
  } else {
    // 使用初始化时定义的类型
    // createQianwenDto.inputType = ModelInputType.TEXT
  }
  if (createQianwenDto.dialogGroupId === -1) {
    const id = await createDialogGroup(createQianwenDto.inputType as ModelInputType)
    if (id === -1) {
      window.$message.error('发送异常，请重试')
      return
    }
    dialogGroupsActiveId.value = id
    createQianwenDto.dialogGroupId = id
  }
  let rebackMsg = createQianwenDto.dialogContent
  try {
    finishFlag.value = false
    startAutoScroll()
    handleQianwenDto()
    sendMsgApi(createQianwenDto)
    createQianwenDto.message.push({
      role: MessageRole.ASSISTANT,
      content: ''
    })
    imageList.value = []
    createQianwenDto.mediaUrl = ''
    createQianwenDto.dialogContent = ''
    timeoutTimer = setTimeout(() => {
      console.error('timeout');
      timeoutFinish(rebackMsg)
    }, 1000 * 40);
  } catch (error) {
    timeoutFinish(rebackMsg)
  }
}

function handleQianwenDto() {
  switch (createQianwenDto.inputType) {
    case ModelInputType.TEXT:
      createQianwenDto.message.push({
        role: MessageRole.USER,
        content: createQianwenDto.dialogContent
      })
      break
    case ModelInputType.IMAGE:
      const url = imageList.value[0]?.response?.data
      const messageContent = [
      ]
      if (url) {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url
          }
        })
      }
      messageContent.push({
        type: 'text',
        text: createQianwenDto.dialogContent
      })
      createQianwenDto.message.push({
        role: MessageRole.USER,
        content: messageContent
      })
      break
  }
}

function timeoutFinish(rebackMsg: string) {
  window.$message.error('请求超时请重试')
  createQianwenDto.message.pop()
  createQianwenDto.message.pop()
  createQianwenDto.dialogContent = rebackMsg
  finishFlag.value = true
  clearAutoScroll()
}

function sendMsgCheck(e: KeyboardEvent) {
  if (e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    createQianwenDto.dialogContent += '\n'
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (createQianwenDto.dialogContent === '' || !finishFlag.value) return
    sendMsg()
  }
}

const dialogGroups = ref<DialogGroup[]>([])
const dialogGroupsActiveId = ref(-1)
const page = reactive<Page<any>>({
  pageNum: 1,
  pageSize: 20
})
async function getQianwenDialogGroup() {
  const { data: res } = await getQianwenDialogGroupApi(page)
  if (res.code == 200) {
    dialogGroups.value = res.data
    if (route.query.g) {
      const dialogGroup = res.data.find(v => (v.id.toString()) === (route.query.g as string))
      if (dialogGroup) {
        getQianwenDialogGroupOne(dialogGroup)
      }
    }
  }
}

async function getQianwenDialogGroupOneWrap(item: DialogGroup) {
  await getQianwenDialogGroupOne(item)
  mobileGroupShow.value = false
}

async function getQianwenDialogGroupOne(item: DialogGroup) {
  createQianwenDto.dialogGroupId = item.id
  await cancelOutput()
  const { data: res } = await getQianwenDialogGroupOneApi(createQianwenDto.dialogGroupId)
  dialogGroupsActiveId.value = item.id
  if (res.data) {
    createQianwenDto.aiModelType = res.data.aiModelType
    createQianwenDto.inputType = res.data.inputType
    createQianwenDto.message = res.data.dialogs.reduce((pre, cur) => {
      if (cur.replyContent != '') {
        // 根据类型生成内容
        if (!cur.inputType || cur.inputType === ModelInputType.TEXT) {
          pre.push({
            id: cur.id,
            role: MessageRole.USER,
            content: cur.dialogContent,
            reasoningContent: cur.reasoningContent,
            inputType: cur.inputType
          })
        } else if (cur.inputType === ModelInputType.IMAGE) {
          const messageContent = []
          if (cur.mediaUrl) {
            messageContent.push({
              type: 'image_url',
              image_url: {
                url: cur.mediaUrl
              }
            })
          }
          messageContent.push({
            type: 'text',
            text: cur.dialogContent
          })
          pre.push({
            id: cur.id,
            role: MessageRole.USER,
            content: messageContent,
            reasoningContent: cur.reasoningContent,
            inputType: cur.inputType
          })
        }
        pre.push({
          id: cur.id,
          role: MessageRole.ASSISTANT,
          content: cur.replyContent,
          reasoningContent: cur.reasoningContent,
          inputType: ModelInputType.TEXT
        })
      }
      return pre
    }, [] as Message[])
    router.push({
      name: 'oneToOne',
      query: {
        g: item.id
      }
    })
    nextTick(() => {
      document.documentElement.scrollTo({
        behavior: 'instant',
        top: document.documentElement.scrollHeight
      })
    })
  }
}

async function createNewDialog() {
  dialogGroupsActiveId.value = -1
  createQianwenDto.dialogGroupId = -1
  createQianwenDto.message = []
  createQianwenDto.dialogContent = ''
  createQianwenDto.inputType = ModelInputType.TEXT
  imageList.value = []
  await cancelOutput()
  router.push({
    name: 'oneToOne',
    query: {
    }
  })
}

let timer: number | null
function startAutoScroll() {
  clearAutoScroll()
  timer = setInterval(() => {
    document.documentElement.scrollTo({
      behavior: 'instant',
      top: document.documentElement.scrollHeight
    })
  }, 100)
}

function clearAutoScroll() {
  if (timer) {
    clearInterval(timer)
  }
}

let listenTimer: number | undefined
function scrollFunc() {
  clearTimeout(listenTimer)
  listenTimer = setTimeout(() => {
    const scrollTop = document.documentElement.scrollTop
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (documentHeight - (scrollTop + windowHeight) <= 1) {
      if (!finishFlag.value) {
        startAutoScroll()
      } else {
        clearAutoScroll()
      }
    } else {
      clearAutoScroll()
    }
    scrollTopShow.value = document.documentElement.scrollTop > window.innerHeight
  }, 10);
}
function listenScroll() {
  document.addEventListener('scroll', scrollFunc)
}

async function cancelOutput() {
  await cancelRequestApi()
  clearAutoScroll()
  finishFlag.value = true
}

const toolsBarShowMap = ref<Record<string, boolean>>({})
function openToolsWindow(index: number) {
  toolsBarShowMap.value[index] = true
}
function hiddenToolsWindow(index: number) {
  toolsBarShowMap.value[index] = false
}

function initCopyJs() {
  new ClipboardJS('.copy-button')
}

function copyText() {
  window.$message.success('复制成功')
}

const scrollTopShow = ref(false)
function scrollTop() {
  document.documentElement.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

function scrollDown() {
  document.documentElement.scrollTo({
    top: document.documentElement.scrollHeight,
  })
}

// 支持深度思考的模型
const canReasoning = [ModelType.DEEP_SEEK, ModelType.QIAN_WEN]
// 支持上传附件的模型
const canAttach = [ModelType.QIAN_WEN, ModelType.DOU_BAO, ModelType.KI_MI]

// 思考模型设置
function toggleReasoning() {
  if (imageList.value.length > 0) {
    if (createQianwenDto.aiModelType === ModelType.QIAN_WEN) {
      return
    }
  }
  createQianwenDto.reasoning = !createQianwenDto.reasoning
  localStorage.setItem(Constant.IS_REASONING, createQianwenDto.reasoning ? '1' : '0')
}

// 移动端相关
const mobileGroupShow = ref(false)

// 上传资源相关
const imageList = ref<UploadFile[]>([
])
const loading = ref(false)

const beforeUpload = (file: any) => {
  const isJpgOrPngOrMore = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/bmp' || file.type === 'image/gif';
  if (!isJpgOrPngOrMore) {
    window.$message.error(`不支持的格式${file.type}`);
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    window.$message.error('最大为10MB!');
  }
  return isLt10M && isJpgOrPngOrMore;
};

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    // Get this url from response in real world.
    // console.log(info.file.response.data);
    if (createQianwenDto.reasoning) {
      if (createQianwenDto.aiModelType === ModelType.QIAN_WEN) {
        window.$message.warning(`此模型解析文件不支持深度思考`)
        createQianwenDto.reasoning = false
        console.log(imageList.value);

      }
    }
    loading.value = false;
  }
  if (info.file.status === 'error') {
    loading.value = false;
    if (info.file.response.code === 401) {
      window.$message.warning('请登录');
    } else {
      window.$message.error('上传失败，请重试');
    }
  }
};

const visible = ref(false);
const setVisible = (value: boolean): void => {
  visible.value = value;
};

function deleteImage() {
  imageList.value = []
}

// 不同类型复制的内容不同
function getCopyTextByType(dialog: any) {
  switch (dialog.inputType) {
    case ModelInputType.TEXT:
      return dialog.content
    case ModelInputType.IMAGE:
      return dialog.content.reduce((pre: string, cur: any) => {
        if (cur.image_url) {
          pre += cur.image_url.url + '\n'
        } else if (cur.text) {
          pre += cur.text
        }
        return pre
      }, '')
    default:
      return dialog.content
  }

}

const bodyInfo = {
  width: document.body.clientWidth,
  height: document.body.clientHeight
}

// 朗读文本相关
let mediaSource: MediaSource;
let sourceBuffer: SourceBuffer | null = null;
const mimeCodec = 'audio/mpeg';
const audioLoading = ref(false)
async function speakText(dialog: Message) {
  try {
    audioLoading.value = true
    if (dialog.id) {
      const { data: res } = await getAudioHistoryApi(dialog.id)
      if (res.data && audioRef.value) {
        audioRef.value.pause()
        audioRef.value.src = res.data
        audioRef.value.play()
        audioLoading.value = false
        return
      }
    }
    if ("MediaSource" in window && MediaSource.isTypeSupported(mimeCodec) && audioRef.value) {
      if (mediaSource?.readyState === 'open') {
        mediaSource.endOfStream();
      }
      audioRef.value.pause()
      sourceBuffer = null;
      mediaSource = new MediaSource()
      audioRef.value.src = URL.createObjectURL(mediaSource);
      mediaSource.addEventListener('sourceopen', async () => {
        sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
        sourceBuffer.addEventListener("updateend", () => {
          console.log('play');
          audioRef.value?.play()
        });
      });
      await speakTextApi({ text: dialog.content, id: dialog.id ?? -1 })
    } else {
      await speakTextApi({ text: dialog.content, id: dialog.id ?? -1 })
      return
    }
  } catch (error) {
    audioLoading.value = false
    window.$message.error('朗读失败，请重试')
  }
}

let socket: Socket
const audioRef = ref<HTMLAudioElement>()
function initSocket() {
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
    // socket.emit('connect2')
  });

  socket.on("ttvEnd", (e) => {
    if (mediaSource && mediaSource.readyState === 'open') {
      mediaSource.endOfStream();
    }
    if (!("MediaSource" in window && MediaSource.isTypeSupported(mimeCodec)) && audioRef.value) {
      // 不支持MediaSource的情况
      audioRef.value.pause()
      audioRef.value.src = e.url
      audioRef.value.play()
    }
    audioLoading.value = false
  });

  socket.on("ttv", (e) => {
    if (!sourceBuffer || sourceBuffer.updating) {
      return
    }
    sourceBuffer.appendBuffer(e)
  });

  socket.on("disconnect", () => {
    console.log('socket已断开连接');
  });
}

// 粘贴内容
async function pasteContent(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          try {
            loading.value = true
            const { data: res } = await uploadFileApi(file)
            const filename = randomFileName(file)
            imageList.value.push({
              uid: nanoid(10),
              name: filename,
              fileName: filename,
              response: {
                data: res.data
              }
            })
          } catch (error) {

          } finally {
            loading.value = false
          }
        }
      }
    }
  }
}


onMounted(() => {
  conncetServerSseApi()
  getAiAllowList()
  getQianwenDialogGroup()
  listenScroll()
  initCopyJs()
  initSocket()
})

onBeforeUnmount(() => {
  if (es) {
    es.close()
  }
  if (socket) {
    socket.close()
  }
  document.removeEventListener('scroll', scrollFunc)
})


</script>

<template>
  <div class="w-full mt-16">
    <div class="w-[1200px] m-auto mt-8 flex gap-8 max-sm:w-full">
      <div class="w-[200px] max-sm:hidden">
        <div class="w-[200px] fixed">
          <button class="cursor-pointer flex items-center gap-2 bg-linear-to-r from-cyan-500 hover:from-cyan-400
           to-blue-500 hover:to-blue-400 text-white w-full p-2 rounded-xl transition duration-100"
            @click="createNewDialog">
            <PlusOutlined />
            <span>新对话</span>
            <!-- <p v-html="marked.parse('$$S_n = \\frac{n}{2} \\left(2a_1 + (n-1)d\\right)$$')"></p> -->
            <!-- <p v-html="marked.parse(`\\[c = \\pm\\sqrt{a^2 + b^2}\\]`)"></p> -->
          </button>
          <h1 class="flex items-center text-gray-800 mt-4">
            <MessageOutlined />
            <span class="px-2 text-gray-800">最近对话</span>
          </h1>
          <div>
            <div v-if="dialogGroups.length === 0">
              <p class="text-gray-500 text-sm mt-2 pl-6">暂无对话哦</p>
            </div>
            <TransitionGroup name="apperIn" v-if="dialogGroups.length != 0">
              <div v-for="item in dialogGroups" :key="item.id" @click="getQianwenDialogGroupOne(item)" class="first:mt-2 flex gap-1 translate-x-0 justify-between w-full h-fit min-h-8 px-2 py-1
               leading-9 rounded-xl cursor-pointer hover:bg-blue-200 hover:text-gray-600"
                :class="item.id === dialogGroupsActiveId ? 'bg-blue-500 text-white hover:bg-blue-500 hover:text-white' : ''">
                <p class="flex-1 text-sm text-ellipsis line-clamp-2">{{ item.groupName }}</p>
                <p class="text-xs flex items-center">{{ item.aiModelType }}</p>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
      <div class="w-[968px] relative max-h-[calc(100vh-6rem)] max-sm:w-full max-sm:px-2">
        <div class="max-h-[calc(100vh - 11rem)] w-full h-fit"
          :class="createQianwenDto.message.length != 0 ? 'pb-44' : ''">
          <div class="flex gap-2">
            <div class="sm:hidden ">
              <a-affix :offset-top="64">
                <img class="size-8 active:bg-blue-100 p-1 rounded-md" @click="mobileGroupShow = true"
                  src="@/assets/menu2.svg"></img>
              </a-affix>
            </div>
            <Menu as="div" class="relative inline-block text-left">
              <div class="mb-4">
                <MenuButton :disabled="createQianwenDto.message.length > 0"
                  class="inline-flex w-full justify-center rounded-md bg-linear-to-r disabled:from-sky-300 disabled:to-indigo-300 disabled:cursor-not-allowed from-sky-500 to-indigo-500
                 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-400 focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-white/75">
                  <div class="flex items-center gap-1">
                    <DownOutlined />
                    <span>{{ modelToModelName[createQianwenDto.aiModelType] || '选择产品' }}</span>
                  </div>
                </MenuButton>
                <!-- <p class="text-xs text-gray-500">下拉选择更多可用模型</p> -->
              </div>

              <transition enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <MenuItems
                  class="absolute z-10 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none max-sm:left-0">
                  <div class="px-1 py-1">
                    <MenuItem v-slot="{ active }" v-for="(item, index) in aiAllowList">
                    <button :class="[
                      createQianwenDto.aiModelType === item.value ? 'bg-linear-to-r from-sky-500 to-indigo-500 text-white' : 'text-gray-900',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer',
                    ]" @click="toggleModel(item)">
                      {{ item.label }}
                    </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
            <div class="w-fit px-3 py-2 h-fit text-sm  border-[2px] rounded-md cursor-pointer flex items-center gap-1"
              :class="createQianwenDto.reasoning ? 'border-blue-500 text-blue-500' : 'border-gray-500 text-gray-500'"
              @click="toggleReasoning" v-show="canReasoning.includes(createQianwenDto.aiModelType)">
              <FireOutlined />
              <span>思考模型</span>
            </div>
          </div>
          <!-- 对话主体内容 -->
          <div class="flex flex-col gap-4 w-full">
            <audio class="hidden" controls ref="audioRef" />
            <div v-for="(dialog, index) in createQianwenDto.message">
              <div v-if="dialog.role === MessageRole.ASSISTANT" class="flex gap-2 items-start relative"
                @mouseleave="hiddenToolsWindow(index)">
                <img class="size-8" :src="modelImageMap[createQianwenDto.aiModelType]" alt="">
                <Transition name="apperBottomIn">
                  <div class="absolute top-[-30px] left-[40px] w-fit" v-show="toolsBarShowMap[index]">
                    <div
                      class="bg-white rounded-md text-gray-800 shadow translate-y-[-0.5rem] px-3 py-1 flex items-center gap-4 w-fit h-8">
                      <button class="flex items-center cursor-pointer copy-button" :data-clipboard-text="dialog.content"
                        @click="copyText">
                        <CopyOutlined class="hover-primary" title="复制" />
                      </button>
                      <button class="flex items-center cursor-pointer copy-button" :data-clipboard-text="dialog.content"
                        @click="speakText(dialog)" v-show="!audioLoading && finishFlag">
                        <i class="iconfont font-normal hover-primary" style="font-size: 18px;" title="朗读">&#xe601;</i>
                      </button>
                      <button class="flex items-center copy-button" v-show="audioLoading">
                        <LoadingOutlined />
                      </button>
                    </div>
                  </div>
                </Transition>
                <div @mouseenter="openToolsWindow(index)"
                  class="h-fit bg-white px-3 py-1 rounded-md shadow text-gray-800 relative"
                  style="max-width: calc(100% - 3rem);">
                  <div class="absolute w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-gray-200 z-[-1] 
                    border-b-[8px] border-b-transparent left-[-6px] top-1">
                  </div>
                  <blockquote v-if="dialog.reasoningContent && dialog.reasoningContent != null" class="w-full markdown"
                    v-html="marked.parse(dialog.reasoningContent)">
                  </blockquote>
                  <p v-if="dialog.reasoningContent && dialog.reasoningContent != null && dialog.content !== ''"
                    class="text-sm linear-text py-2">
                    思考结束，我的回答如下</p>
                  <div v-if="dialog.content !== ''" class="w-full markdown overflow-x-auto" v-enhanceCode
                    v-html="enhanceCodeBlock(marked.parse(dialog.content as string) as string)"></div>
                  <div v-else>
                    <LoadingOutlined />
                  </div>
                </div>
              </div>
              <div v-if="dialog.role === MessageRole.USER" class="flex gap-2 items-start justify-end relative"
                @mouseleave="hiddenToolsWindow(index)">
                <Transition name="apperBottomIn">
                  <div class="absolute top-[-30px] right-[40px] w-fit" v-show="toolsBarShowMap[index]">
                    <div
                      class="bg-white rounded-md text-gray-800 shadow translate-y-[-0.5rem] px-3 py-2 flex items-center h-8">
                      <button class="flex items-center cursor-pointer copy-button"
                        :data-clipboard-text="getCopyTextByType(dialog)" @click="copyText">
                        <CopyOutlined class="hover-primary" title="复制" />
                      </button>
                    </div>
                  </div>
                </Transition>
                <div @mouseenter="openToolsWindow(index)"
                  class="max-w-[calc(100% - 3rem)] h-fit bg-white px-3 py-1 rounded-md shadow text-gray-800 markdown relative">
                  <div v-html="enhanceCodeBlock(marked.parse(dialog.content as string) as string)"
                    v-if="typeof dialog.content === 'string'">
                  </div>
                  <div v-if="Array.isArray(dialog.content)">
                    <div v-for="item in dialog.content">
                      <a-image v-if="item.image_url && item.image_url !== ''" :width="Math.min(200, bodyInfo.width)"
                        class="size-64 max-w-full cursor-zoom-in" :src="item.image_url.url" alt="图片" :preview="{
                          visible,
                          onVisibleChange: setVisible,
                        }" />
                      <p v-if="item.text">{{ item.text }}</p>
                    </div>
                  </div>
                </div>
                <div class="absolute w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-gray-200 z-[-1] 
                    border-b-[8px] border-b-transparent right-[34px] top-1">
                </div>
                <img v-if="!userStore.user?.avatar" class="size-8" src="@/assets/user/new-user.png" alt="">
                <img v-else :src="userStore.user?.avatar" class="size-8" alt="">
              </div>
            </div>
          </div>
        </div>
        <div :class="createQianwenDto.message.length !== 0 ? 'bottom-4 max-sm:bottom-0 max-sm:left-0' : 'max-sm:left-0'"
          class="transition duration-1000 fixed w-[1000px] max-sm:w-full">
          <div class="relative w-full h-36 max-sm:h-24">
            <textarea class="focus:outline-none border-2 border-gray-400 
              bg-white
          focus:border-blue-400 rounded-md placeholder:text-sm text-sm placeholder:text-gray-400
           focus:placeholder:text-blue-400 p-2 resize-none w-full h-36
           transition duration-100 max-sm:h-24" placeholder="发消息" v-model="createQianwenDto.dialogContent"
              @keydown="sendMsgCheck" @paste="pasteContent" />
            <button class="absolute bottom-2 right-12 bg-blue-500 hover:bg-blue-400 text-white rounded-full size-8 flex
           justify-center items-center cursor-pointer disabled:bg-gray-400 transition duration-500"
              v-show="!finishFlag" @click="cancelOutput">
              <PauseOutlined />
            </button>
            <div class="absolute bottom-2 right-12">
              <a-upload v-if="canAttach.includes(createQianwenDto.aiModelType)"
                class="flex w-36 max-w-full items-center flex-row-reverse"
                :class="imageList.length > 0 ? 'translate-y-[-6px]' : ''" v-model:file-list="imageList" list-type="text"
                name="file" :max-count="1" :action="`${pathRewrite}/upload/oss`" :before-upload="beforeUpload" :headers="{
                  [Constant.JWT_HEADER_NAME]: Cookies.get(Constant.JWT_HEADER_NAME) || ''
                }" @change="handleChange">
                <button v-show="imageList.length === 0" class="bg-blue-500 hover:bg-blue-400 text-white rounded-full size-8 flex
           justify-center items-center cursor-pointer disabled:bg-gray-400 transition duration-500"
                  title="附件（支持粘贴、支持拖拽，拖拽至此处上传）">
                  <i class="iconfont">&#xe655;</i>
                </button>
              </a-upload>
              <!-- <div v-if="imageList.length > 0"
                class="flex items-center relative hover:bg-gray-50 transition-all duration-100 rounded-md cursor-pointer group">
                <button class="rounded-full size-8 flex
           justify-center items-center transition duration-500">
                  <i class="iconfont">&#xe655;</i>
                </button>
                <p class=" hover:border-blue-300 w-36 max-w-full text-ellipsis overflow-hidden text-sm text-gray-700"
                  :title="imageList[0].originFileObj?.name">
                  {{ imageList[0].originFileObj?.name }}
                </p>
                <div class="hidden group-hover:block">
                  <CloseOutlined
                    class="absolute top-0 right-0 bg-red-500 hover:bg-red-400 rounded-full cursor-pointer"
                    style="color: #fff; padding: 2px;font-size: 10px;" title="删除附件" @click="deleteImage"/>
                </div>
              </div> -->
            </div>
            <button :disabled="createQianwenDto.dialogContent === '' || !finishFlag" @click="sendMsg" class="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full size-8 flex
            justify-center items-center cursor-pointer disabled:bg-gray-400 transition duration-500">
              <ArrowUpOutlined class="font-bold" v-if="finishFlag" />
              <LoadingOutlined class="font-bold" v-else />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-show="scrollTopShow"
      class="fixed bottom-44 right-4 bg-blue-500 hover:bg-blue-400 size-9 rounded-full flex justify-center items-center cursor-pointer"
      @click="scrollTop">
      <!-- <ArrowUpOutlined style="color: #fff;"/> -->
      <p class="text-white">UP</p>
    </div>

    <div v-show="!finishFlag"
      class="fixed bottom-32 right-4 bg-blue-500 hover:bg-blue-400 size-9 rounded-full flex justify-center items-center cursor-pointer"
      @click="scrollDown">
      <!-- <ArrowUpOutlined style="color: #fff;"/> -->
      <p class="text-white text-sm">
        <DownOutlined />
      </p>
    </div>

    <a-drawer :width="250" title="最近对话" placement="left" :open="mobileGroupShow" @close="mobileGroupShow = false">
      <template #extra>
      </template>
      <div>
        <button class="cursor-pointer flex items-center gap-2 bg-linear-to-r from-cyan-500 hover:from-cyan-400
           to-blue-500 hover:to-blue-400 text-white w-full p-2 rounded-xl transition duration-100 mb-2"
          @click="createNewDialog">
          <PlusOutlined />
          <span>新对话</span>
        </button>
        <div v-if="dialogGroups.length === 0">
          <p class="text-gray-500 text-sm mt-2 pl-6">暂无对话哦</p>
        </div>
        <TransitionGroup name="apperIn" v-if="dialogGroups.length != 0">
          <div v-for="item in dialogGroups" :key="item.id" @click="getQianwenDialogGroupOneWrap(item)" class="first:mt-2 flex gap-1 translate-x-0 justify-between w-full h-fit min-h-8 px-2 py-1
               leading-9 rounded-xl cursor-pointer hover:bg-blue-200 hover:text-gray-600"
            :class="item.id === dialogGroupsActiveId ? 'bg-blue-500 text-white hover:bg-blue-500 hover:text-white' : ''">
            <p class="flex-1 text-sm text-ellipsis line-clamp-2">{{ item.groupName }}</p>
            <p class="text-xs flex items-center">{{ item.aiModelType }}</p>
          </div>
        </TransitionGroup>
      </div>
    </a-drawer>
  </div>
</template>

<style>
pre {
  margin: 8px 0;
}

code {
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
}

.apperIn-move,
.apperIn-enter-active,
.apperIn-leave-active {
  transition: all 0.5s ease;
}

.apperIn-enter-from,
.apperIn-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.apperBottomIn-move,
.apperBottomIn-enter-active,
.apperBottomIn-leave-active {
  transition: all 0.2s ease;
}

.apperBottomIn-enter-from,
.apperBottomIn-leave-to {
  opacity: 0;
  transform: translateY(10%);
}

/* @keyframes apperIn {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(0%);
  }
}

.apperIn-enter-active {
  animation: apperIn ease-in-out .5s forwards;
}

.apperIn-leave-active {
  animation: apperIn ease-in-out .5s forwards reverse;
} */

pre .enhance {
  display: flex;
  align-items: center;
  height: 38px;
  color: #fff;
  padding: 0px 10px;
  font-size: 14px;
  background: #343541de;
  border-radius: 10px 10px 0 0;
  justify-content: space-between;

  .copyCode {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.1s ease-in-out;

    &:hover {
      color: var(--primary-color);
    }

    i {
      font-size: 16px;
      margin-left: 5px;
    }
  }
}
</style>