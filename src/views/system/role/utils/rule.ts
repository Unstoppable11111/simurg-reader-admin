import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  name: [
    { required: true, message: "角色名称为必填项", trigger: "blur" },
    { min: 2, max: 20, message: "角色名称长度为2-20个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "角色标识为必填项", trigger: "blur" },
    { min: 2, max: 30, message: "角色标识长度为2-30个字符", trigger: "blur" },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      message: "角色标识只能包含字母、数字、下划线和横线，且必须以字母开头",
      trigger: "blur"
    }
  ]
});
