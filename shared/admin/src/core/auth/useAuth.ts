/**
 * 权限验证 hook（后端模式）
 *
 * webniu 后台权限数据链路：
 *   RuleService.php::processAuthList() 把菜单树里 type=2（按钮）节点的
 *   { title, authMark } 抽到父菜单的 meta.authList，前端路由 meta 直接携带。
 *
 * 解耦设计：共享组件不依赖基座 router 单例，通过 provide/inject 获取 authList getter。
 * 基座在 main.ts 里 provide 一个动态 getter（每次路由变化都能取到最新 authList），
 * 子应用不 provide 时自动 fallback 到 useRoute().meta（MF shared 下 vue-router 是 singleton，
 * 基座 router.currentRoute 与子应用 useRoute() 指向同一个实例）。
 */
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'

export interface AuthItem {
  title: string
  authMark: string
}

/**
 * 宿主注入键：值是一个动态 getter，每次调用都返回当前路由的 authList。
 *
 * 必须用字符串常量而非 Symbol：共享包在基座和子应用里各打包一份，
 * Symbol('wnAuthList') 两次执行得到的是不同引用，provide/inject 永远匹配不上。
 */
export const WN_AUTH_LIST_KEY = 'wnAuthList' as const

/**
 * 权限检查 hook。
 * 优先从注入的 getter 取 authList，fallback 到 useRoute().meta（两种方式拿到的是同一份数据）。
 * 注入不存在时（如子应用独立运行、基座未 provide）authList 为空数组——安全默认。
 */
export function useAuth() {
  const injected = inject<(() => AuthItem[]) | null>(WN_AUTH_LIST_KEY, null)
  const route = useRoute()

  const authList = computed<AuthItem[]>(() => {
    if (injected) return injected() || []
    return (route.meta?.authList as AuthItem[]) || []
  })

  function hasAuth(authMark: string): boolean {
    return authList.value.some((item) => item.authMark === authMark)
  }

  return { authList, hasAuth }
}
