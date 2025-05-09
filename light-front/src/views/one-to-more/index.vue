<script setup lang="ts">
import { createDialogGroupApi, getQianwenDialogGroupMoreApi, getQianwenDialogGroupOneApi, sendMsgMoreApi } from '@/api/ai';
import { getAiAllowListApi } from '@/api/setting';
import { useUserStore } from '@/stores/userStore';
import { Constant, MessageRole, ModelType, type AllowList, type CreateQianwenDto, type DialogGroup, type Message, type Page, type replyQianwenDTO } from '@/types';
import { ArrowUpOutlined, LoadingOutlined, MenuUnfoldOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { EventSourcePolyfill } from 'event-source-polyfill';
import Cookies from 'js-cookie'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { emitter, modelImageMap } from '@/utils';

const router = useRouter()
const route = useRoute()
const { user } = useUserStore()
const finishFlagMap = ref<Record<string, boolean>>({})
const finishFlag = computed(() => {
  return Object.values(finishFlagMap.value).find(v => !v) == null
})

// { role: MessageRole.USER, content: '你是谁？' }, { role: MessageRole.ASSISTANT, content: '我是' }
const dialogContent = ref('')
const dialogGroupId = ref(-1)
const createQianwenDtoMap = ref<Record<string, CreateQianwenDto>>({
})

let es: EventSourcePolyfill
function conncetServerSseApi() {
  if (es) {
    es.close()
  }
  es = new EventSourcePolyfill("/dev-api/qianwen/connect", {
    headers: {
      Authorization: Cookies.get(Constant.JWT_HEADER_NAME) as string
    }
  });

  es.onmessage = (event) => {
  };

  selectModels.value.forEach(value => {
    es.addEventListener('ai_' + value, (event: MessageEvent | any) => {
      const data: replyQianwenDTO = JSON.parse(event.data);
      const createQianwenDto = createQianwenDtoMap.value[value]
      if (data.choices[0].finish_reason && data.choices[0].finish_reason != null) {
        clearAutoScroll()
        finishFlagMap.value[value] = true
      }
      if (data.choices[0].delta) {
        if (data.choices[0].delta.content) {
          createQianwenDto.message[createQianwenDto.message.length - 1].content += data.choices[0].delta.content
        }
      }
    })
  })

  es.onerror = (error) => {
    // window.$message.error('网络异常，请重试')
    console.error("EventSource failed:", error);
  };
}

async function createDialogGroup(): Promise<number> {
  const { data: res } = await createDialogGroupApi({
    groupName: dialogContent.value,
    aiModelType: 'more' as ModelType
  })
  if (res.code === 200) {
    dialogGroups.value.unshift(res.data)
    return res.data.id
  }
  return -1
}

async function sendMsgMore() {
  if (dialogGroupId.value === -1) {
    const id = await createDialogGroup()
    if (id === -1) {
      window.$message.error('发送异常，请重试')
      return
    }
    dialogGroupId.value = id
  }
  let rebackMsg = ''
  try {
    (Object.keys(createQianwenDtoMap.value) as ModelType[]).forEach((key) => {
      createQianwenDtoMap.value[key].dialogContent = dialogContent.value
      createQianwenDtoMap.value[key].dialogGroupId = dialogGroupId.value
      createQianwenDtoMap.value[key].message.push({
        role: MessageRole.USER,
        content: dialogContent.value
      })
      finishFlagMap.value[key] = false
    })
    startAutoScroll()
    sendMsgMoreApi({
      createQianwenMap: createQianwenDtoMap.value
    });
    (Object.keys(createQianwenDtoMap.value) as ModelType[]).forEach((key) => {
      createQianwenDtoMap.value[key].message.push({
        role: MessageRole.ASSISTANT,
        content: ''
      })
    })
    rebackMsg = dialogContent.value
    dialogContent.value = ''
  } catch (error) {
    window.$message.error('网络异常请重试');
    (Object.keys(createQianwenDtoMap.value) as ModelType[]).forEach((key) => {
      createQianwenDtoMap.value[key].message.pop()
      createQianwenDtoMap.value[key].message.pop()
      finishFlagMap.value[key] = true
    })
    dialogContent.value = rebackMsg
  }
}

function sendMsgCheck(e: KeyboardEvent) {
  if (e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    dialogContent.value += '\n'
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (dialogContent.value === '' || !finishFlag.value) return
    sendMsgMore()
  }
}

const dialogGroups = ref<DialogGroup[]>([])
const page = reactive<Page<any>>({
  pageNum: 1,
  pageSize: 20
})
async function getQianwenDialogGroupMore() {
  const { data: res } = await getQianwenDialogGroupMoreApi(page)
  if (res.code === 200) {
    dialogGroups.value = res.data
    const dialogGroup = res.data.find(v => (v.id.toString()) === (route.query.g as string))
    if (dialogGroup) {
      getQianwenDialogGroupOne(dialogGroup)
    }
  }
}

async function getQianwenDialogGroupOne(item: DialogGroup) {
  dialogGroupId.value = item.id
  const { data: res } = await getQianwenDialogGroupOneApi(dialogGroupId.value);
  (Object.keys(createQianwenDtoMap.value) as ModelType[]).forEach((key) => {
    createQianwenDtoMap.value[key].dialogGroupId = dialogGroupId.value
    createQianwenDtoMap.value[key].message = []
    finishFlagMap.value[key] = true
  });
  if (res.data) {
    res.data.dialogs.forEach((v) => {
      if (selectModels.value.includes(v.aiModelType)) {
        createQianwenDtoMap.value[v.aiModelType].message.push({
          role: MessageRole.USER,
          content: v.dialogContent
        })
        createQianwenDtoMap.value[v.aiModelType].message.push({
          role: MessageRole.ASSISTANT,
          content: v.replyContent
        })
      }
    })
    router.push({
      name: 'oneToMore',
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
    toolsShow.value = false
  }
}

function createNewDialog() {
  dialogGroupId.value = -1;
  (Object.keys(createQianwenDtoMap.value) as ModelType[]).forEach((key) => {
    createQianwenDtoMap.value[key].message = []
    createQianwenDtoMap.value[key].dialogGroupId = -1
    createQianwenDtoMap.value[key].dialogContent = ''
  })
  router.push({
    name: 'oneToMore',
    query: {
    }
  })
  toolsShow.value = false
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

function scrollFunc() {
  clearTimeout(listenTimer)
  listenTimer = setTimeout(() => {
    const scrollTop = document.documentElement.scrollTop
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (documentHeight - (scrollTop + windowHeight) <= 1) {
      if (!finishFlag.value) {
        startAutoScroll()
      }
    } else {
      clearAutoScroll()
    }
  }, 10);
}

let listenTimer: number | undefined
function listenScroll() {
  document.addEventListener('scroll', scrollFunc)
}

watch(finishFlag, () => {
  if (finishFlag.value) {
    clearAutoScroll()
  }
})

const toolsShow = ref(false)

const selectModels = ref<ModelType[]>([])
const aiAllowList = ref<AllowList[]>([])
async function getAiAllowList() {
  const { data: res } = await getAiAllowListApi()
  if (res.data) {
    aiAllowList.value = res.data
    const modelSelectStorage = localStorage.getItem(Constant.MODEL_SELECT)
    if (modelSelectStorage) {
      selectModels.value = JSON.parse(modelSelectStorage)
    }
    if (selectModels.value.length === 0) {
      for (let i = 0; i < Math.min(aiAllowList.value.length, 4); i++) {
        selectModels.value.push(aiAllowList.value[i].value)
      }
    }
    selectModels.value.forEach(v => {
      finishFlagMap.value[v] = true
      createQianwenDtoMap.value[v] = {
        message: [],
        aiModelType: v,
        reasoning: false,
        dialogContent: '',
        dialogGroupId: -1
      }
    })
    conncetServerSseApi()
  }
}

function toggleModel(obj: AllowList) {
  if (selectModels.value.includes(obj.value)) {
    selectModels.value = selectModels.value.filter(v => v !== obj.value)
  } else {
    selectModels.value.push(obj.value)
  }
  const msgMap: Record<string, Message[]> = {}
  Object.keys(createQianwenDtoMap.value).forEach(key => {
    msgMap[key] = createQianwenDtoMap.value[key].message
  })
  createQianwenDtoMap.value = {}
  selectModels.value.forEach(v => {
    finishFlagMap.value[v] = true
    createQianwenDtoMap.value[v] = {
      message: msgMap[v] ?? [],
      aiModelType: v,
      reasoning: false,
      dialogContent: '',
      dialogGroupId: -1
    }
  })
  conncetServerSseApi()
  const dialogGroup = dialogGroups.value.find(v => (v.id.toString()) === (route.query.g as string))
  if (dialogGroup) {
    getQianwenDialogGroupOne(dialogGroup)
  }
  localStorage.setItem(Constant.MODEL_SELECT, JSON.stringify(selectModels.value))
}

onMounted(() => {
  getQianwenDialogGroupMore()
  listenScroll()
  getAiAllowList()

  emitter.on('loginSuccess', () => {
    getQianwenDialogGroupMore()
    getAiAllowList()
  })
})

onBeforeUnmount(() => {
  if (es) {
    es.close()
  }
})

</script>

<template>
  <div class="w-full  mt-16">
    <div class="w-[1000px] m-auto relative max-sm:w-full max-sm:px-2">
      <div class="w-fit bg-white py-2 px-3 rounded-md shadow flex items-center gap-4">
        <MenuUnfoldOutlined @click="toolsShow = !toolsShow" class="hover-primary cursor-pointer" title="组信息" />
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton
            class="inline-flex w-full justify-center rounded-md
                  text-sm font-medium hover:from-sky-400 hover:to-indigo-400 focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-white/75">
            <div class="flex items-center translate-y-[-2px]">
              <PlusOutlined class="hover-primary cursor-pointer" title="添加模型" />
            </div>
          </MenuButton>
          <div>
            <transition enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0">
              <MenuItems
                class="absolute z-[70] left-0 top-8 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div class="px-1 py-1">
                  <MenuItem v-for="(item, index) in aiAllowList">
                  <button :class="[
                    selectModels.includes(item.value) ? 'bg-linear-to-r from-sky-500 to-indigo-500 text-white' : 'text-gray-900',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer mt-1',
                  ]" @click="toggleModel(item)">
                    {{ item.label }}
                  </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </div>
        </Menu>
      </div>
      <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
        <div class="absolute bg-white rounded-md py-2 px-3 mt-2 shadow w-[200px] z-[70]" v-show="toolsShow">
          <button class="cursor-pointer flex items-center gap-2 bg-linear-to-r from-cyan-500 hover:from-cyan-400
           to-blue-500 hover:to-blue-400 text-white w-full p-2 rounded-xl transition duration-100"
            @click="createNewDialog">
            <PlusOutlined />
            <span>新对话</span>
          </button>
          <h1 class="flex items-center text-gray-800 py-2">
            <MessageOutlined />
            <span class="px-2 text-gray-800">最近对话</span>
          </h1>
          <div>

          </div>
          <div v-if="dialogGroups.length === 0">
            <p class="text-gray-500 text-sm mt-2 pl-6">暂无对话哦</p>
          </div>
          <TransitionGroup name="apperIn" v-if="dialogGroups.length != 0">
            <div v-for="item in dialogGroups" :key="item.id" @click="getQianwenDialogGroupOne(item)" class="first:mt-2 flex gap-1 translate-x-0 justify-between w-full h-fit min-h-8 px-2 py-1
               leading-9 rounded-xl cursor-pointer hover:bg-blue-200 hover:text-gray-600"
              :class="item.id === dialogGroupId ? 'bg-blue-500 text-white hover:bg-blue-500 hover:text-white' : ''">
              <p class="flex-1 text-sm text-ellipsis line-clamp-2">{{ item.groupName }}</p>
            </div>
          </TransitionGroup>
        </div>
      </Transition>
    </div>
    <div class="w-full mt-4 relative">
      <div class="flex h-fit">
        <Ai v-for="model in selectModels" :finishFlag="finishFlagMap[model]" :imgName="modelImageMap[model]"
          :createQianwenDto="createQianwenDtoMap[model]" />
        <!-- <Ai :finishFlag="finishFlagMap[ModelType.QIAN_FAN]" imgName="/model/qianfan.png"
          :createQianwenDto="createQianwenDtoMap[ModelType.QIAN_FAN]" />
        <Ai :finishFlag="finishFlagMap[ModelType.DOU_BAO]" imgName="/model/doubao.jpg"
          :createQianwenDto="createQianwenDtoMap[ModelType.DOU_BAO]" />
        <Ai :finishFlag="finishFlagMap[ModelType.DEEP_SEEK]" imgName="/model/deepseek.png"
          :createQianwenDto="createQianwenDtoMap[ModelType.DEEP_SEEK]" /> -->
      </div>
      <div class="absolute mx-auto w-full translate-y-20 flex justify-center" v-show="dialogGroupId === -1">
        <p class="text-4xl font-semibold font-serif">
          你好，
          <span>{{ user?.nickname || '请登录' }}</span>
        </p>
      </div>
    </div>
    <div>
      <div
        class="transition duration-1000 fixed w-[1000px] bottom-4 left-[50%] translate-x-[-50%] max-sm:bottom-0 max-sm:w-full">
        <div class="relative w-full h-36 max-sm:h-24">
          <textarea v-model="dialogContent" class="focus:outline-none border-2 border-gray-400 
              bg-white
          focus:border-blue-400 rounded-md placeholder:text-sm text-sm placeholder:text-gray-400
           focus:placeholder:text-blue-400 p-2 resize-none w-full h-36
           transition duration-100 max-sm:h-24" placeholder="发消息" @keydown="sendMsgCheck" />
          <button :disabled="dialogContent === '' || !finishFlag" class="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full size-8 flex
            justify-center items-center cursor-pointer disabled:bg-gray-400 transition duration-500"
            @click="sendMsgMore">
            <ArrowUpOutlined class="font-bold" v-if="finishFlag" />
            <LoadingOutlined class="font-bold" v-else />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.apperIn-move,
.apperIn-enter-active,
.apperIn-leave-active {
  transition: all 0.5s ease;
}

.apperIn-enter-from,
.apperIn-leave-to {
  opacity: 0;
  transform: translateX(-10%);
}

/* pre .enhance {
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
} */
</style>