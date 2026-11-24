/**
 * 转发导出：真正的实现已收敛到 @admin/core/auth/
 * 既有代码 `import { setupAuthDirective } from '@/directives/core/auth'` 继续可用。
 *
 * 基座版和子应用版唯一差异：getter 来源。
 * 基座直接用 router.currentRoute 单例（router 已在 initRouter 时初始化）。
 * 子应用注册时从基座 provide 的 WN_AUTH_LIST_KEY 拿 getter——
 *   但 MF 下基座注册了 auth 指令后，子应用自动继承同一个 app 实例的指令，
 *   所以子应用根本不需要单独注册。
 */
import type { App } from 'vue'
import { createAuthDirective } from '@admin/core/auth/v-auth'
import { router } from '@/router'

export type AuthDirective = ReturnType<typeof createAuthDirective>

/**
 * 动态 getter：每次调用都取当前路由的最新 meta.authList。
 * 不能用 computed——指令 check 是 imperative 调用，需要即时值。
 */
const authGetter = () => {
  const meta = router.currentRoute.value.meta
  return (meta?.authList as any[]) || []
}

const authDirective = createAuthDirective(authGetter)

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
