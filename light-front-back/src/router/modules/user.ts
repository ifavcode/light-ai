const Layout = () => import("@/layout/index.vue");

export default {
  path: "/user",
  name: "User",
  component: Layout,
  redirect: "/user/list",
  meta: {
    icon: "ep:avatar",
    title: "用户管理",
    rank: 1
  },
  children: [
    {
      path: "/user/list",
      name: "UserList",
      component: () => import("@/views/user/UserList.vue"),
      meta: {
        title: "用户列表",
        showLink: true,
        icon: "ri:account-pin-circle-line"
      }
    },
    {
      path: "/user/record",
      name: "UserRecord",
      component: () => import("@/views/user/UserRecord.vue"),
      meta: {
        title: "浏览列表",
        showLink: true,
        icon: "ri:history-fill"
      }
    }
  ]
} satisfies RouteConfigsTable;
