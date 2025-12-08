import { $t } from "@/plugins/i18n";
import { sysconfig } from "@/router/enums";

export default {
  path: "/sysconfig",
  redirect: "/sysconfig/index",
  meta: {
    icon: "ri/file-info-line",
    title: $t("menus.pureSysConfigList"),
    rank: sysconfig,
  },
  children: [
    {
      path: "/sysconfig/index",
      name: "sysconfig",
      component: () => import("@/views/sysconfig/index.vue"),
      meta: {
        title: $t("menus.pureSysConfigList")
      }
    }
  ]
} satisfies RouteConfigsTable;
