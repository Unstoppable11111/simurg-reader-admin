# Simurg Reader Admin - 项目级开发规范与自动化规则

> 本规则文件为当前项目（`admin`）专属规则，与全局 Agent 协作规则协同生效。

---

## 一、需求完成后的自动提交流程规范

在当前项目中，每次完成用户提出的开发、修复、优化或配置需求后，**必须自动将代码进行规范化 Git 提交并推送到远端仓库**，无需用户每次额外催促。

### 1. 提交与推送前提检查
在执行提交前，必须确保满足以下条件：
1. **需求完整落地**：修改经过代码审查，确保无语法报错、无类型阻断、不破坏既有业务逻辑。
2. **清理临时产物**：严格遵守临时文件清理规范，删除开发/测试过程中产生的临时调试脚本与垃圾文件。
3. **安全与敏感文件防泄露**：检查 `git status`，绝对禁止将本地私密配置（如 `.env.production`、含密码/Token的私有文件）误加入版本控制。

---

### 2. 标准 Git 提交流程与规范

#### 步骤 1：审查状态与暂存
```bash
git status
git add <涉及的修改文件>
```
*原则：仅暂存与本次需求直接相关的改动，避免混入无关文件。*

#### 步骤 2：生成规范 Commit Message
严格遵守项目的 Angular / Commitlint 规范，格式遵循：
- `feat: <新增某某功能说明>`
- `fix: <修复某某问题说明>`
- `chore: <构建/工具/配置调整说明>`
- `refactor: <代码重构说明>`
- `docs: <文档更新说明>`
- `ci: <流水线或部署脚本变动说明>`

**严禁使用**：`update`, `modify`, `change`, `test`, `temp` 等模糊无意义词汇。

#### 步骤 3：提交与推送到远端
```bash
git commit -m "<遵循规范的提交信息>"
git push origin <当前工作分支>
```
*说明：当前项目远端（`origin`）配置包含 Gitee 与 GitHub，推送将同步推至远端分支（如 `dev_001`）。*

---

### 3. 流水线部署提醒与结果汇报
由于项目根目录下配置了自动化部署流水线（`.workflow/build-and-deploy.yml`），分支（`dev_001` / `master`）代码在成功推送到远端后，**会自动触发云端流水线打包构建并同步部署至宝塔服务器**。

在完成任务输出报告时，必须在文末说明：
1. **Commit Hash 与 Commit Message**。
2. **推送的目标分支与推送结果**。
3. **提示用户云端流水线已自动触发构建与部署**。

---

## 二、项目通用研发与代码约束规范索引

Simurg Reader 项目集的完整统一规范已收录于上级公共文档库中：
- **完整规范文档**：`E:\simurg-reader\docs\simurg_reader_dev_specification.md`

### 核心约束摘要（日常编码严格执行）：
1. **TypeScript 强类型规范**：
   - 类型导入必须使用内联类型语法：`import { type PropType, ref } from "vue"` 或 `import type { ... } from "..."`。
   - 未使用的入参或变量必须以 `_` 开头命名（如 `_item`, `_index`）。
   - 严禁滥用 `any`，复杂结构需定义清晰的 `interface` 或 `type`。
2. **Vue 3 组件开发规范**：
   - 统一采用 `<script setup lang="ts">` 组合式语法。
   - 模板标签强制自闭合（如 `<el-input />`, `<img />`）。
   - Props 禁止直接解构避免丢失响应性。
3. **样式与布局防御**：
   - 优先使用 TailwindCSS 原子类，组件样式加 `scoped`。
   - 样式穿透统一使用 `:deep(...)`，严禁使用 `/deep/` 或 `>>>`。
   - 弹窗、表单及表格容器必须做好高度约束与滚动控制（`overflow-y: auto`），避免出现双向横向滚动条、布局塌陷及字体重叠。
4. **统一 Commitlint 枚举**：
   - 支持枚举：`feat` / `fix` / `perf` / `style` / `docs` / `refactor` / `types` / `build` / `ci` / `chore` / `test` / `revert`。
   - 严禁使用模糊词汇：`update`, `modify`, `change`, `test`, `temp`, `fix bug`。

