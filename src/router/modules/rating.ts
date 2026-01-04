import { $t } from "@/plugins/i18n";
import { rating } from "@/router/enums";

export default {
  path: "/rating",
  redirect: "/rating/index",
  meta: {
    icon: "ri/book-rating",
    title: $t("menus.pureRating"),
    rank: rating
  },
  children: [
    {
      path: "/rating/index",
      name: "rating",
      component: () => import("@/views/rating/index.vue"),
      meta: {
        title: $t("menus.pureRating"),
        showLink: false // ⭐ 关键：设置为 false，侧边栏就不会显示这一项
      }
    }
  ]
} satisfies RouteConfigsTable;
