<script setup lang="ts">
import { RouterView } from 'vue-router'
import { message } from 'ant-design-vue';
import type { MessageApi } from 'ant-design-vue/es/message';
import { getUserProfileApi } from './api/user';
import { useUserStore } from './stores/userStore';
import Cookies from 'js-cookie';
import { Constant } from './types';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

declare global {  //设置全局属性
  interface Window {  //window对象属性
    $message: MessageApi   //加入对象
  }
}

const route = useRoute()
const userStore = useUserStore()

async function getUserProfile() {
  const { data: profileData } = await getUserProfileApi()
  if (profileData.code === 200) {
    userStore.user = profileData.data

  } else {
    Cookies.remove(Constant.JWT_HEADER_NAME)
  }
}

window.$message = message

onMounted(() => {
  nextTick(() => {
    getUserProfile()
  })
})
</script>

<template>
  <div class="relative">
    <a-config-provider :locale="zhCN">
      <div :class="route.name != 'login' ? 'mt-12' : ''">
        <RouterView v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
      <div class="g-block-bg fixed top-0 left-0 w-screen h-screen z-[-1]"></div>
    </a-config-provider>
    <navbar v-if="route.name != 'login'" />
  </div>
</template>

<style>
.hover-primary:hover {
  color: var(--primary-color);
}
</style>
