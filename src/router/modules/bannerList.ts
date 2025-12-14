import { $t } from "@/plugins/i18n";
import { bannerList } from "@/router/enums";

export default {
  path: "/bannerList",
  redirect: "/bannerList/index",
  meta: {
    icon: "ri/file-info-line",
    title: $t("menus.pureBannerList"),
    rank: bannerList
  },
  children: [
    {
      path: "/bannerList/index",
      name: "bannerList",
      component: () => import("@/views/bannerList/index.vue"),
      meta: {
        title: $t("menus.pureBannerList")
      }
    }
  ]
} satisfies RouteConfigsTable;
