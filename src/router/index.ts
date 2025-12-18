import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useDictStoreHook } from "@/store/modules/dict"; // [新增] 引入字典Store
import {
  isUrl,
  openLink,
  cloneDeep,
  isAllEmpty,
  storageLocal
} from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter
} from "vue-router";
import {
  type DataInfo,
  userKey,
  removeToken,
  multipleTabsKey
} from "@/utils/auth";

/** 自动导入全部静态路由 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  { eager: true }
);

/** 原始静态路由 ,过滤hidden菜单*/
const routes: RouteRecordRaw[] = [];
Object.keys(modules).forEach(key => {
  const mod = modules[key].default;
  if (!mod) return;
  if (typeof mod === "object" && mod.path !== undefined) {
    if (!mod.meta?.hidden) routes.push(mod);
    return;
  }
  if (typeof mod === "object") {
    const routeList = Object.values(mod);
    for (const route of routeList) {
      if (route && typeof route === "object" && !route.meta?.hidden) {
        routes.push(route as RouteRecordRaw);
      }
    }
    return;
  }
});

/** 导出处理后的静态路由 */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) return savedPosition;
      if (from.meta.saveSrollTop) {
        const top: number =
          document.documentElement.scrollTop || document.body.scrollTop;
        resolve({ left: 0, top });
      }
    });
  }
});

const loadedPaths = new Set<string>();

export function resetLoadedPaths() {
  loadedPaths.clear();
}

export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes.concat(...(remainingRouter as any))) {
    router.addRoute(route);
  }
  router.options.routes = formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
}

/** 路由白名单 */
const whiteList = ["/login"];
const { VITE_HIDE_HOME } = import.meta.env;

// 注意：这里将回调改为 async，以便支持 await 字典加载
router.beforeEach(async (to: ToRouteType, _from, next) => {
  to.meta.loaded = loadedPaths.has(to.path);

  if (!to.meta.loaded) {
    NProgress.start();
  }

  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }

  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const externalLink = isUrl(to?.name as string);

  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      document.title = Title
        ? `${transformI18n(item.meta.title)} | ${Title}`
        : transformI18n(item.meta.title);
    });
  }

  /** 路由跳转控制函数 */
  function toCorrectRoute() {
    whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
  }

  // --- 登录状态判断 ---
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // [关键注入]：如果用户已登录，且字典尚未加载，则在此处进行阻塞式加载
    // 这样能确保无论用户是登录跳转还是F5刷新，页面渲染前字典数据一定在内存中
    const dictStore = useDictStoreHook();
    if (!dictStore.isLoaded) {
      await dictStore.fetchAllDicts();
    }

    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      next({ path: "/error/403" });
      return;
    }

    if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
      next({ path: "/error/404" });
      return;
    }

    if (_from?.name) {
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
      } else {
        toCorrectRoute();
      }
    } else {
      // 页面刷新逻辑：如果没有权限菜单信息，则初始化路由
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        initRouter().then((router: Router) => {
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            const route = findRouteByPath(
              path,
              router.options.routes[0].children
            );
            getTopMenu(true);
            if (route && route.meta?.title) {
              const target =
                isAllEmpty(route.parentId) && route.meta?.backstage
                  ? route.children[0]
                  : route;
              useMultiTagsStoreHook().handleTags("push", {
                path: target.path,
                name: target.name,
                meta: target.meta
              });
            }
          }
          if (isAllEmpty(to.name)) router.push(to.fullPath);
        });
      }
      toCorrectRoute();
    }
  } else {
    // --- 未登录状态判断 ---
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        removeToken();
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

export default router;
