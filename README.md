# webniu 前端架构使用文档（v1.3 微前端版）

> 本文档面向开发者与 AI 助手。读完即可了解：哪些东西**可以直接用**、哪些东西**绝对不能改**、
> 两种开发模式（基座开发 / 微端子应用开发）分别怎么干活。
> 修改任何架构层代码前，先读「第 5 章 红线清单」。

---

## 1. 总体架构

```
┌─────────────────────────────────────────────────────────┐
│                    基座（vue/src）                        │
│   顶部导航 / 侧边菜单 / 登录鉴权 / 全局消息 / 布局容器      │
│   规则引擎 RuleService：登录后下发菜单路由 + 权限按钮       │
│                                                           │
│   ┌─────────────────────────────────────────────┐        │
│   │        共享组件包 @admin（vue/shared/admin）  │        │
│   │  基座与所有子应用引用同一份源码（构建期打包）    │        │
│   └─────────────────────────────────────────────┘        │
│                                                           │
│   运行时通过模块联邦（Module Federation）动态装载子应用：    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│   │ wechat 微端     │  │ wnapi 微端    │  │ 未来新微端... │    │
│   │ (plugin/wechat)│  │(plugin/wnapi)│  │              │    │
│   └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

三个关键事实（理解后面一切规则的前提）：

1. **基座只负责壳能力**（导航、菜单、登录、鉴权、消息、布局），不含业务逻辑。
2. **子应用独立开发、独立构建**，由基座在运行时通过 remoteEntry.js 动态加载，基座不需要重新构建即可接入子应用。
3. **共享包没有 MF singleton**，会被基座和每个子应用**各自打包一份**——因此共享包里所有跨 bundle 的 provide/inject 必须用字符串 key，EP 组件副本之间存在「注入不通」问题（已有统一方案，见 5.3）。

---

## 2. 目录职责表（能改 / 不能改）

| 目录 | 职责 | 改动政策 |
|---|---|---|
| `vue/src/` | 基座：布局、登录、菜单、全局 main.ts、业务页面 `views/admin` | 可改；业务页面必须引用 `@admin/*`，禁止引用 `components/` 私有组件 |
| `vue/src/components/layouts/` `business/` | 基座私有组件（布局框架、登录页、水印、富文本等） | 仅基座可用，**不进共享包**；新增私有组件放这里 |
| `vue/shared/admin/src/` | 共享组件包（别名 `@admin`），基座与子应用共用 | 可新增；**修改必须遵守 5.1 编写规则** |
| `vue/plugin/<name>/` | 微端子应用（devs 是标准模板） | 可改；新增子应用按第 6 章 checklist |
| `vue/plugin/<name>/vite.config.ts` | 子应用构建配置（目录名自动推导应用名） | 只允许改 `DEV_PORT`；其余改前必须读 5.2 |
| `vue/scripts/copy-dist.mjs` | 子应用产物拷贝脚本 | 不要改 |
| `plugin/<name>/`（项目根，webman 后端） | 子应用后端 + 静态托管 `public/admin/dist` | 前端构建产物自动落地，别手动搬文件 |
| `vue/.env*` | 基座构建环境变量（`VITE_OUT_DIR` 配置输出目录） | `webniu` 主项目不要建 `.env`（webman 侧已验证无效且有害） |

**共享包子目录一览**（`vue/shared/admin/src/`）：

| 子目录 | 内容 |
|---|---|
| `core/` | 核心 TS 能力：`request.ts`（get/post/del）、`table/useWnTable.ts`、`table/useTableHeight.ts`、`auth/useAuth.ts`、`auth/useUserStore.ts`、`auth/useCurrentUser.ts`、`auth/v-auth.ts`、`utils/controller.ts`、`mfe/loadRemote.ts`、`sys/mittBus.ts`、`context.ts`（全部注入 key）、`config.ts`、`types.ts` |
| `tables/` | `art-table`（ArtTable）、`art-table-header`（ArtTableHeader） |
| `forms/` | `art-form`、`art-search-bar`、`art-button-table`、`art-button-more`、`wn-config-form`、`wn-upload-dialog`（含 wn-upload-list / wn-form-upload）、`wn-group-list`、`wn-custom-select`、`wn-icon-selector`、`wn-form-tooltip`、`wn-json-editor`、`art-excel-import/export`、`art-drag-verify` |
| `charts/` `cards/` | echarts 图表 11 个、统计卡片 7 个 |
| `base/` `banners/` `media/` `widget/` `theme/` | `art-svg-icon`、`art-back-to-top`、banner 组件、视频/裁图、`art-icon-button`、theme-svg |

---

## 3. 两种开发模式

### 模式 A：基座内开发（vue/src）

适合：框架能力、基座自有业务页（`views/admin`）。

- 启动：在 `vue/` 目录 `pnpm dev`
- 页面必须引共享组件：`import ArtTable from '@admin/tables/art-table/index.vue'`
- 基座 main.ts / App.vue 已 provide 全部宿主能力（图标、authList、表格设置、EP locale 等），**不要动这些 provide**
- 构建输出目录由 `.env.production` 的 `VITE_OUT_DIR` 决定，构建完直接落地，无需拷贝

### 模式 B：微端子应用开发（vue/plugin/<name>）

适合：独立业务插件（如 devs 开发工具、wnapi API 管理）。

**日常开发流程：**

1. 在 `vue/plugin/<name>/` 目录 `pnpm dev`（端口 = vite.config.ts 里的 `DEV_PORT`，全项目唯一）
2. 后端 `plugin/<name>/config/app.php` 配置 `mfe_dev_server => true`（或 dev server 的 remoteEntry.js 完整 URL）→ **必须彻底重启 webman 进程**才生效
3. 打开基座页面 → 基座 RuleService 探测到 dev server，直接热装载子应用源码，改代码即时生效
4. 上线：`pnpm build:copy`（= vite build + 自动拷贝到 `plugin/<name>/public/admin/dist`，由 webman 托管在 `/app/<name>/admin/dist/`），并把 `mfe_dev_server` 设回 `false`

**子应用代码规则：**

- API 请求直接用 `@admin/core/request` 的 `get/post/del`，路径用 `toAdminApiUrl(route.meta.key)` 从菜单 meta 生成（`route.meta` 里包含菜单名、插件名、后端控制器路径、权限按钮列表等全部 RuleService 字段，无需额外请求）
- 登录鉴权与基座完全互通（同一套 webman session），用 `useAuth()` 的 `hasAuth('insert'|'update'|'delete'...)` 判权限
- 当前登录用户信息：**推荐 `useUserStore()`**（壳子模式拿到基座 store 实例，数据完全同步）；轻量场景也可用 `useCurrentUser()`（fetch 方案，自带缓存）
- 上传复用主框架统一上传组件（`@admin/forms/wn-upload-dialog`），不要自己实现上传
- 模板里 `<el-*>` 组件直接写，**不要配 ElementPlusResolver**：组件由基座 `app.use(ElementPlus)` 全局注册解析（vue 是 MF singleton，子应用组件渲染在同一 app 实例上），独立运行时子应用 `main.ts` 也全局注册，两条路径都通
- 子应用 tailwind 可独立引入 v4 样式，必须跳过 preflight、必须加 `@source` 扫共享包（见 5.2）
- **element-plus 已加入 MF singleton 共享**（基座 `loadRemote.ts` 的 `buildHostShared()` 下发 `2.14.7`，子应用 `federation.shared` 声明 `'element-plus': { singleton: true }`）。全站只有基座那一份实例，语言包、主题、`ElMessage` 等 API 天然一致，子应用不再打包约 2 MB 重复副本。升级 element-plus 时必须同步改 `buildHostShared()` 里的版本号，并保证各应用安装的版本与之一致（版本跨度过大时 MF 协商不通过，子应用会回退到自己的副本，语言包又不生效）

### 当前端口分配

| 应用 | DEV_PORT | 说明 |
|---|---|---|
| devs | 5174 | 标准模板 |
| wnapi | 5175 | 页面在 `src/views/wnapi/` 二级目录（exposes 有特殊剥离，见 5.2） |

新子应用端口从 5176 起排，**必须唯一**。

---

## 4. 共享包 @admin 能力清单（可直接用）

### 4.1 列表页四件套（标准 CRUD 页面写法）

```ts
import { useWnTable } from '@admin/core/table/useWnTable'
import { get, post, del } from '@admin/core/request'
import { useAuth } from '@admin/core/auth/useAuth'
import { toAdminApiUrl } from '@admin/core/utils/controller'
// 模板中直接写 <ArtTableHeader> <ArtTable> <ArtSearchBar>，组件由 Components() 自动解析
// 操作列按钮用 <ArtButtonTable type="edit|delete" vAuth="update" @click=... />
```

`useWnTable` 返回（与基座 useTable 同签名，页面零改动迁移）：
`columns`（已过滤 visible!==false）、`columnChecks`、`data`、`loading`、`pagination`、
`getData`、`refreshUpdate`、`refreshData`、`resetColumns`、`replaceSearchParams`、`resetSearchParams`、
`handleSizeChange`、`handleCurrentChange`。

常用 core 配置：`immediate`、`apiFn`、`apiParams`、`paginationKey: { current:'page', size:'limit' }`、
`columnsFactory`（支持 `{type:'selection'|'expand'|'globalIndex'}`、`visible:false` 默认隐藏、`formatter`）。

**列显隐必须两段式**：全量 `columns` 绑 `ArtTableHeader` 的 `v-model:columns="columnChecks"`（它写 visible），
表格绑 `columns`（内部已按 visible 过滤）——不要自己再 filter 一份传给表格。

### 4.2 注入能力（WN_* keys，基座已 provide，子应用零配置）

| key（context.ts） | 能力 | 子应用不注入时的默认行为 |
|---|---|---|
| `WN_USER_STORE_KEY` | 用户 store（useUserStore） | 本地默认 store（空数据，isLogin=false） |
| `WN_ICON_COMPONENT_KEY` | 图标渲染组件 | 空占位组件（不报错，但不显示图标——壳子模式基座必注入） |
| `WN_EL_LOCALE_KEY` | EP 语言包 | zh-cn（ArtTable 内部已消费，分页文案自动中文） |
| `WN_AUTH_LIST_KEY` | 权限列表 | `hasAuth()` 恒 true（开发宽松模式） |
| `WN_TABLE_SETTINGS_KEY` | 表格边框/斑马纹/尺寸/全屏/表头背景 | 全部默认值 |
| `WN_TABLE_ACTIONS_KEY` | ArtTableHeader 尺寸/全屏等操作 | 空函数（按钮可点但不生效） |
| `WN_REQUEST_KEY` | 字典加载请求 | 包内 fetch 封装 |
| `WN_FORM_COMPONENTS_KEY` | 表单重依赖组件（富文本等） | 空表 |
| `WN_CHART_ENV_KEY` | 图表深色模式/菜单状态 | 浅色 + 展开 |
| `WN_UPLOAD_LIMIT_KEY`（config.ts） | 上传限制配置 | 包内默认 |

### 4.3 其他可用

- 跨组件事件总线：`@admin/core/sys/mittBus`
- 模块联邦加载核心：`@admin/core/mfe/loadRemote`（基座装载子应用用，业务代码别碰）
- 统一类型定义：`@admin/core/types`、`@admin/types`
- EP 组件 props 数字归一化：后端返回的 limit/status/size 等在入口层统一 `Number()`，防类型警告

---

## 5. 红线清单（AI 必读：不能改 / 不能做）

> **本架构无沙箱**：子应用与基座跑在同一 JS 线程、同一 window、同一 Vue 实例。
> 子应用代码一旦有全局污染/样式污染/内存泄漏，会感染整个页面包括基座。
> 因此 **5.3 节（子应用运行时行为红线）是全文档最重要的部分**，写子应用代码前必须读完。

### 5.1 共享包（shared/admin）编写规则

1. **零基座依赖**：禁止 `import ... from '@/...'`、禁止 pinia store、禁止 vue-i18n、禁止依赖全局注册组件。宿主能力一律 `provide/inject` 解耦（key 定义在 `core/context.ts`）。
2. **所有 WN_* 注入 key 必须是字符串常量**（`'wnXxx' as const`），**绝对禁止 Symbol**——Symbol 跨 bundle 永不相等，注入体系会整体失效（已踩坑，教训见 8 章）。
3. 共享组件内 vue API、El 组件、图标**必须显式 import**（如 `import { ElConfigProvider } from 'element-plus'`）——子应用壳子只装载 exposed 模块不执行 main.ts，全局注册写法解析不到。
4. 包内相互引用用**相对路径**（`./`、`../`），不用 `@admin` 自引用。
5. scoped 样式里用 `@apply` 需 `@reference '@styles/core/tailwind.css'`；工具类依赖 `--color-g-*` 等主题变量映射，子应用 tailwind.css 的 `@theme` 必须带同一套映射。

### 5.2 子应用 vite.config.ts 规则（改前必读）

1. `ElementPlusResolver({ importStyle: false })`——AutoImport 和 Components **两处都要**。element-plus 样式只依赖一份全量 CSS（壳子模式用基座的、独立运行用子应用 main.ts 的），删掉会重复加载两份 EP 样式。
2. `Components()` 的 `dirs` 必须含 `'../../shared/admin/src'`，否则共享组件内部用到的全局标签构建后解析为空白。
3. `AutoImport` 必须配 vue / vue-router / @vueuse/core / ElMessage 等——共享包源码是 auto-import 写法，子应用不配会运行时报 `xxx is not defined`。
4. `vite.config.ts` 必须加入子应用 `tsconfig.json` 的 `include`，否则 IDE 类型解析失败满屏红波浪线。
5. exposes 自动扫描规则：`src/views/` 一级 `.vue` + 二级目录 `index.vue`，`modules/` 子目录自动忽略。**wnapi 特例**：页面在 `views/wnapi/` 下，其 vite.config 额外剥离了插件名层级——新增子应用若照抄 devs 模板（页面直接在 `views/` 一级）则无需关心；若嵌套目录，必须同步改扫描逻辑，否则菜单 component 匹配不到 exposes，页面「远程加载失败」。
6. dev proxy 必须用正则排除 `/admin/dist`（`^/app/<name>/(?!admin/dist)`），且**不要加 rewrite**（webman 插件路由自带 `/app` 前缀）。
7. MF shared 配置：`vue: { singleton: true }`、`'vue-router': { singleton: true }` 且必须显式声明版本号 key（与实际安装版本一致，否则报 `Version from undefined`）、`'@iconify/vue': { singleton: true }`（否则子应用无法用基座注入的图标渲染）。
8. tailwind.css 的 `@source '../../../../../shared/admin/src'` 层级数以 **CSS 文件所在目录**为基准算，写错**静默无效不报错**。
9. 子应用依赖必须在**子应用目录内** `pnpm add`，禁止在基座根目录安装子应用专属依赖。
10. 模板中 `ElCard` 等卡片组件显式加 `shadow="never"`，避免 EP 默认投影在没有基座盒子模式覆盖的环境（独立运行）下裸露。

### 5.3 子应用运行时行为红线（防感染主框架，最重要）

> 无沙箱 = 子应用与基座共享同一个 JS 运行时。以下行为会直接污染或拖累基座，**全部禁止**。

#### A. 全局污染类（感染基座 window / 原型 / 全局空间）

1. **禁止修改原生原型**（`Array.prototype.xxx = ...`、`Object.prototype`、`String.prototype` 等）——基座和所有子应用共享同一批原生对象，改一处全场中招。
2. **禁止往 `window` / `document` / `globalThis` 挂自定义属性或函数**——需要跨组件/跨页面通信一律用 `@admin/core/sys/mittBus`。
3. **禁止 `app.component()` / `app.directive()` 全局注册**——壳子模式 main.ts 不执行，而在 exposed 模块顶层调用宿主 app 注册会污染基座组件空间。需要组件就显式 import。
4. **禁止覆盖基座已有全局对象**（`$message`、`$confirm`、`$router` 等壳子注入的 globalProperties），只能读取使用。

#### B. 样式污染类（洗掉基座样式）

1. **tailwind 必须跳过 preflight**（子应用模板已配好，不要加回 `@import 'tailwindcss/preflight'`）——preflight 会把基座的按钮/标题等基础样式全部重置。
2. **组件样式一律 `<style scoped>`**；要改 EP 内部样式用 scoped 内的 `:deep()`，禁止裸写非 scoped 样式块。
3. **禁止引入第三方全局 reset.css / normalize.css**。
4. **禁止非 scoped 的裸全局选择器**（`*`、`body`、`div`、`.el-card` 等）——确需调 EP 主题时，只在子应用根容器类下覆盖 `--el-*` CSS 变量，**禁止挂 `:root`**（会覆盖基座主题）。
5. **禁止 `@import` 外部 CDN 字体/样式**（离线部署要求，图标走本地 iconify 离线集）。

#### C. 内存泄漏类（拖累整个页面，基座跟着卡）

1. `setInterval` / `setTimeout` 必须在 `onUnmounted` 里 `clearInterval` / `clearTimeout`。
2. `window.addEventListener` / `document.addEventListener` 必须在 `onUnmounted` 里对应 `removeEventListener`（同一函数引用）。
3. `mittBus.on` 必须在 `onUnmounted` 里 `mittBus.off`（同一 handler 引用）。
4. echarts / 视频播放器 / 第三方实例必须在 `onUnmounted` 里 `dispose()` / `destroy()`（用共享 charts 组件的已内置清理，自己 new 的必须自己清）。
5. **禁止在模块顶层（组件 setup 外）创建持续副作用**（定时器、事件监听）——子应用模块只加载一次，顶层副作用永远没机会清理，切走页面也停不下来。

#### D. 运行环境假设类（壳子模式下必翻车）

1. **永远按「壳子模式」写代码**：main.ts / router/index.ts / App.vue 仅独立运行调试用，壳子不执行——页面初始化逻辑必须写在页面组件的 `onMounted` 里。
2. **禁止 `createApp` / 自己 `mount` / `createRouter` / `createPinia`**——应用实例、路由、pinia 全部用基座单例（`useRoute()` / `useRouter()` / `useUserStore()` 直接拿）。
3. **禁止直接操作基座 DOM**（`document.querySelector` 找壳子元素）——需要与基座交互走 provide/inject 能力或 mittBus 事件。
4. **禁止 import 基座内部路径**（`@/store/...`、`@/utils/...` 指向基座 src，子应用里解析不到）——共享能力一律走 `@admin/*`。

#### E. 上线前检查清单（打包前过一遍）

- [ ] 全局搜索子应用 src：无 `prototype.` 修改、无 `window.xxx =` / `document.xxx =` 赋值
- [ ] 全局搜索：每个 `setInterval`/`setTimeout` 都有对应清理、每个 `addEventListener` 都有对应 remove
- [ ] 全局搜索：无 `<style>` 裸块（必须带 `scoped`）、无 `:root` 变量覆盖
- [ ] 确认 vite.config 两处 `importStyle: false` 都在、tailwind 无 preflight
- [ ] 壳子模式下点一遍所有菜单页面，控制台无红色报错
- [ ] 连续进出页面 10 次，DevTools Memory 堆快照无明显持续增长（内存泄漏快速验证）

### 5.4 运行时与基座侧红线

1. **子应用 main.ts 仅独立运行时执行**；壳子只装载 exposed 模块。任何依赖 main.ts 初始化的逻辑（全局注册、路由表、provide）在壳子模式都不存在——写子应用代码时永远按「壳子模式」假设。
2. RuleService 下发的 remoteEntry URL 带 `?v=filemtime()` 版本参数，**前端不可移除**——remoteEntry 无 hash，去掉必命中旧缓存出现诡异 404/空白。
3. 基座 loadRemote 的 `init()` 必须传宿主 shared scope（vue singleton、`from:'shell'`、`loaded:true`），否则子应用协商不到宿主 vue，会退回自带副本，双 vue 并存导致组件渲染成空注释且无报错。
4. 基座 App.vue/main.ts 的 provide 清单（图标 Icon 本体、authList、表格设置、EP locale…）是共享包运转的根，**不要动**；`WN_ICON_COMPONENT_KEY` provide 的是 `@iconify/vue` 的 Icon 本体而不是 ArtSvgIcon——provide ArtSvgIcon 会无限递归。
5. 图标是离线方案（`@iconify-json` 本地注册集，见基座 `utils/ui/iconify-loader`），不要改回外部 CDN。
6. 浏览器 cookie 按 host 隔离：开发时基座与子应用必须用**同一个 host**（都用 localhost 或都用 127.0.0.1），混用会丢登录态、接口返回未登录跳转脚本。

### 5.5 后端配套（webman）

1. 子应用新增数据库字段必须走 `plugin/<name>/update.php` 幂等 ALTER，兼容已安装实例。
2. 改动 `plugin/<name>/config/app.php`（含 mfe_dev_server）或新增插件后，必须**彻底停止再重启 webman**，否则路由 404。
3. webman 环境禁用 Laravel `env()` 函数（依赖 PhpOption，未安装会 500），统一用 `config()`。

---

## 6. 新增一个子应用（checklist）

1. 拷贝 `vue/plugin/devs` → `vue/plugin/<新名字>`（目录名即应用名，base/federation name/proxy 自动推导）
2. 改 `vite.config.ts` 里唯一的 `DEV_PORT`（从 5176 起排）+ `package.json` 的 name
3. 页面放 `src/views/` 一级（或 `<页面>/index.vue`），子组件放 `modules/`，exposes 自动生成
4. 子应用目录内 `pnpm install`；需要新依赖在子应用目录内 `pnpm add`
5. 后端建 `plugin/<name>/`（webman 插件），`config/app.php` 配置 `mfe_dev_server`
6. 重启 webman；基座菜单管理里给插件注册菜单（component 字段填 `/index` 或 `/xxx`）
7. 上线执行 `pnpm build:copy`，`mfe_dev_server` 置 false
8. **发布前必须过一遍 5.3.E 上线前检查清单**——无沙箱架构下，一个有全局污染/内存泄漏的子应用会感染整个基座

---

## 7. 新增一个共享组件（checklist）

1. 放 `vue/shared/admin/src/<分类>/<组件名>/index.vue`
2. 显式 import 一切（vue API / El 组件 / 图标），不依赖 store/i18n/全局注册
3. 宿主差异走 `provide/inject`，key 加进 `core/context.ts`（字符串常量 + 安全默认值）
4. 包内互引相对路径；需要 tailwind 工具类时确认子应用 `@source` 已覆盖（现有配置已覆盖整个 src）
5. 基座 `views/admin` 与子应用统一从 `@admin/<分类>/<组件名>/index.vue` 引用；基座如需旧路径兼容，转发文件必须含 `<script setup>` + `<template>` 双标签（纯 script 转发会被 unplugin 跳过导致组件注册失败）

---

## 8. 常见故障速查

| 症状 | 根因 | 处理 |
|---|---|---|
| 子应用图标不显示 | Symbol key 跨 bundle 不相等 / 图标依赖未进 MF shared | 确认 key 是字符串常量、`@iconify/vue` singleton 已声明 |
| 组件渲染成空注释 `<!---->` 且无报错 | 组件解析为 undefined：exposes key 不匹配 / 全局注册写法 / init 未传宿主 scope | 按 5.2.5、5.1.3、5.3.3 排查 |
| 菜单点开「远程加载失败」 | exposes key 与 `componentPathToExposed` 约定不一致 | 检查页面目录层级与扫描规则（5.2.5），无需改数据库菜单 |
| 接口 404 | webman 未重启 / mfe_dev_server 未生效 | 彻底停掉 webman 再启动 |
| remoteEntry 404 / 旧版本 | 浏览器缓存命中旧 remoteEntry | 确认 URL 带 `?v=` 参数（5.3.2），强刷 |
| 「CSS 样式丢失」 | 多为假象：先看 DOM 有没有元素 | 空注释 = 组件没渲染（上一条），不是 CSS 问题 |
| 分页/日期等 EP 内置文案变英文 | 子应用 EP 副本拿不到基座 locale | 已由 `WN_EL_LOCALE_KEY` 方案统一解决（ArtTable 内部处理），别删 5.2.1 的 `importStyle: false` 和 App.vue 的 provide |
| 卡片多出 box-shadow | EP 默认 `shadow="always"` 在无基座盒子模式覆盖的环境裸露 | `<ElCard shadow="never">` |
| 未安装（isInstall=false）打开后台，没跳安装向导、直接停在登录页 | 启动阶段 `initSystemConfig()` 调 `logOut()` 会 `router.push(Login)`，此时守卫未注册、router 未 `app.use`，这次 push 抢占初始导航，守卫的安装跳转永远不执行 | `logOut(isRedirect, skipNavigation=true)` 只清状态不跳转，路由决策统一交给 beforeEach |
| 登录态丢失、返回未登录跳转脚本 | localhost 与 127.0.0.1 混用 | 统一 host（5.3.6） |
| 列取消勾选后表格没变化 | 列显隐没用两段式 | 见 4.1 |
| `defineAsyncComponent(...).catch(()=>null)` 组件静默消失 | 失败被吞成 null，条件渲染失效 | 用独立 ref 标记组件真实可用性 |

---

## 9. 命令速查

```bash
# 基座
cd vue && pnpm dev            # 基座 dev server
cd vue && npx vite build      # 基座构建（输出目录由 VITE_OUT_DIR 决定）

# 子应用（在 vue/plugin/<name>/ 下）
pnpm dev                      # 启动 dev server（DEV_PORT）
pnpm build:copy               # 构建并拷贝到 plugin/<name>/public/admin/dist
npx vue-tsc --noEmit          # 类型检查（提交前必跑）

# 共享包不单独构建——改完共享包源码，基座/子应用 dev server 热更新直接生效；
# 若改了基座 vite.config 的 shared 配置，基座与子应用 dev server 必须同时重启。
```

---

*文档对应代码版本：v1.3（2026-10）。架构有变更时更新本文件，保持「AI 读一次就能干活」的有效性。*
