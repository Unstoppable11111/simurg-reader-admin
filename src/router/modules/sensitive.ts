import { $t } from "@/plugins/i18n";
import { sensitive } from "@/router/enums";

export default {
  path: "/sensitive",
  redirect: "/sensitive/index",
  meta: {
    icon: "ri/sensitive",
    title: $t("menus.pureSensitive"),
    rank: sensitive
  },
  children: [
    {
      path: "/sensitive/index",
      name: "sensitive",
      component: () => import("@/views/sensitive/index.vue"),
      meta: {
        title: $t("menus.pureSensitive")
      }
    }
  ]
} satisfies RouteConfigsTable;
