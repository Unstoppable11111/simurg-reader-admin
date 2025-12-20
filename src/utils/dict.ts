// src/hooks/usePublicDict.ts
import { computed, onMounted } from "vue";
import { useDictStoreHook } from "@/store/modules/dict"; // 引入你刚才展示的 Store

export function usePublicDict() {
  const dictStore = useDictStoreHook();

  /**
   * 页面挂载时尝试加载字典
   * Store 内部已有 isLoaded 判断，不会重复发起请求
   */
  onMounted(() => {
    dictStore.fetchAllDicts();
  });

  /** 获取完整的字典数据集 */
  const dictData = computed(() => dictStore.dictData);

  /**
   * 根据字典名和 key 获取对应的 label (value)
   * @param dictName 字典名称，如 'bookChaptersStatus'
   * @param key 键值，可以是 String 或 Number
   */
  const getDictLabel = (dictName: string, key: string | number) => {
    const list = dictStore.dictData[dictName];
    if (!list) return "未知字典";

    // 强制转为字符串进行比对，防止数字和字符串不匹配
    const item = list.find((i: any) => String(i.key) === String(key));
    return item ? item.value : "未知状态";
  };

  /**
   * 根据字典名获取整个列表（常用于 el-select 渲染）
   * @param dictName 字典名称
   */
  const getDictOptions = (dictName: string) => {
    return dictStore.dictData[dictName] || [];
  };

  return {
    dictData,
    getDictLabel,
    getDictOptions,
    refreshDict: () => dictStore.fetchAllDicts()
  };
}
