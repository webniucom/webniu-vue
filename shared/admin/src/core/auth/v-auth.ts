/**
 * v-auth 权限指令（后端模式）
 *
 * 权限列表来源：基座 provide 的 authList getter（WN_AUTH_LIST_KEY）。
 * 指令本身是全局注册的（不在组件 setup 里），拿不到 inject 上下文，
 * 所以通过 createAuthDirective(getter) 工厂传入 getter 函数。
 *
 * 基座注册：app.directive('auth', createAuthDirective(() => authList.value))
 *   （authList.value 是 provide 时从 router.currentRoute.meta 拿到的 ref）
 *
 * 子应用注册：基座 provide 已生效（MF 下同一份 app 实例），
 *   直接传同一个 getter 即可——实际上基座注册了子应用就也能用。
 */
import type { Directive, DirectiveBinding } from 'vue'
import type { AuthItem } from './useAuth'

export type AuthGetter = () => AuthItem[]

export function createAuthDirective(getter: AuthGetter): Directive<HTMLElement, string> {
  const check = (el: HTMLElement, binding: DirectiveBinding<string>) => {
    const authList = getter() || []
    const has = authList.some((item) => item.authMark === binding.value)
    if (!has && el.parentNode) el.parentNode.removeChild(el)
  }
  return {
    mounted: check,
    updated: check
  }
}
