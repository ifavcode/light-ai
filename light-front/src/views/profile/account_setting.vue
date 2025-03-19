<script setup lang="ts">
import { changePwdApi, judgeChangePwdApi } from '@/api/user';
import type { Rule } from 'ant-design-vue/es/form';

const isFirstChangePwd = ref(false)
const formState = reactive({
  password: '',
  newPassword: '',
  confirmNewPassword: ''
})
async function judgeChangePwd() {
  const { data: res } = await judgeChangePwdApi()
  if (res.code === 200) {
    isFirstChangePwd.value = res.data
  }
}

const onFinish = (values: any) => {
  changePwd()
};

const validatePass = async (_rule: Rule, value: string) => {
  if (value === '') {
    return Promise.reject('请再次输入新密码');
  } else if (value !== formState.newPassword) {
    return Promise.reject("两次密码不匹配!");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'change' }
  ],
  confirmNewPassword: [
    { required: true, validator: validatePass, trigger: 'change' }
  ]
}

async function changePwd() {
  const { data: res } = await changePwdApi({
    password: formState.password,
    newPassword: formState.newPassword,
  })
  if (res.code === 200) {
    window.$message.success(res.msg)
    formState.password = ''
    formState.newPassword = ''
    formState.confirmNewPassword = ''
    judgeChangePwd()
  }
}

onMounted(() => {
  judgeChangePwd()
})

</script>

<template>
  <div class="bg-white p-4 rounded-md shadow">
    <div>
      <h1 v-if="isFirstChangePwd">首次登陆，在此重置你的密码</h1>
      <h1 v-else="isFirstChangePwd">在此重置你的密码</h1>
      <div class="mt-4">
        <a-form :model="formState" autocomplete="off" @finish="onFinish" :rules="rules">
          <a-form-item v-if="!isFirstChangePwd" label="旧密码" name="password" class="w-[50%] max-w-[500px]">
            <a-input v-model:value="formState.password" placeholder="旧密码" />
          </a-form-item>
          <a-form-item label="新密码" name="newPassword" class="w-[50%] max-w-[500px]">
            <a-input v-model:value="formState.newPassword" placeholder="新密码" />
          </a-form-item>
          <a-form-item label="确认新密码" name="confirmNewPassword" class="w-[50%] max-w-[500px]">
            <a-input-password v-model:value="formState.confirmNewPassword" placeholder="确认新密码" />
          </a-form-item>
          <a-form-item class="w-20">
            <button class="cursor-pointer flex items-center gap-2 bg-linear-to-r from-purple-500  hover:from-purple-400
          to-pink-500 hover:to-pink-400 text-white w-full p-2 rounded-md transition duration-100 justify-center"
              html-type="submit">修改</button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>