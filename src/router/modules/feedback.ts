import { $t } from "@/plugins/i18n";
import { feedback } from "@/router/enums";

export default {
  path: "/feedback",
  redirect: "/feedback/index",
  meta: {
    icon: "ri/book-category",
    title: $t("menus.purefeedback"),
    rank: feedback
  },
  children: [
    {
      path: "/feedback/index",
      name: "feedback",
      component: () => import("@/views/feedback/index.vue"),
      meta: {
        title: $t("menus.purefeedback")
      }
    }
  ]
} satisfies RouteConfigsTable;
