import { $t } from "@/plugins/i18n";
import { chapter } from "@/router/enums";

export default {
  path: "/chapter",
  redirect: "/chapter/index",
  meta: {
    icon: "ri/book-category",
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
        showLink: false // ⭐ 关键：设置为 false，侧边栏就不会显示这一项
      }
    }
  ]
} satisfies RouteConfigsTable;
