/**
 * @admin 宿主上下文注入（provide/inject 解耦）
 *
 * 共享组件不依赖 pinia store / vue-i18n / 基座请求封装，凡宿主差异化的能力
 * 一律通过 provide/inject 提供：基座 main.ts 注入真实实现，子应用不注入时
 * 走内置安全默认值，保证共享组件在任何宿主下都能独立工作。
 *
 * 既有模式参考：上传限制（config.ts 的 WN_UPLOAD_LIMIT_KEY）。
 */
import { computed, inject, type ComputedRef } from 'vue'
import { get } from './request'

// ============ 关键：所有 provide/inject key 用字符串而非 Symbol ============
//
// 原因：共享包被基座和子应用各自打包一份时（MF 架构下 共享包没 singleton），
// Symbol('wnXxx') 每次执行都会生成全新的引用 → 基座 provide 的 Symbol ≠ 子应用 inject 的 Symbol
// → Vue provide/inject 用 === 比较 key 永远不匹配 → 整个宿主上下文注入体系失效。
// 字符串常量跨 bundle 永远是同一个值，彻底解决这个问题。

// ============ 表格显示设置（边框/斑马纹/尺寸/全屏/表头背景） ============

export interface WnTableSettings {
  isBorder?: boolean
  isZebra?: boolean
  tableSize?: 'large' | 'default' | 'small'
  isFullScreen?: boolean
  isHeaderBackground?: boolean
}

export const WN_TABLE_SETTINGS_KEY = 'wnTableSettings' as const

export const WN_TABLE_SETTINGS_DEFAULT: Required<WnTableSettings> = {
  isBorder: false,
  isZebra: false,
  tableSize: 'default',
  isFullScreen: false,
  isHeaderBackground: false
}

/** ArtTable 内部统一从这取设置，保证始终有完整值 */
export function useWnTableSettings(): ComputedRef<Required<WnTableSettings>> {
  const injected = inject<ComputedRef<WnTableSettings | undefined> | undefined>(
    WN_TABLE_SETTINGS_KEY,
    undefined
  )
  return computed(() => ({ ...WN_TABLE_SETTINGS_DEFAULT, ...(injected?.value || {}) }))
}

// ============ i18n 翻译函数 ============

export type WnTranslate = (key: string) => string

export const WN_I18N_T_KEY = 'wnI18nT' as const

/** 子应用无 i18n 时的中文兜底文案（覆盖共享组件内置用到的全部 key） */
const FALLBACK_TEXT: Record<string, string> = {
  'table.form.reset': '重置',
  'table.form.submit': '提交',
  'table.searchBar.search': '查询',
  'table.searchBar.reset': '重置',
  'table.searchBar.expand': '展开',
  'table.searchBar.collapse': '收起',
  'table.selection': '选择',
  'table.zebra': '斑马纹',
  'table.border': '边框',
  'table.headerBackground': '表头背景',
  'table.sizeOptions.small': '紧凑',
  'table.sizeOptions.default': '默认',
  'table.sizeOptions.large': '宽松'
}

export function useWnT(): WnTranslate {
  const injected = inject<WnTranslate | undefined>(WN_I18N_T_KEY, undefined)
  return (key: string) => (injected ? injected(key) : FALLBACK_TEXT[key] ?? key)
}

// ============ 表单额外组件（重依赖由宿主注入，如富文本编辑器） ============

export const WN_FORM_COMPONENTS_KEY = 'wnFormComponents' as const

export function useWnFormComponents(): Record<string, any> {
  return inject<Record<string, any> | undefined>(WN_FORM_COMPONENTS_KEY, undefined) || {}
}

// ============ 统一请求函数（字典加载等内部请求使用） ============

export type WnRequestGet = (path: string, params?: Record<string, any>) => Promise<any>

export const WN_REQUEST_KEY = 'wnRequestGet' as const

/** 默认用包内 fetch 封装（/app 前缀 + session cookie，与基座 axios 版行为一致） */
export function useWnRequestGet(): WnRequestGet {
  return inject<WnRequestGet | undefined>(WN_REQUEST_KEY, undefined) || get
}

// ============ 表格操作方法（ArtTableHeader 改尺寸/全屏/设置时调用） ============

export interface WnTableActions {
  setTableSize?: (size: 'large' | 'default' | 'small') => void
  setIsFullScreen?: (v: boolean) => void
  toggleZebra?: () => void
  toggleBorder?: () => void
  toggleHeaderBg?: () => void
}

export const WN_TABLE_ACTIONS_KEY = 'wnTableActions' as const

/** 子应用不注入时所有操作走空函数，按钮仍然显示但点了不报错 */
export function useWnTableActions(): Required<WnTableActions> {
  const noop = () => {}
  const injected = inject<WnTableActions | undefined>(WN_TABLE_ACTIONS_KEY, undefined)
  return {
    setTableSize: injected?.setTableSize ?? noop,
    setIsFullScreen: injected?.setIsFullScreen ?? noop,
    toggleZebra: injected?.toggleZebra ?? noop,
    toggleBorder: injected?.toggleBorder ?? noop,
    toggleHeaderBg: injected?.toggleHeaderBg ?? noop
  }
}

// ============ 图表运行环境（深色模式 / 菜单状态，用于图表自适应重绘） ============

export interface WnChartEnv {
  isDark: boolean
  menuOpen: boolean
  menuType: string
}

export const WN_CHART_ENV_KEY = 'wnChartEnv' as const

/**
 * 图表组件从宿主取深色模式与菜单展开状态：
 * 基座注入 settingStore 的响应式值；子应用不注入时走「浅色 + 菜单展开」的静态默认。
 */
export function useWnChartEnv() {
  const injected = inject<any>(WN_CHART_ENV_KEY, undefined)
  return {
    isDark: computed<boolean>(() => injected?.isDark?.value ?? false),
    menuOpen: computed<boolean>(() => injected?.menuOpen?.value ?? true),
    menuType: computed<string>(() => injected?.menuType?.value ?? 'left')
  }
}

// ============ Element Plus 语言包（跨副本注入） ============

import zhCnLocale from 'element-plus/es/locale/lang/zh-cn'

export const WN_EL_LOCALE_KEY = 'wnElLocale' as const

/**
 * 基座与子应用各自打包一份 element-plus（EP 未进 MF 共享列表），
 * 基座 App.vue 的 ElConfigProvider provide 的 key 是基座副本的 Symbol，
 * 子应用副本的组件（ElPagination 等）inject 不到 → 分页等内置文案回退英文。
 * 通过字符串 key 把基座 locale 对象传下来，子应用在自家副本的 ElConfigProvider 上使用；
 * 独立运行（无注入）时兜底 zh-cn。
 */
export function useWnElLocale(): ComputedRef<any> {
  const injected = inject<ComputedRef<any> | undefined>(WN_EL_LOCALE_KEY, undefined)
  return computed(() => injected?.value || zhCnLocale)
}

// ============ 图标渲染组件（ArtTableHeader 内置按钮用） ============

export const WN_ICON_COMPONENT_KEY = 'wnIconComponent' as const

/**
 * 基座注入 ArtSvgIcon（iconify 图标），子应用注入 Element Plus 图标组件。
 * fallback 用 render 函数返回空占位（不能用 template 字符串——Vite 构建的 vue.esm-bundler
 * 是运行时版本，不支持运行时模板编译）。
 */
export function useWnIconComponent(): any {
  const injected = inject<any | undefined>(WN_ICON_COMPONENT_KEY, undefined)
  if (injected) return injected
  return {
    name: 'WnIconFallback',
    props: { icon: String },
    render() { return null }
  }
}
