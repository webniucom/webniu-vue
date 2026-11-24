/**
 * 当前登录用户信息 hook（零基座依赖的 fetch 方案）
 *
 * 直接调基座后端接口 /app/webniu/admin/account/info，session cookie 鉴权，
 * credentials:'include' 自动带上壳子登录态。不需要 pinia、不需要 provide/inject。
 *
 * 如果基座以后把用户信息 provide 了（WN_CURRENT_USER_KEY），
 * 这里 fallback 就能无缝切过去——外部调用方完全无感。
 */
import { inject, computed, ref, type ComputedRef, type InjectionKey } from 'vue'
import { get } from '../request'

export interface WnUserInfo {
  id?: number
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  roles?: string[]
  [key: string]: any
}

/** 基座 provide 时用的 key（未来扩展点） */
export const WN_CURRENT_USER_KEY: InjectionKey<ComputedRef<WnUserInfo | undefined>> =
  Symbol('wnCurrentUser')

let cachedPromise: Promise<WnUserInfo | undefined> | null = null
const cachedUser = ref<WnUserInfo>({})

async function fetchUserInfo(): Promise<WnUserInfo | undefined> {
  // 同页多次调用只发一次请求
  if (cachedPromise) return cachedPromise
  cachedPromise = get<WnUserInfo>('/webniu/admin/account/info')
    .then((data) => {
      cachedUser.value = data ?? {}
      return data
    })
    .catch(() => undefined)
    .finally(() => {
      // 30 秒后清缓存，下一次进入页面会重新拉
      setTimeout(() => {
        cachedPromise = null
      }, 30_000)
    })
  return cachedPromise
}

export function useCurrentUser() {
  // 优先用基座 provide（如果有），fallback 到 fetch
  const injected = inject(WN_CURRENT_USER_KEY, null)

  if (injected) {
    // provide 模式：基座注入的是 computed ref，直接透传
    return { info: computed(() => injected.value ?? ({} as WnUserInfo)) }
  }

  // fetch 模式：在组件 setup 里触发一次，响应式用全局 ref 包
  fetchUserInfo()
  return { info: cachedUser }
}
