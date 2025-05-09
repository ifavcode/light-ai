<script setup lang="ts">
import { createPicToVideoApi, getAiToolApi, getPicToVideoAllowApi } from '@/api/ai-tools';
import { Constant, type AiTool, type PicToVideoDTO } from '@/types';
import { pathRewrite } from '@/utils/request';
import { LeftOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue';
import type { UploadChangeParam, UploadProps } from 'ant-design-vue';
import dayjs from 'dayjs';
import Cookies from 'js-cookie'

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

// 上传
const fileList = ref([])
const loading = ref(false)

const handleChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    // Get this url from response in real world.
    picToVideoDTO.imgUrl = info.file.response.data
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

const beforeUpload = (file: any) => {
  const isJpgOrPngOrMore = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/bmp' || file.type === 'image/gif';
  if (!isJpgOrPngOrMore) {
    window.$message.error(`不支持的格式${file.type}`);
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    window.$message.error('图片最大为10MB!');
  }
  return isJpgOrPngOrMore && isLt10M;
};

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
const isAllow = ref(true)
const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = file.response.data
  }
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
  previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
};
const handleCancel = () => {
  previewVisible.value = false;
  previewTitle.value = '';
};

const picToVideoDTO = reactive<PicToVideoDTO>({
  prompt: '',
  imgUrl: '',
  duration: 5,
  promptExtend: true
})
async function createPicToVideo() {
  if (picToVideoDTO.imgUrl === '') {
    window.$message.warning('请上传图片')
    return
  }
  if (loading.value) {
    window.$message.warning('请等待图片上传完成')
    return
  }
  if (picToVideoDTO.prompt === '') {
    window.$message.warning('请输入提示词')
    return
  }
  if (!picToVideoDTO.duration) {
    window.$message.warning('请输入视频时长')
    return
  }
  const { data: res } = await createPicToVideoApi(picToVideoDTO)
  if (res.code === 200) {
    window.$message.success(res.msg)
    getPicToVideoAllow()
  } else {
    window.$message.error(res.msg || '错误，请重试')
  }
}

async function getPicToVideoAllow() {
  const { data: res } = await getPicToVideoAllowApi()
  if (res.code === 200) {
    isAllow.value = res.data
  }
}

onMounted(() => {
  getAiTool()
  getPicToVideoAllow()
})

</script>

<template>
  <div class="w-full mt-16">
    <div class="w-[1200px] m-auto mt-8 max-sm:w-full">
      <Common_tool_header :toolDetail="toolDetail" />
      <div class="mt-4 w-full border p-4 border-gray-200 rounded-md shadow bg-white">
        <p v-show="!isAllow" class="text-red-500 font-semibold mb-2">
          <span>上一个转化任务进行中或等待确认</span>
          <span class="px-2 text-blue-500 underline cursor-pointer hover:text-blue-400"
            @click="$router.push({ name: 'picToVideoProfile' })">GO</span>
        </p>
        <p class="mb-2 text-gray-800">①、上传采样图</p>
        <a-upload :disabled="!isAllow" class="w-full h-full" v-model:file-list="fileList" list-type="picture-card"
          :max-count="1" :action="`${pathRewrite}/upload/oss`" :before-upload="beforeUpload" :headers="{
            [Constant.JWT_HEADER_NAME]: Cookies.get(Constant.JWT_HEADER_NAME) || ''
          }" @change="handleChange" @preview="handlePreview">
          <div v-if="fileList.length < 1">
            <LoadingOutlined v-if="loading"></LoadingOutlined>
            <div v-else class="flex items-center">
              <PlusOutlined></PlusOutlined>
              <span>采样图</span>
            </div>
          </div>
        </a-upload>
        <p class="my-2 text-gray-800">②、输入视频提示词</p>
        <textarea class="focus:outline-none border-2 border-gray-400 
              bg-white
          focus:border-blue-400 rounded-md placeholder:text-sm text-sm placeholder:text-gray-400
           focus:placeholder:text-blue-400 p-2 resize-none w-full h-28
           transition duration-100" placeholder="视频提示词" v-model="picToVideoDTO.prompt" :disabled="!isAllow" />
        <p class="my-2 text-gray-800">③、输入视频时长(3-5秒)</p>
        <a-input-number id="inputNumber" v-model:value="picToVideoDTO.duration" :min="3" :max="5"
          :disabled="!isAllow" />
        <div class="my-2">
          <a-checkbox v-model:checked="picToVideoDTO.promptExtend" :disabled="!isAllow">提示词智能改写（对提示词提升效果明显）</a-checkbox>
        </div>
        <button
          class="cursor-pointer flex items-center gap-2 not-disabled:bg-linear-to-r from-cyan-500 hover:from-cyan-400
        to-blue-500 hover:to-blue-400 text-white w-fit py-2 px-6 rounded-xl transition duration-100 mt-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          @click="createPicToVideo" :disabled="!isAllow">
          <i class="iconfont" style="font-size: 20px;">&#xe70f;</i>
          <span>生成</span>
        </button>
      </div>
    </div>

    <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<style></style>
