<script setup lang="ts">
import { createDirApi, deleteDirApi, deleteFileApi, downloadDirApi, downloadFileApi, getFileContentApi, getUserFilesApi } from '@/api/user';
import { Constant } from '@/types';
import { classifyFile } from '@/utils';
import { pathRewrite } from '@/utils/request';
import { CloseOutlined, CloudDownloadOutlined, CloudUploadOutlined, CopyOutlined, DeleteOutlined, FolderOpenOutlined, LoadingOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons-vue';
import type { UploadChangeParam } from 'ant-design-vue';
import ClipboardJS from 'clipboard';
import dayjs from 'dayjs';
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.min.css'
import Cookies from 'js-cookie'

const dir = ref<string[]>([])
const fileList = ref<Record<string, any>[]>([])
const fileLoading = ref(false)
const router = useRouter()
const route = useRoute()

async function getUserFiles() {
  try {
    fileLoading.value = true
    const { data: res } = await getUserFilesApi(dir.value.join(','))
    fileList.value = res.data
    state.selectArr = new Array(fileList.value.length).fill(false)
    handleSelectChange()
  } catch (error) {

  } finally {
    fileLoading.value = false
  }
}

const sizeArr = ['B', 'KB', 'MB', 'GB']
function getSize(size: number) {
  let i = 0
  while (size > 1024 && i < sizeArr.length - 1) {
    size /= 1024
    i += 1
  }
  return size.toFixed(2) + sizeArr[i]
}

function loadDir(dirname: string) {
  dir.value.push(dirname)
  getUserFiles()
}

function hanleClickRoot() {
  if (dir.value.length === 0) return
  dir.value = []
  getUserFiles()
}

function toggleDir(index: number) {
  dir.value = dir.value.slice(0, index + 1)
  getUserFiles()
}

watch(dir, () => {
  router.push({
    query: {
      dir: dir.value.join(',')
    }
  })
}, { deep: true })

const preview = reactive({
  filename: '',
  content: '',
  type: ''
})
const previewRef = ref<HTMLElement>()
async function getFileContent(filename: string) {
  const type = classifyFile(filename)
  preview.type = type
  preview.filename = filename
  if (type === 'text') {
    try {
      const { data: res } = await getFileContentApi([...dir.value, filename].join(','))
      preview.content = res.data
      nextTick(() => {
        if (previewRef.value) {
          previewRef.value.classList.remove('highlighted');
          previewRef.value.dataset.highlighted = '';
          hljs.highlightElement(previewRef.value as HTMLElement);
        }
      })
    } catch (error) {
      window.$message.error('浏览文件失败')
    }
  } else if (type === 'image') {
    preview.content = '不支持浏览'
  } else if (type === 'video') {
    preview.content = '不支持浏览'
  } else if (type === 'other') {
    preview.content = '不支持浏览'
  }
}

function copyText() {
  window.$message.success('复制成功')
}

function initCopyJs() {
  new ClipboardJS('.copy-button')
}

function closePreview() {
  preview.content = ''
  preview.filename = ''
}

// 添加文件夹
const isAddDir = ref(false)
const newDirname = ref('')
const newDirRef = ref<HTMLElement>()

function createDirWrap() {
  isAddDir.value = true
  nextTick(() => {
    newDirRef.value?.focus()
  })
}

async function createDir() {
  try {
    await createDirApi([...dir.value, newDirname.value].join(','))
    await getUserFiles()
  } catch (error) {
    window.$message.error('创建失败，请重试')
  } finally {
    isAddDir.value = false
    newDirname.value = ''
  }
}

const uploadFileList = ref([])
const loading = ref(false)

const beforeUpload = (file: any) => {
  const isLt512M = file.size / 1024 / 1024 < 512;
  if (!isLt512M) {
    window.$message.error('最大支持上次512MB');
  }
  console.log(file);

  return isLt512M;
};

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    // Get this url from response in real world.
    loading.value = false;
    getUserFiles()
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

// 删除部分
const state = reactive({
  indeterminate: false,
  checkAll: false,
  selectArr: [] as boolean[]
});

const onCheckAllChange = (e: any) => {
  Object.assign(state, {
    selectArr: e.target.checked ? (
      new Array(fileList.value.length).fill(true)
    ) : [],
    indeterminate: false,
  });
};

function handleSelectChange() {
  const count = state.selectArr.reduce((pre, cur) => {
    pre += cur ? 1 : 0
    return pre
  }, 0)
  state.checkAll = count === fileList.value.length && count != 0
  state.indeterminate = count > 0 && count < fileList.value.length
}

function stopPop(e: Event) {
  e.stopPropagation()
}
function deleteFunc() {
  try {
    fileLoading.value = true
    state.selectArr.forEach(async (v, i) => {
      if (v) {
        if (fileList.value[i].type === 'dir') {
          await deleteDir([...dir.value, fileList.value[i].filename].join(','))
        } else {
          await deleteFile([...dir.value, fileList.value[i].filename].join(','))
        }
      }
    })
    getUserFiles()
  } catch (error) {

  } finally {
    fileLoading.value = false
  }
}

async function deleteFile(filename: string) {
  try {
    await deleteFileApi([...dir.value, filename].join(','))
  } catch (error) {
    window.$message.error('删除失败，请重试')
  }
}

async function deleteDir(filename: string) {
  try {
    await deleteDirApi([...dir.value, filename].join(','))
  } catch (error) {
    window.$message.error('删除失败，请重试')
  }
}


const isDownloading = computed(() => {
  let back: any = false
  for (let v of processList.value.values()) {
    back |= v.isDownloading
  }
  return back
})
const processList = ref(new Map())
async function downloadFunc() {
  if (isDownloading.value) {
    return
  }
  try {
    state.selectArr.forEach(async (v, i) => {
      if (v) {
        if (fileList.value[i].type === 'dir') {
          downloadDir(fileList.value[i].filename, fileList.value[i].type)
        } else {
          downloadFile(fileList.value[i].filename, fileList.value[i].type)
        }
      }
    })
  } catch (error) {

  } finally {
  }
}

async function downloadFile(filename: string, type: string) {
  try {
    const download = downloadFileApi(dir.value, filename)
    processList.value.set([...dir.value, filename, type].join(','), download)
  } catch (error: any) {
    window.$message.error(error.message)
  }
}

async function downloadDir(filename: string, type: string) {
  try {
    const download = downloadDirApi(dir.value, filename)
    processList.value.set([...dir.value, filename, type].join(','), download)
  } catch (error: any) {
    window.$message.error(error.message)
  }
}

onMounted(() => {
  if (route.query.dir) {
    dir.value = (route.query.dir as string).split(',')
  }
  getUserFiles()
  nextTick(() => {
    initCopyJs()
  })
})

</script>

<template>
  <div>
    <div class="py-3 px-2 bg-white rounded-md shadow  w-full">
      <div class="flex items-center gap-2 overflow-x-auto flex-wrap">
        <div @click="createDirWrap"
          class="flex items-center text-sm gap-1 text-gray-600 hover:text-gray-500 hover:bg-gray-100 w-fit py-1 px-2 transition-all duration-200 rounded-md cursor-pointer">
          <PlusOutlined />
          <span>添加文件夹</span>
        </div>
        <div
          class="flex items-center text-sm gap-1 text-gray-600 hover:text-gray-500 hover:bg-gray-100 w-fit py-1 px-2 transition-all duration-200 rounded-md cursor-pointer relative">
          <CloudUploadOutlined />
          <span>上传文件</span>
          <div class="absolute w-full h-full overflow-hidden left-0 top-0">
            <a-upload class="opacity-0" v-model:file-list="uploadFileList" :before-upload="beforeUpload" :headers="{
              [Constant.JWT_HEADER_NAME]: Cookies.get(Constant.JWT_HEADER_NAME) || ''
            }" name="file" :action="`${pathRewrite}/user/upload?dir=${dir.join(',')}`" @change="handleChange">
              <a-button>
                Click to Upload
              </a-button>
            </a-upload>
          </div>
        </div>
        <div
          class="flex items-center text-sm gap-1 text-gray-600 hover:text-gray-500 hover:bg-gray-100 w-fit py-1 px-2 transition-all duration-200 rounded-md cursor-pointer">
          <FolderOpenOutlined />
          <span>上传文件夹</span>
        </div>
        <div @click="downloadFunc"
          class="flex items-center text-sm gap-1   w-fit py-1 px-2 transition-all duration-200 rounded-md"
          :class="isDownloading ? 'text-gray-500 cursor-not-allowed' : ' cursor-pointer text-gray-600 hover:text-gray-500 hover:bg-gray-100'">
          <CloudDownloadOutlined />
          <span>下载</span>
        </div>
        <a-popconfirm title="确定删除吗?" ok-text="确认" cancel-text="不了" @confirm="deleteFunc">
          <div class="flex items-center text-sm gap-1 w-fit py-1 px-2 transition-all duration-200 rounded-md "
            :class="state.selectArr.reduce((pre, cur) => {
              pre += cur ? 1 : 0
              return pre
            }, 0) === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:text-red-400 hover:bg-red-100 cursor-pointer'">
            <DeleteOutlined />
            <span>删除</span>
          </div>
        </a-popconfirm>
        <div
          class="flex items-center text-sm gap-1 text-gray-600 hover:text-gray-500 hover:bg-gray-100 w-fit py-1 px-2 transition-all duration-200 rounded-md cursor-pointer"
          @click="getUserFiles">
          <RedoOutlined :class="fileLoading ? 'loading-active' : ''" />
          <span></span>
        </div>
      </div>
      <div class="py-1 px-2 mt-1">
        <a-breadcrumb>
          <a-breadcrumb-item href="" @click="hanleClickRoot">根目录</a-breadcrumb-item>
          <a-breadcrumb-item v-for="(item, index) in dir">
            <p v-if="index === dir.length - 1">{{ item }}</p>
            <a v-else @click="toggleDir(index)">{{ item }}</a>
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>
      <div class="flex items-center text-gray-600 py-1 px-2">
        <div class="w-1/5 text-sm min-w-20 flex items-center gap-2 max-sm:w-1/3">
          <a-checkbox v-model:checked="state.checkAll" :indeterminate="state.indeterminate" @change="onCheckAllChange">
          </a-checkbox>
          <p>文件名称</p>
        </div>
        <div class="w-1/5 text-sm max-sm:hidden">
          <p>访问时间</p>
        </div>
        <div class="w-1/5 text-sm max-sm:w-1/3">
          <p>修改时间</p>
        </div>
        <div class="w-1/5 text-sm max-sm:hidden">
          <p>类型</p>
        </div>
        <div class="w-1/5 text-sm max-sm:w-1/3">
          <p>大小</p>
        </div>
      </div>
      <div v-if="fileList.length === 0" class="px-2 py-1 text-sm text-gray-500">空</div>
      <div v-if="isAddDir" class="mt-2">
        <div class="flex items-center hover:bg-gray-50 py-1 px-2 cursor-pointer">
          <div class="w-1/5 min-w-20 flex items-center gap-2 max-sm:w-1/3">
            <img class="size-6" src="@/assets/user/file_dir.svg" alt="">
            <a-input class="text-sm text-gray-800 px-2" placeholder="输入文件夹名称" @blur="isAddDir = false"
              @keydown.enter="createDir" v-model:value="newDirname" ref="newDirRef"></a-input>
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
          </div>
        </div>
      </div>
      <div v-for="(file, index) in fileList" class="mt-2">
        <div v-if="file.type === 'dir'" class="flex items-center hover:bg-gray-50 py-1 px-2 cursor-pointer"
          @click="loadDir(file.filename)">
          <div class="w-1/5 min-w-20 flex items-center gap-2 max-sm:w-1/3">
            <a-checkbox v-model:checked="state.selectArr[index]" @click="stopPop" @change="handleSelectChange" />
            <img class="size-6" src="@/assets/user/file_dir.svg" alt="">
            <p class="text-sm text-gray-800 text-ellipsis overflow-hidden pr-2 line-clamp-1" :title="file.filename">
              <span class="mr-1"
              v-if="processList.has([...dir, file.filename, file.type].join(',')) && processList.get([...dir, file.filename, file.type].join(',')).isDownloading">
                <LoadingOutlined />
              </span>
              <span>{{ file.filename }}</span>
            </p>
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
            <p>{{ dayjs(file.attrs.atime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</p>
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
            <p>{{ dayjs(file.attrs.mtime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</p>
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
            <p>文件夹</p>
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
            <!-- <p>{{ getSize(file.attrs?.size) }}</p> -->
          </div>
        </div>
        <div v-if="file.type === 'file'" class="flex items-center hover:bg-gray-50 py-1 px-2 cursor-pointer"
          @click="getFileContent(file.filename)">
          <div class="w-1/5 min-w-20 flex items-center gap-2 max-sm:w-1/3">
            <a-checkbox v-model:checked="state.selectArr[index]" @click="stopPop" @change="handleSelectChange" />
            <img class="size-6" src="@/assets/user/file.svg" alt="">
            <p class="text-sm text-gray-800 text-ellipsis overflow-hidden pr-2 line-clamp-1" :title="file.filename">
              <span class="linear-text mr-1"
                v-if="processList.has([...dir, file.filename, file.type].join(',')) && processList.get([...dir, file.filename, file.type].join(',')).isDownloading">
                {{ processList.get([...dir, file.filename, file.type].join(',')).process + '%' }}
              </span>
              <span>{{ file.filename }}</span>
            </p>
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
            <p>{{ dayjs(file.attrs.atime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</p>
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
            <p>{{ dayjs(file.attrs.mtime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</p>
          </div>
          <div class="w-1/5 text-sm max-sm:hidden">
            <p>文件</p>
          </div>
          <div class="w-1/5 text-sm max-sm:w-1/3">
            <p>{{ getSize(file.attrs?.size) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 bg-white rounded-md shadow overflow-hidden" v-show="preview.filename != ''">
      <div class="bg-[#323440] text-white h-[38px] flex items-center px-4 text-sm justify-between">
        <button class="flex items-center cursor-pointer" @click="closePreview">
          <CloseOutlined class="hover-primary" title="关闭" />
        </button>
        <p>{{ preview.filename }}</p>
        <button class="flex items-center cursor-pointer copy-button" :data-clipboard-text="preview.content"
          @click="copyText">
          <CopyOutlined class="hover-primary" title="复制" />
        </button>
      </div>
      <div class="whitespace-pre p-2 w-full overflow-x-auto min-h-10 bg-[#282C34]"
        :class="preview.type !== 'text' ? 'text-white' : ''" ref="previewRef"
        :lang="preview.filename.substring(preview.filename.lastIndexOf('.') + 1)">
        {{ preview.content }}
      </div>
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