import { $t } from "@/plugins/i18n";
import { chapter } from "@/router/enums";

export default {
  path: "/chapter",
  redirect: "/chapter/index",
  meta: {
    icon: "ri/file-info-line",
    title: $t("menus.pureChapter"),
    rank: chapter
  },
  children: [
    {
      path: "/chapter/index",
      name: "chapter",
      component: () => import("@/views/chapter/index.vue"),
      meta: {
        title: $t("menus.pureChapter"),
        showLink: false, // ⭐ 关键：设置为 false，侧边栏就不会显示这一项
        activeMenu: "/book/book-admin" // ⭐ 关键：进入此页面时，左侧“书籍列表”菜单保持高亮
      }
    }
  ]
} satisfies RouteConfigsTable;
