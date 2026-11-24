/**
 * 用户状态管理（共享包版本）
 *
 * 基座和子应用统一使用 useUserStore() 获取登录用户信息。
 * - 基座模式：直接返回基座 pinia store（数据完全一致）
 * - 壳子模式（子应用）：通过 inject 拿到基座 provide 的 store 实例（同一对象）
 * - 独立运行：返回本地默认 store（空数据，走 fetch 兜底）
 *
 * 核心设计：通过字符串 key 的 provide/inject 传递 pinia store 实例，
 * 避免共享包被各自打包导致的多份 pinia 实例问题。
 */

import { inject, computed, type ComputedRef } from 'vue'
import type { Store } from 'pinia'

// ============ 类型定义 ============

export interface UserInfo {
  id?: number
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  roles?: string[]
  [key: string]: any
}

export interface UserStoreState {
  language: string
  isLogin: boolean
  isLock: boolean
  lockPassword: string
  info: Partial<UserInfo>
  searchHistory: any[]
  accessToken: string
  refreshToken: string
}

export interface UserStoreActions {
  setUserInfo: (info: UserInfo) => void
  setLoginStatus: (status: boolean) => void
  setLanguage: (lang: string) => void
  setSearchHistory: (list: any[]) => void
  setLockStatus: (status: boolean) => void
  setLockPassword: (password: string) => void
  setToken: (accessToken: string, refreshToken?: string) => void
  logOut: (isRedirect?: boolean) => void
  checkAndClearWorktabs: () => void
}

export interface UserStoreGetters {
  getUserInfo: ComputedRef<Partial<UserInfo>>
  getSettingState: ComputedRef<any>
  getWorktabState: ComputedRef<any>
}

export type UserStore = Store<'userStore', UserStoreState, UserStoreGetters, UserStoreActions>

// ============ 注入 Key ============

export const WN_USER_STORE_KEY = 'wnUserStore' as const

// ============ 默认空实现（独立运行时的兜底） ============

const defaultUserStore = {
  language: 'zh',
  isLogin: false,
  isLock: false,
  lockPassword: '',
  info: {},
  searchHistory: [],
  accessToken: '',
  refreshToken: '',
  getUserInfo: computed(() => ({})),
  getSettingState: computed(() => ({})),
  getWorktabState: computed(() => ({})),
  setUserInfo: () => {},
  setLoginStatus: () => {},
  setLanguage: () => {},
  setSearchHistory: () => {},
  setLockStatus: () => {},
  setLockPassword: () => {},
  setToken: () => {},
  logOut: () => {},
  checkAndClearWorktabs: () => {}
} as unknown as UserStore

// ============ Hook ============

/**
 * 获取用户 store（统一入口）
 *
 * 基座模式：直接返回基座 pinia store（数据完全一致）
 * 壳子模式：通过 inject 拿到基座 provide 的 store 实例（同一对象）
 * 独立运行：返回本地默认 store（空数据）
 *
 * @returns 用户 store 实例
 *
 * @example
 * ```ts
 * // 基座和子应用统一写法
 * import { useUserStore } from '@admin/core/auth/useUserStore'
 *
 * const userStore = useUserStore()
 * console.log(userStore.info.username) // 登录用户名
 * console.log(userStore.isLogin)       // 是否已登录
 * ```
 */
export function useUserStore(): UserStore {
  // 尝试从注入获取（壳子模式）
  const injected = inject<UserStore | undefined>(WN_USER_STORE_KEY, undefined)

  if (injected) {
    // 壳子模式：返回基座的 store 实例（同一对象，数据同步）
    return injected
  }

  // 独立运行：返回默认空 store
  return defaultUserStore
}
