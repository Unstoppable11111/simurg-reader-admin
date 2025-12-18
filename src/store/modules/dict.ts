import { defineStore } from "pinia";
import { getDictionaryList } from "@/api/system";
import { store } from "../utils"; // [关键] 必须从 utils 引入 store 实例

export const useDictStore = defineStore("pure-dict", {
  state: () => ({
    dictData: {} as any,
    isLoaded: false
  }),
  actions: {
    /** 获取并缓存所有字典 */
    async fetchAllDicts() {
      if (this.isLoaded) return;
      try {
        const { data } = await getDictionaryList();
        this.dictData = data;
        this.isLoaded = true;
      } catch (error) {
        console.error("字典加载失败:", error);
      }
    },
    /** 清空字典状态（通常用于退出登录） */
    clearDict() {
      this.dictData = {};
      this.isLoaded = false;
    }
  }
});

/** * 在非组件环境（如路由拦截器）中使用时，必须显式传入 store 实例
 * 这样可以避免 "options is undefined" 的 Pinia 初始化报错
 */
export function useDictStoreHook() {
  return useDictStore(store);
}
