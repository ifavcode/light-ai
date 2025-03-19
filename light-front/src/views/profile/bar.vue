<script setup lang="ts">
import { StarFilled } from '@ant-design/icons-vue';


const route = useRoute()
const mobileProfileBarShow = ref(false)

watch(route, () => {
  mobileProfileBarShow.value = false
})


</script>

<template>
  <div class="mt-16">
    <div class="sm:hidden px-4 mb-1">
      <img class="size-8 active:bg-blue-100 p-1 rounded-md" @click="mobileProfileBarShow = true"
        src="@/assets/menu2.svg" alt="">
    </div>
    <div class="flex w-[1200px] m-auto max-sm:w-full">
      <a-affix :offset-top="64" class="max-sm:hidden">
        <div class="w-64 bg-white rounded-lg shadow-md p-4 mr-6 h-fit text-base">
          <h3 class="text-lg font-semibold linear-text mb-4">个人中心</h3>
          <ul class="space-y-2">
            <li class="cursor-pointer">
              <RouterLink to="/profile/index">
                <button :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  route.name === 'profile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
                ]">
                  <Transition name="leftEnter">
                    <StarFilled v-show="route.name === 'profile'" />
                  </Transition>
                  <span>个人资料</span>
                </button>
              </RouterLink>
            </li>
            <li class="cursor-pointer">
              <RouterLink to="/profile/account_setting">
                <button :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  route.name === 'accountSetting' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
                ]">
                  <Transition name="leftEnter">
                    <StarFilled v-show="route.name === 'accountSetting'" />
                  </Transition>
                  <span>账号设置</span>
                </button>
              </RouterLink>
            </li>
            <li class="cursor-pointer">
              <RouterLink to="/profile/pic_to_video">
                <button :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  route.name === 'picToVideoProfile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
                ]">
                  <Transition name="leftEnter">
                    <StarFilled v-show="route.name === 'picToVideoProfile'" />
                  </Transition>
                  <span>图生视频专区</span>
                </button>
              </RouterLink>
            </li>
            <li class="cursor-pointer">
              <RouterLink to="/profile/virtual_company_profile">
                <button :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  route.name === 'virtualCompanyProfile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
                ]">
                  <Transition name="leftEnter">
                    <StarFilled v-show="route.name === 'virtualCompanyProfile'" />
                  </Transition>
                  <span>我的需求</span>
                </button>
              </RouterLink>
            </li>
            <li class="cursor-pointer">
              <RouterLink to="/profile/my_file">
                <button :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  route.name === 'myFile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
                ]">
                  <Transition name="leftEnter">
                    <StarFilled v-show="route.name === 'myFile'" />
                  </Transition>
                  <span>我的文件</span>
                </button>
              </RouterLink>
            </li>
          </ul>
        </div>
      </a-affix>

      <div class="flex-1 pb-6 shrink-0 overflow-x-auto max-sm:px-4">
        <RouterView v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </div>

    <a-drawer :width="250" title="个人中心" placement="left" :open="mobileProfileBarShow"
      @close="mobileProfileBarShow = false">
      <template #extra>
      </template>
      <div>
        <ul class="space-y-2">
          <li class="cursor-pointer">
            <RouterLink to="/profile/index">
              <button :class="[
                'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                route.name === 'profile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
              ]">
                <Transition name="leftEnter">
                  <StarFilled v-show="route.name === 'profile'" />
                </Transition>
                <span>个人资料</span>
              </button>
            </RouterLink>
          </li>
          <li class="cursor-pointer">
            <RouterLink to="/profile/account_setting">
              <button :class="[
                'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                route.name === 'accountSetting' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
              ]">
                <Transition name="leftEnter">
                  <StarFilled v-show="route.name === 'accountSetting'" />
                </Transition>
                <span>账号设置</span>
              </button>
            </RouterLink>
          </li>
          <li class="cursor-pointer">
            <RouterLink to="/profile/pic_to_video">
              <button :class="[
                'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                route.name === 'picToVideoProfile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
              ]">
                <Transition name="leftEnter">
                  <StarFilled v-show="route.name === 'picToVideoProfile'" />
                </Transition>
                <span>图生视频专区</span>
              </button>
            </RouterLink>
          </li>
          <li class="cursor-pointer">
            <RouterLink to="/profile/virtual_company_profile">
              <button :class="[
                'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                route.name === 'virtualCompanyProfile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
              ]">
                <Transition name="leftEnter">
                  <StarFilled v-show="route.name === 'virtualCompanyProfile'" />
                </Transition>
                <span>我的需求</span>
              </button>
            </RouterLink>
          </li>
          <li class="cursor-pointer">
            <RouterLink to="/profile/my_file">
              <button :class="[
                'w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                route.name === 'myFile' ? 'bg-blue-50 linear-bg text-white' : 'text-gray-600 hover:bg-gray-50'
              ]">
                <Transition name="leftEnter">
                  <StarFilled v-show="route.name === 'myFile'" />
                </Transition>
                <span>我的文件</span>
              </button>
            </RouterLink>
          </li>
        </ul>
      </div>
    </a-drawer>
  </div>
</template>

<style>
@keyframes leftEnter {
  0% {
    transform: translateX(-10px);
  }

  100% {
    transform: translateX(0px);
  }
}

.leftEnter-enter-active {
  animation: leftEnter 0.5s forwards;
}

.leftEnter-leave-active {
  animation: leftEnter 0s reverse forwards;
}
</style>