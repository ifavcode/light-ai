import './assets/main.css'
import './assets/md.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { enhanceCode } from './directives/enhance-code'
import '@/assets/icon/iconfont.css'
import '@/assets/icon/iconfont.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('enhanceCode', enhanceCode)
console.log(import.meta.env.MODE);

app.mount('#app')
