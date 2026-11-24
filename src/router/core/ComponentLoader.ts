/**
 * 组件加载器
 *
 * 负责动态加载 Vue 组件：先查本地 views，查不到看菜单有没有 remoteEntry，
 * 有的话走微前端运行时动态加载，都没有渲染错误组件。
 */

import { h } from 'vue'
import { loadRemoteComponent, componentPathToExposed } from '@/utils/mfe/loadRemote'

export class ComponentLoader {
  private modules: Record<string, () => Promise<any>>

  constructor() {
    // 动态导入 views 目录下所有 .vue 组件
    this.modules = import.meta.glob('../../views/**/*.vue')
  }

  /**
   * 加载组件
   *
   * @param componentPath  菜单接口返回的 component 字段（如 /dves/index、/admin/dashboard）
   * @param remoteEntry    微前端 remoteEntry.js 地址（存在则优先远程加载）
   */
  load(componentPath: string, remoteEntry?: string): () => Promise<any> {
    if (!componentPath) {
      return this.createEmptyComponent()
    }

    // 1. 本地 views 优先（admin/ 开头的视图都在壳子本地）
    const fullPath = `../../views${componentPath}.vue`
    const fullPathWithIndex = `../../views${componentPath}/index.vue`
    const local = this.modules[fullPath] || this.modules[fullPathWithIndex]
    if (local) return local

    // 2. 微前端远程加载（menu.php/component 不以 /admin 开头 → 大概率是其他 plugin）
    if (remoteEntry) {
      const exposedPath = componentPathToExposed(componentPath)
      console.log(`[ComponentLoader] 远程加载: ${remoteEntry} → ${exposedPath}`)
      return async () => {
        try {
          console.log(`[ComponentLoader] 远程加载: ${remoteEntry} → ${exposedPath}`)
          return await loadRemoteComponent(remoteEntry!, exposedPath)
        } catch (e) {
          console.error(`[ComponentLoader] 远程加载失败: ${remoteEntry}`, e)
          return this.createErrorComponent(componentPath, `远程加载失败,确认子应用开发模式是否开启：${remoteEntry}`)()
        }
      }
    }

    // 3. 真找不到 → 错误组件
    console.error(
      `[ComponentLoader] 未找到组件: ${componentPath}（本地 views 无匹配，remoteEntry 也为空）`
    )
    return this.createErrorComponent(componentPath)
  }

  /**
   * 加载布局组件
   */
  loadLayout(): () => Promise<any> {
    return () => import('@/views/admin/index/index.vue')
  }

  /**
   * 加载 iframe 组件
   */
  loadIframe(): () => Promise<any> {
    return () => import('@/views/admin/system/outside/Iframe.vue')
  }

  private createEmptyComponent(): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', {})
        }
      })
  }

  private createErrorComponent(componentPath: string, reason?: string): () => Promise<any> {
    const msg = reason || `组件未找到,确认组件开发模式: ${componentPath}`
    return () =>
      Promise.resolve({
        render() {
          return h('div', { class: 'route-error' }, msg)
        }
      })
  }
}
