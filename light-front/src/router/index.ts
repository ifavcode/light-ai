import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import Bar from '../views/profile/bar.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/one_to_one",
      name: "oneToOne",
      component: () => import("../views/one-to-one/index.vue"),
    },
    {
      path: "/one_to_more",
      name: "oneToMore",
      component: () => import("../views/one-to-more/index.vue"),
    },
    {
      path: "/online_code_runner",
      name: "onlineCodeRunner",
      component: () => import("../views/online-code-runner/index.vue"),
    },
    {
      path: "/profile",
      redirect: '/profile/index',
      component: Bar,
      children: [
        {
          path: 'index',
          name: "profile",
          component: () => import("../views/profile/index.vue"),
        },
        {
          name: 'picToVideoProfile',
          path: 'pic_to_video',
          component: () => import("../views/profile/pic_to_video_profile.vue"),
        },
        {
          name: "accountSetting",
          path: "account_setting",
          component: () => import("../views/profile/account_setting.vue"),
        },
        {
          name: "virtualCompanyProfile",
          path: "virtual_company_profile",
          component: () => import("../views/profile/virtual_company_profile.vue"),
        },
        {
          name: "myFile",
          path: "my_file",
          component: () => import("../views/profile/my_file.vue"),
        },
      ]
    },
    {
      path: "/ai_tools",
      redirect: '/ai_tools/index',
      children: [
        {
          name: 'aiTools',
          component: () => import("../views/ai-tools/index.vue"),
          path: 'index'
        },
        {
          name: "picToVideo",
          path: "pic_to_video",
          component: () => import("../views/ai-tools/pic_to_video.vue"),
        },
        {
          name: "virtualCompany",
          path: "virtual_company",
          component: () => import("../views/ai-tools/virtual_company.vue"),
        },
        {
          name: "rarChangeName",
          path: "rar_change_name",
          component: () => import("../views/ai-tools/rar_change_name.vue"),
        },
        {
          name: "chouJiang",
          path: "chou_jiang",
          component: () => import("../views/ai-tools/chou_jiang.vue"),
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/login/index.vue"),
    },
  ],
});

export default router;
