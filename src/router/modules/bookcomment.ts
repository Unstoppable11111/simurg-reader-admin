import { $t } from "@/plugins/i18n";
import { bookcomment } from "@/router/enums";

export default {
  path: "/bookcomment",
  redirect: "/bookcomment/index",
  meta: {
    icon: "ri/chat-1-line",
    title: $t("menus.pureBookcomment"),
    rank: bookcomment
  },
  children: [
    {
      path: "/bookcomment/index",
      name: "bookcomment",
      component: () => import("@/views/bookcomment/index.vue"),

      meta: {
        title: $t("menus.purebookcomment"),
        showLink: false, // ⭐ 关键：设置为 false，侧边栏就不会显示这一项
        activeMenu: "/booklist" // ⭐ 关键：进入此页面时，左侧“书籍列表”菜单保持高亮
      }
    }
  ]
} satisfies RouteConfigsTable;
