<script setup lang="ts">
import { MessageRole, type CreateQianwenDto, type replyQianwenDTO } from '@/types';
import { getAssetsImg, modelImageMap, marked, enhanceCodeBlock } from '@/utils';
import { CopyOutlined } from '@ant-design/icons-vue';
import ClipboardJS from 'clipboard';
import 'katex/dist/katex.min.css'
import 'katex/dist/katex.min.js'

const props = defineProps<{
  finishFlag: boolean,
  imgName: string,
  createQianwenDto: CreateQianwenDto
}>()

const fixed = ref(false)

function initCopyJs() {
  new ClipboardJS('.copy-button')
}

const toolsBarShowMap = ref<Record<string, boolean>>({})
function openToolsWindow(index: number) {
  toolsBarShowMap.value[index] = true
}
function hiddenToolsWindow(index: number) {
  toolsBarShowMap.value[index] = false
}

function copyText() {
  window.$message.success('复制成功')
}

onMounted(() => {
  initCopyJs()
})

</script>

<template>
  <div class="flex-1 w-0 border-r border-gray-400 border-dashed">
    <a-affix :offset-top="48" @change="f => fixed = f" class=" relative z-[60]">
      <div class="w-full flex justify-center"
        :class="fixed ? ' bg-white py-2 shadow border-t border-gray-500 border-dashed' : ''">
        <img class="size-10" :src="imgName" alt="">
      </div>
    </a-affix>
    <div class="w-full relative h-fit px-2">
      <div class="max-h-[calc(100vh - 11rem)] w-full"
        :class="props.createQianwenDto.message.length != 0 ? 'pb-40' : ''">
        <div class="flex flex-col gap-4 w-full">
          <div v-for="(dialog, index) in props.createQianwenDto.message">
            <div v-if="dialog.role === MessageRole.ASSISTANT" class="flex gap-2 items-start relative"
              @mouseleave="hiddenToolsWindow(index)">
              <!-- <img class="size-8" :src="modelImageMap[props.createQianwenDto.aiModelType]" alt=""> -->
              <Transition name="apperBottomIn">
                <div class="absolute top-[-30px] left-[0px]" v-show="toolsBarShowMap[index]">
                  <div
                    class="bg-white rounded-md text-gray-800 shadow translate-y-[-0.5rem] px-3 py-2 flex items-center">
                    <button class="flex items-center cursor-pointer copy-button" :data-clipboard-text="dialog.content"
                      @click="copyText">
                      <CopyOutlined class="hover-primary" title="复制" />
                    </button>
                  </div>
                </div>
              </Transition>
              <div @mouseenter="openToolsWindow(index)" class="h-fit bg-white px-3 py-1 rounded-md shadow text-gray-800"
                style="max-width: calc(100%);">
                <div class="w-full" v-enhanceCode
                  v-html="enhanceCodeBlock(marked.parse(dialog.content as string) as string)"></div>
              </div>
            </div>
            <div v-if="dialog.role === MessageRole.USER" class="flex gap-2 items-start justify-end relative"
              @mouseleave="hiddenToolsWindow(index)">
              <Transition name="apperBottomIn">
                <div class="absolute top-[-30px] right-[0px] w-fit" v-show="toolsBarShowMap[index]">
                  <div
                    class="bg-white rounded-md text-gray-800 shadow translate-y-[-0.5rem] px-3 py-2 flex items-center">
                    <button class="flex items-center cursor-pointer copy-button" :data-clipboard-text="dialog.content"
                      @click="copyText">
                      <CopyOutlined class="hover-primary" title="复制" />
                    </button>
                  </div>
                </div>
              </Transition>
              <div @mouseenter="openToolsWindow(index)"
                class="max-w-[calc(100% - 3rem)] h-fit bg-white px-3 py-1 rounded-md shadow text-gray-800"
                style="max-width: calc(100%);">
                {{ dialog.content }}
              </div>
              <!-- <img class="size-8" src="@/assets/user/new-user.png" alt=""> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>