import { $t } from "@/plugins/i18n";
import { booklist } from "@/router/enums";

export default {
  path: "/booklist",
  redirect: "/booklist/index",
  meta: {
    icon: "ri/file-info-line",
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
    }
  ]
} satisfies RouteConfigsTable;
