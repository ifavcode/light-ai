<script setup lang="ts">
import { getUserProfileApi, loginApi } from "@/api/user";
import { useUserStore } from "@/stores/userStore";
import { Constant, type Auth, type R } from "@/types";
import { message } from "ant-design-vue";
import { useForm } from "ant-design-vue/es/form";
import Cookies from "js-cookie";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);

const formState = reactive<Auth>({
  username: "",
  password: "",
});

const rulesRef = reactive({
  username: [
    {
      required: true,
      message: "请输入账号",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
    },
  ],
});

const { validate, validateInfos } = useForm(formState, rulesRef);

const onFinish = () => {
  loading.value = true;
  validate()
    .then(async () => {
      const { data: res } = await loginApi(formState)
      if (res.code != 200) {
        message.error(res.msg);
      } else {
        //登陆成功
        Cookies.set(Constant.JWT_HEADER_NAME, res.data, {
          expires: 7, //->天
        });
        const { data: profileData } = await getUserProfileApi()
        if (profileData.code === 200) {
          message.success("登陆成功");
          router.push("/");
          userStore.user = profileData.data
        } else {
          message.error('用户名或密码错误')
          Cookies.remove(Constant.JWT_HEADER_NAME)
        }
      }
    })
    .catch((err) => {
      console.log("error", err);
      message.error('用户名或者密码错误')
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
});
</script>

<template>
  <div class="flex items-center justify-center w-screen h-screen dark:bg-darkBg dark:text-white">
    <div class="w-[400px] shadow-lg h-[480px] rounded-lg relative">
      <div class="g-gradation-bg w-full h-full absolute top-0 left-0 z-[-1]">
      </div>
      <div class="bg-white w-full h-full relative z-10 rounded-md p-3">
        <div class="flex items-center justify-center w-full h-24 text-3xl font-mono" @click="router.push('/')">
          <span class=" cursor-pointer linear-text">轻AI</span>
        </div>
        <div class="w-full px-6 mt-4">
          <a-form :model="formState" name="basic" autocomplete="off">
            <a-form-item name="username" v-bind="validateInfos.username">
              <a-input v-model:value="formState.username" placeholder="账号" focused />
            </a-form-item>

            <a-form-item name="password" v-bind="validateInfos.password">
              <a-input-password v-model:value="formState.password" placeholder="密码" />
            </a-form-item>

            <a-form-item>
              <button html-type="submit"
                class="w-full bg-linear-65 from-purple-500 to-pink-500 text-white  hover:from-purple-400 hover:to-pink-400 cursor-pointer py-2 rounded-md"
                @click.prevent="onFinish" :loading="loading">登录</button>
            </a-form-item>
          </a-form>
          <div class="flex justify-center w-full text-sm">
            <div class="flex-1 text-left">
              <span class="transition-all cursor-pointer hover-primary" @click="$router.push('/')">一键注册</span>
            </div>
            <div class="flex-1 text-right">
              <!-- <span class="transition-all cursor-pointer hover-primary">忘记密码</span> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
