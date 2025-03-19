<script setup lang="ts">
import { autoRegisterApi, getUserProfileApi, loginApi, logoutApi } from '@/api/user';
import { useUserStore } from '@/stores/userStore';
import { Constant } from '@/types';
import { emitter } from '@/utils';
import { CopyOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import ClipboardJS from 'clipboard';
import Cookies from 'js-cookie';
import _ from 'lodash'

const router = useRouter()
const userStore = useUserStore()

const userPopup = ref(false)

function handleClickLogo() {
  router.push({
    name: 'home'
  })
}

async function handleLogout() {
  const { data: res } = await logoutApi()
  if (res.code === 200) {
    Cookies.remove(Constant.JWT_HEADER_NAME)
    userStore.user = null
    window.location.reload()
  }
}

const registerShow = ref(false)
const tmpInfo = ref<Record<string, any>>({})

const isRegister = ref(false)
const autoRegister = _.debounce(async () => {
  try {
    isRegister.value = true
    const { data: res } = await autoRegisterApi()
    if (res.code === 200) {
      registerShow.value = true
      tmpInfo.value = res.data
      autoLogin(tmpInfo.value.user.username, tmpInfo.value.raw)
    }
  } catch (error) {

  } finally {
    isRegister.value = false
  }
}, 500)

function copyText() {
  new ClipboardJS('.account-copy');
  window.$message.success('复制成功')
}

async function autoLogin(username: string, password: string) {
  try {
    const { data: res } = await loginApi({
      username,
      password
    });
    if (res.code === 200) {
      // 登陆成功
      window.$message.success('登录成功');
      Cookies.set(Constant.JWT_HEADER_NAME, res.data, {
        expires: 7 // 分钟 -> 天
      });
      const { data: profileData } = await getUserProfileApi();
      if (profileData.code === 200) {
        userStore.user = profileData.data;
      } else {
        Cookies.remove(Constant.JWT_HEADER_NAME);
        window.$message.error('获取用户信息失败，请重新登录');
      }
      emitter.emit('loginSuccess');
    }
  } catch (error) {
    console.error('登录过程中出现错误:', error);
    window.$message.error('登录过程中出现错误，请稍后重试');
  }
}

function handleProfile() {
  userPopup.value = false
  router.push({ name: 'profile' })
}

// 移动端
const mobileMenuShow = ref(false)

</script>

<template>
  <div class="w-full bg-white shadow h-12 fixed top-0 left-0 right-0 z-50 max-sm:px-4"
    style="view-transition-name: navbar;">
    <a-modal v-model:open="registerShow" title="注册成功">
      <p>请记住您的账户和密码：</p>
      <button class="text-gray-700 mt-2 cursor-pointer hover-primary account-copy" @click="copyText"
        :data-clipboard-text="`${tmpInfo?.user?.username}\n${tmpInfo?.raw}`">
        复制
        <CopyOutlined />
      </button>
      <p>账户：{{ tmpInfo?.user?.username }}</p>
      <p>密码：{{ tmpInfo?.raw }}</p>
      <template #footer>
        <button @click="registerShow = false"
          class="linear-bg px-3 py-1 rounded-md text-white cursor-pointer">知道了</button>
      </template>
    </a-modal>
    <div class="w-[1200px] m-auto flex items-center justify-between h-full max-sm:w-full">
      <div class="active:bg-gray-100 p-1 rounded-md" @click="mobileMenuShow = true">
        <span class="sm:hidden">
          <img class="size-6" src="@/assets/menu.svg" alt="">
        </span>
      </div>
      <div class="flex items-center ">
        <h1 class="font-semibold text-xl tracking-wider cursor-pointer flex gap-1 items-center"
          @click="handleClickLogo">
          <img src="@/assets/logo.svg" alt="" class="size-8 font-semibold">
          <span>轻AI</span>
        </h1>
        <div class="ml-16 text-gray-600 flex gap-8 max-sm:hidden">
          <RouterLink :to="{ name: 'oneToOne' }" class="cursor-pointer hover:text-black">一对一</RouterLink>
          <RouterLink :to="{ name: 'oneToMore' }" class="cursor-pointer hover:text-black">集成式对话</RouterLink>
          <RouterLink :to="{ name: 'onlineCodeRunner' }" class="cursor-pointer hover:text-black">在线代码编译器</RouterLink>
          <RouterLink :to="{ name: 'aiTools' }" class="cursor-pointer hover:text-black">AI工具</RouterLink>
        </div>
      </div>
      <div class="flex items-center">
        <div v-if="!userStore.user" class="cursor-pointer gap-4 flex items-center justify-center">
          <div v-if="!isRegister">
            <span class="text-sm mr-4 hover-primary" @click="router.push({ name: 'login' })">登录</span>
            <span class="text-sm text-white bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-md"
              @click="autoRegister">一键注册</span>
          </div>
          <LoadingOutlined v-else />
          <div class="size-7 bg-gray-300 rounded-full flex items-center justify-center">
            <UserOutlined />
          </div>
        </div>
        <div v-else class="flex items-center gap-2 cursor-pointer">
          <a-popover v-model:open="userPopup" trigger="click" placement="bottomRight">
            <template #content>
              <div class="w-full">
                <div
                  class="flex items-center w-full h-8 text-sm text-center cursor-pointer hover:text-primary hover:text-blue-500"
                  @click="handleProfile">
                  个人中心
                </div>
                <div
                  class="flex items-center w-full h-8 text-sm text-center cursor-pointer hover:text-primary hover:text-blue-500"
                  @click="handleLogout">
                  退出登录
                </div>
              </div>
            </template>
            <div class="flex items-center gap-2">
              <p class="text-gray-800 text-sm hover-primary max-sm:hidden">{{ userStore.user.nickname }}</p>
              <a-avatar :src="userStore.user.avatar" />
            </div>
          </a-popover>
        </div>
      </div>
    </div>

    <a-drawer :width="250" title="快捷跳转" placement="left" :open="mobileMenuShow" @close="mobileMenuShow = false">
      <template #extra>
      </template>
      <div class="text-gray-600 flex gap-4 flex-col" @click="mobileMenuShow = false">
        <RouterLink :to="{ name: 'oneToOne' }" class="cursor-pointer hover:text-black">一对一</RouterLink>
        <RouterLink :to="{ name: 'oneToMore' }" class="cursor-pointer hover:text-black">集成式对话</RouterLink>
        <RouterLink :to="{ name: 'onlineCodeRunner' }" class="cursor-pointer hover:text-black">在线代码编译器</RouterLink>
        <RouterLink :to="{ name: 'aiTools' }" class="cursor-pointer hover:text-black">AI工具</RouterLink>
      </div>
    </a-drawer>
  </div>
</template>