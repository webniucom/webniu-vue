/**
 * 离线图标加载器（异步版）
 *
 * 用于在内网/离线环境下支持 Iconify 图标，避免运行时从 api.unisvg.com 拉取（国内常超时）。
 *
 * 为什么改成动态 import：
 *   ri 全集 JSON 约 1MB（3229 个图标），静态 import 会打进首屏 vendor chunk 阻塞首屏。
 *   改为首屏挂载完成后异步加载：页面框架先渲染，图标数据到位后
 *   @iconify/vue 会自动重渲染已挂载的 Icon 组件（图标晚一点出现，但不白屏）。
 *   产物上图标 JSON 会被拆成独立的异步 chunk，浏览器还能单独缓存它。
 *
 * 注意：这里用 @iconify/vue 的 offline 构建（与 main.ts 注入的 Icon 同源），
 * offline 构建永远不会向 Iconify API 发请求，保持纯离线行为。
 */
import { addCollection } from '@iconify/vue/offline'

let started = false

/** 首屏挂载后调用一次：异步拉取 ri 图标集并注册到 @iconify/vue 存储 */
export function loadOfflineIcons(): void {
  if (started) return
  started = true
  import('@iconify-json/ri/icons.json').then((mod) => {
    addCollection(mod.default as any)
  })
}
