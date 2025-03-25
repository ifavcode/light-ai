<script setup lang="ts">
//@ts-ignore
import { getLanguageApi } from '@/api/setting';
import { CodeType, Constant, ExecStatus, type ExecCode, type RC } from '@/types';
import { DownOutlined, LoadingOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons-vue';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import * as monaco from 'monaco-editor';
import xcoode from 'monaco-themes/themes/Xcode_default.json'
// import xcoode from 'monaco-themes/themes/All Hallows Eve.json'
import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'


const codeEditorRef = ref()

const execCode = reactive<ExecCode>({
  codeType: CodeType.JAVA,
  sourceCode: '',
  input: '',
})
const isRunning = ref(false)
const output = ref('')
const outputErr = ref('')
const languages = ref<RC[]>([])
let stopTimer: number
function setEditorLanguage() {
  monaco.editor.setModelLanguage(codeEditor.getModel()!, execCode.codeType)
  formatCode()
}

let codeEditor: monaco.editor.IStandaloneCodeEditor
function initEditor() {
  monaco.editor.defineTheme('xcode', xcoode as any)
  codeEditor = monaco.editor.create(codeEditorRef.value, {
    value: ``,
    contextmenu: true,
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    theme: 'xcode',
    scrollBeyondLastLine: false,
    tabSize: 2,
    fontSize: 14,
    suggest: {
      showInlineDetails: true,
      showMethods: true,
      showFunctions: true,
      showConstructors: true,
      showDeprecated: true,
      matchOnWordStartOnly: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showKeywords: true,
      showWords: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showIssues: true,
      showUsers: true,
      showSnippets: true,
    },
  });
  if (document.body.clientWidth > 480) {
    if (localStorage.getItem('editorWidth')) {
      const { left, right } = JSON.parse(localStorage.getItem('editorWidth') as string)
      leftRef.value.style.width = left
      rightRef.value.style.width = right
    } else {
      leftRef.value.style.width = Math.floor(document.body.clientWidth / 2) - 4 + 'px'
      rightRef.value.style.width = Math.floor(document.body.clientWidth / 2) + 'px'
    }
  }
  codeEditor.layout()
  setEditorLanguage()
  const codeType = localStorage.getItem('codeType')
  if (codeType) {
    execCode.codeType = codeType as CodeType
  }
  const curExecCode = localStorage.getItem(`code-${execCode.codeType}`)
  if (curExecCode) {
    const obj: ExecCode = JSON.parse(curExecCode)
    codeEditor.setValue(obj.sourceCode)
  }
}

const leftRef = ref()
const centerRef = ref()
const rightRef = ref()
const boxRef = ref()

function initCenterBar() {
  centerRef.value.onmousedown = (e: MouseEvent) => {
    const startX = e.clientX; // 记录坐标起始位置
    leftRef.value.left = leftRef.value.offsetWidth; // 左边元素起始宽度
    document.onmousemove = e => {
      const endX = e.clientX; // 鼠标拖动的终止位置
      console.log(leftRef.value.left);

      let moveLen = leftRef.value.left + (endX - startX); // 移动的距离 =  endX - startX，左边区域最后的宽度 = resizeDom.left + 移动的距离
      const maxWidth = boxRef.value.clientWidth - centerRef.value.offsetWidth; // 左右两边区域的总宽度 = 外层容器宽度 - 中间区域拖拉框的宽度
      // 限制左边区域的最小宽度为 leftMinWidth
      if (moveLen < 200) {
        moveLen = 200;
      }
      // 右边区域最小宽度为 rightMinWidth
      if (moveLen > maxWidth - 200) {
        moveLen = maxWidth - 200;
      }
      leftRef.value.style.width = (moveLen / maxWidth) * 100 + "%"; // 设置左边区域的宽度，通过换算为百分比的形式，实现窗体放大缩小自适应
      rightRef.value.style.width = ((maxWidth - moveLen) / maxWidth) * 100 + "%"; // 右边区域 = 总大小 - 左边宽度 - 拖动条宽度
    };
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
      centerRef.value.releaseCapture && centerRef.value.releaseCapture(); // 鼠标捕获释放
      codeEditor.layout()
      localStorage.setItem('editorWidth', JSON.stringify({
        left: leftRef.value.style.width,
        right: rightRef.value.style.width
      }))
    };
    centerRef.value.setCapture && centerRef.value.setCapture(); // 启用鼠标捕获
    return false;
  };
}

async function getLanguage() {
  const { data: res } = await getLanguageApi()
  if (res.code === 200) {
    languages.value = res.data
  }
}

function toggleLanguage(item: RC) {
  codeEditor.setValue('')
  execCode.codeType = item.value as CodeType
  localStorage.setItem('codeType', execCode.codeType)
  const curExecCode = localStorage.getItem(`code-${item.value}`)
  if (curExecCode) {
    const obj: ExecCode = JSON.parse(curExecCode)
    codeEditor.setValue(obj.sourceCode)
  }
}

// async function execCodeFunc() {
// isRunning.value = true
//   execCode.sourceCode = codeEditor.getValue()
//   const { data: res } = await execCodeApi(execCode)
//   if (res.code === 200) {

//   }
// }

function execCodeWs() {
  isRunning.value = true
  output.value = ''
  outputErr.value = ''
  execCode.sourceCode = codeEditor.getValue()
  socket.emit('execCode', execCode)
  clearTimeoutFunc()
}

function clearTimeoutFunc() {
  clearTimeout(stopTimer)
  stopTimer = setTimeout(() => {
    window.$message.error('运行超时，请重试')
    isRunning.value = false
  }, 1000 * 10); // 10s运行超时自动取消
}

let socket: Socket
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

  socket.on("execRes", (e) => {
    const status = parseInt(e.status)
    const data = e.data
    if (status === ExecStatus.ERROR) {
      outputErr.value += data
      isRunning.value = false
    } else if (status === ExecStatus.FINISH) {
      isRunning.value = false
      clearTimeout(stopTimer)
    } else if (status === ExecStatus.RUNNING) {
      output.value += data
      clearTimeoutFunc()
    }
  });

  socket.on("execCode", (e) => {
    console.log('execCode:' + e);
  });

  socket.on("disconnect", () => {
    console.log('socket已断开连接');
  });
}

let autoSaveTimer: number
function autoSave() {
  autoSaveTimer = setInterval(() => {
    execCode.sourceCode = codeEditor.getValue()
    localStorage.setItem(`code-${execCode.codeType}`, JSON.stringify(execCode))
  }, 3000);
}

const isMobile = computed(() => {
  return document.body.clientWidth <= 480
})

async function formatCode() {
  codeEditor.getAction('editor.action.formatDocument')?.run();;
}

onMounted(() => {
  initEditor()
  initCenterBar()
  getLanguage()
  initSocket()
  autoSave()
})

onBeforeUnmount(() => {
  clearInterval(autoSaveTimer)
})

</script>

<template>
  <div class="w-full flex max-sm:flex-col" style="height: calc(100vh - 50px);" ref="boxRef">
    <div class="max-sm:w-full" ref="leftRef">
      <div class="w-full h-12 bg-white px-6 py-1 flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <Menu as="div" class="relative inline-block text-left">
            <div class="">
              <MenuButton
                class="inline-flex w-full justify-center rounded-md bg-linear-to-r disabled:from-sky-300 disabled:to-indigo-300 disabled:cursor-not-allowed from-sky-500 to-indigo-500
                 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-indigo-400 focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-white/75">
                <div class="flex items-center gap-1">
                  <DownOutlined />
                  <span>{{ execCode.codeType || '选择语言' }}</span>
                </div>
              </MenuButton>
              <!-- <p class="text-xs text-gray-500">下拉选择更多可用模型</p> -->
            </div>

            <transition enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0">
              <MenuItems
                class="absolute z-10 left-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div class="px-1 py-1">
                  <MenuItem v-for="(item, index) in languages">
                  <button :class="[
                    execCode.codeType === item.value ? 'bg-linear-to-r from-sky-500 to-indigo-500 text-white' : 'text-gray-900',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer',
                  ]" @click="toggleLanguage(item)">
                    {{ item.label }}
                  </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
          <!-- <div class="text-sm flex items-center gap-1 select-none cursor-pointer" @click="formatCode">
            <p class="text-gray-500 hover-primary">格式化</p>
          </div> -->
          <div class="text-sm flex items-center gap-1 select-none">
            <SaveOutlined />
            <p class="text-gray-500">自动保存</p>
          </div>
        </div>
        <div>
          <button :disabled="isRunning" class="bg-green-500 text-white px-4 text-sm rounded-md h-8 flex items-center gap-1 cursor-pointer hover:bg-green-400 transition duration-100 submit-button
             disabled:bg-gray-600 disabled:hover:bg-gray-600 disabled:cursor-progress" @click="execCodeWs">
            <SendOutlined class="icon" />
            <span>{{ `运行${isRunning ? '中' : ''}` }}</span>
            <LoadingOutlined v-show="isRunning" />
          </button>
        </div>
      </div>
      <div ref="codeEditorRef" class="w-full" :style="{ height: isMobile ? '360px' : 'calc(100vh - 6rem)' }">
      </div>
    </div>
    <div class="w-[2px] bg-gray-100 cursor-move hover:bg-blue-500 transition-all duration-200" ref="centerRef">
    </div>
    <div class="relative bg-white max-sm:w-full max-sm:border-t max-sm:border-t-gray-200" ref="rightRef">
      <div class="w-full p-4" :style="{ height: isMobile ? '360px' : 'calc(100vh - 6rem)' }">
        <div class="w-full h-1/2 border-b border-gray-200">
          <p>
            <i class="iconfont">&#xe600;</i>
            输入
          </p>
          <textarea class="focus:outline-none border-2 border-transparent
              bg-white
          focus:border-blue-400 rounded-md placeholder:text-sm text-sm placeholder:text-gray-400
           focus:placeholder:text-blue-400 p-2 resize-none w-full h-[calc(100%-2rem)]
           transition duration-100" placeholder="控制台输入" v-model="execCode.input"></textarea>
        </div>
        <div class="w-full h-1/2 pt-4">
          <p>
            <i class="iconfont">&#xe651;</i>
            输出
          </p>
          <div class="mt-2 text-gray-800 font-mono overflow-y-auto h-full bg-gray-100 shadow whitespace-pre-line">
            <p>{{ output }}</p>
            <p class="text-red-500">{{ outputErr }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes shake {
  0% {
    transform: translate(1px, 1px);
  }

  25% {
    transform: translate(-1px, -1px);
  }

  50% {
    transform: translate(1px, -1px);
  }

  75% {
    transform: translate(-1px, 1px);
  }

  100% {
    transform: translate(0, 0);
  }
}

.submit-button {
  &:hover {
    .icon {
      animation: shake 0.5s ease-in-out infinite;
    }
  }

  &:disabled {
    .icon {
      animation: none !important;
    }
  }
}
</style>