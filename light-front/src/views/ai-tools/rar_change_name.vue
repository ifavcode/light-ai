<script setup lang="ts">
import { changeNameBatchApi, getAiToolApi } from '@/api/ai-tools'
import { Constant, type AiTool } from '@/types'
import { pathRewrite } from '@/utils/request'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue';
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';
import Cookies from 'js-cookie';

const toolDetail = ref<Partial<AiTool>>({})
const route = useRoute()
const { id } = route.query
const fileList = ref<UploadFile<any>[]>([])
const loading = ref(false)
const transformLoading = ref(false)
const rarUrl = ref('')
const renameParams = reactive({
  type: 'normal',
  customString: ''
})

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    loading.value = false;
    rarUrl.value = info.file.response.data
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

const beforeUpload = (file: any) => {
  const isRar = file.type === 'application/x-compressed';
  if (!isRar) {
    window.$message.error(`不支持的格式${file.type}`);
  }
  const isLt = file.size / 1024 / 1024 < 128;
  if (!isLt) {
    window.$message.error('压缩包最大为128MB!');
  }
  return isRar && isLt;
};

async function getAiTool() {
  if (!id) return
  const { data: res } = await getAiToolApi(id as string)
  if (res.code === 200) {
    toolDetail.value = res.data
  }
}

async function changeNameBatch() {
  try {
    transformLoading.value = true
    if (fileList.value[0].originFileObj) {
      await changeNameBatchApi(fileList.value[0].originFileObj, renameParams)
    } else {
      fileList.value = []
      window.$message.error('文件上传失败，请重试')
    }
  } catch (error) {
    window.$message.error('文件上传失败，请重试')
  } finally {
    transformLoading.value = false
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
      <div class="mt-4 w-full border p-4 border-gray-200 rounded-md shadow bg-white">
        <p class="mb-2 text-gray-800">上传RAR压缩包</p>
        <p class="text-sm">选择重命名方式：</p>
        <div>
          <a-radio-group v-model:value="renameParams.type">
            <a-radio value="normal">随机字符串</a-radio>
            <a-radio value="custom">固定名称</a-radio>
          </a-radio-group>
          <div class="my-2 max-w-72">
            <a-input v-show="renameParams.type === 'custom'" v-model:value="renameParams.customString"
            placeholder="输入自定义名称(为空默认随机字符串)" />
          </div>
        </div>
        <a-upload class="w-full h-full" v-model:file-list="fileList" list-type="picture-card" :max-count="1"
          :action="`${pathRewrite}/upload/ossFile`" :before-upload="beforeUpload" :headers="{
            [Constant.JWT_HEADER_NAME]: Cookies.get(Constant.JWT_HEADER_NAME) || ''
          }" @change="handleChange">
          <div v-if="fileList.length < 1">
            <LoadingOutlined v-if="loading"></LoadingOutlined>
            <div v-else class="flex items-center">
              <PlusOutlined></PlusOutlined>
              <p class="ml-1">RAR</p>
            </div>
          </div>
        </a-upload>
        <a-button :disabled="rarUrl === ''" @click="changeNameBatch" :loading="transformLoading" class="w-26 mt-2"
          type="primary">
          {{ transformLoading ? '下载中' : '转化' }}
        </a-button>
      </div>
    </div>
  </div>
</template>