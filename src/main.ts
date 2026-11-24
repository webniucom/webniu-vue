import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 说明：壳子直接 import element-plus/dist/index.css 全量样式
// 不再依赖 vite.config.ts 里 unplugin-element-plus 插件按需注入 SCSS 源样式
// 因为 shell 自己的 SCSS additionalData 变量注入会干扰 element-plus 的按需编译
// 全量引入确保所有 element-plus 组件（包括子应用用到的）都有正确的 CSS
import { loadOfflineIcons } from './utils/ui/iconify-loader' // 离线图标集（挂载后异步加载，避免 1MB JSON 阻塞首屏）
import '@styles/core/tailwind.css'                  // tailwind
import '@styles/index.scss'                         // 样式
import '@utils/sys/console.ts'                      // 控制台输出内容
import { computed, defineAsyncComponent } from 'vue'
// 上传限制 key 在 config.ts，其余宿主上下文 key 在 context.ts
import { WN_UPLOAD_LIMIT_KEY } from '@admin/core/config'
import { WN_AUTH_LIST_KEY } from '@admin/core/auth/useAuth'
import {
  WN_TABLE_SETTINGS_KEY,
  WN_TABLE_ACTIONS_KEY,
  WN_ICON_COMPONENT_KEY,
  WN_I18N_T_KEY,
  WN_REQUEST_KEY,
  WN_FORM_COMPONENTS_KEY,
  WN_CHART_ENV_KEY
} from '@admin/core/context'
import { WN_USER_STORE_KEY } from '@admin/core/auth/useUserStore'
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'
import { initSystemConfig } from './utils/init'

(async () => {
  document.addEventListener(
    'touchstart',
    function () {},
    { passive: false }
  )

  const app = createApp(App)

  // 全局注册 element-plus + 全部图标，壳子和子应用都能用
  app.use(ElementPlus)
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component as any)
  }

  initStore(app)
  await initSystemConfig()
  // 给共享组件注入真实上传限制（后缀/单文件上限/个数），子应用不注入则走默认值
  const { useSystemStore } = await import('@/store/modules/system')
  const systemStore = useSystemStore()
  app.provide(WN_UPLOAD_LIMIT_KEY, computed(() => systemStore.systemConfig?.attachMent))

  // 表格显示设置：ArtTable 从基座 store 读取真实配置，子应用不注入则走默认值
  const { useTableStore } = await import('@/store/modules/table')
  const tableStore = useTableStore()
  app.provide(
    WN_TABLE_SETTINGS_KEY,
    computed(() => ({
      isBorder: tableStore.isBorder,
      isZebra: tableStore.isZebra,
      tableSize: tableStore.tableSize,
      isFullScreen: tableStore.isFullScreen,
      isHeaderBackground: tableStore.isHeaderBackground
    }))
  )

  // 表格操作方法：ArtTableHeader 改尺寸/全屏/设置时调用
  app.provide(WN_TABLE_ACTIONS_KEY, {
    setTableSize: (size: any) => tableStore.setTableSize(size),
    setIsFullScreen: (v: boolean) => tableStore.setIsFullScreen(v),
    toggleZebra: () => (tableStore.isZebra = !tableStore.isZebra),
    toggleBorder: () => (tableStore.isBorder = !tableStore.isBorder),
    toggleHeaderBg: () => (tableStore.isHeaderBackground = !tableStore.isHeaderBackground)
  })

  // 图表运行环境：共享图表组件（charts/cards）按基座深色模式与菜单状态自适应重绘
  const { useSettingStore } = await import('@/store/modules/setting')
  const settingStore = useSettingStore()
  app.provide(WN_CHART_ENV_KEY, {
    isDark: computed(() => settingStore.isDark),
    menuOpen: computed(() => settingStore.menuOpen),
    menuType: computed(() => settingStore.menuType)
  })

  // 图标渲染组件：提供 @iconify/vue offline 构建的 Icon（与 iconify-loader 注册数据同源）。
  // 不能提供共享包的 ArtSvgIcon：子应用内再注入回它自己会形成自引用，
  // 而子应用打包的 @iconify/vue 副本没有离线图标数据，图标会渲染空白。
  const { Icon } = await import('@iconify/vue/offline')
  app.provide(WN_ICON_COMPONENT_KEY, Icon)

  // i18n 翻译函数：ArtForm/ArtSearchBar 按钮文案走基座语言包，子应用不注入则走内置中文兜底
  app.provide(WN_I18N_T_KEY, (key: string) => (language as any).global.t(key))

  // 按钮权限 getter：共享组件（ArtButtonTable/ArtButtonMore）每次调用取当前路由的 authList
  const { router } = await import('./router')
  app.provide(WN_AUTH_LIST_KEY, () => (router.currentRoute.value.meta?.authList as any[]) || [])

  // 统一请求函数：共享组件内部请求（字典加载等）沿用基座 axios 封装
  const { get: commonRequestGet } = await import('@/api/common-request')
  app.provide(WN_REQUEST_KEY, commonRequestGet)

  // 表单重依赖组件：富文本编辑器只在基座注入，共享包本体不打包编辑器。
  // 用 defineAsyncComponent 同步注入占位：编辑器 chunk（vendor-editor ~786KB + vendor-highlight ~950KB）
  // 只在表单真正渲染 wangeditor 字段时才加载，不再阻塞 app.mount 首屏。
  const ArtWangEditor = defineAsyncComponent(
    () => import('@/components/business/art-wang-editor/index.vue')
  )
  app.provide(WN_FORM_COMPONENTS_KEY, { wangeditor: ArtWangEditor })

  // 用户 store：壳子模式下子应用通过 useUserStore() 拿到基座的 store 实例（同一对象）
  // 独立运行时子应用返回本地默认 store（空数据）
  const { useUserStore: useBaseUserStore } = await import('@/store/modules/user')
  const baseUserStore = useBaseUserStore()
  app.provide(WN_USER_STORE_KEY, baseUserStore)

  initRouter(app)
  setupGlobDirectives(app)
  setupErrorHandle(app)
  
  app.use(language)
  app.mount('#app')

  // 首屏挂载完成后再异步加载离线图标集（约 1MB）：
  // 框架/菜单先渲染，图标数据到位后由 @iconify/vue 自动重渲染图标
  loadOfflineIcons()
})()