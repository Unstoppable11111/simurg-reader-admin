import { $t } from "@/plugins/i18n";
import { bookcategory } from "@/router/enums";

export default {
  path: "/bookcategory",
  redirect: "/bookcategory/index",
  meta: {
    icon: "ri/book-category",
    title: $t("menus.pureBookCategoryList"),
    rank: bookcategory
  },
  children: [
    {
      path: "/bookcategory/index",
      name: "bookcategory",
      component: () => import("@/views/bookcategory/index.vue"),
      meta: {
        title: $t("menus.pureBookCategoryList")
      }
    }
  ]
} satisfies RouteConfigsTable;
