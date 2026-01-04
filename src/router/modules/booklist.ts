import { $t } from "@/plugins/i18n";
import { booklist } from "@/router/enums";

export default {
  path: "/booklist",
  redirect: "/booklist/index",
  meta: {
    icon: "ri/book-info",
    title: $t("menus.pureBooklist"),
    rank: booklist
  },
  children: [
    {
      path: "/booklist/index",
      name: "booklist",
      component: () => import("@/views/booklist/index.vue"),
      meta: {
        title: $t("menus.pureBooklist")
      }
    },
    {
      path: "/booklist/chapter",
      name: "chapter",
      component: () => import("@/views/chapter/index.vue"),
      meta: {
        title: $t("menus.pureChapter"),
        showLink: false // 侧边栏隐藏
      }
    },
    {
      path: "/booklist/bookcomment",
      name: "bookcomment",
      component: () => import("@/views/bookcomment/index.vue"),
      meta: {
        title: $t("menus.purebookcomment"),
        showLink: false // 侧边栏隐藏
      }
    }
  ]
} satisfies RouteConfigsTable;
