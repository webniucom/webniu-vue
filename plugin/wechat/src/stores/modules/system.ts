import { getActivePinia } from 'pinia'

// pinia 为 MF singleton，基座已注册 systemStore，
// 子应用直接从共享 pinia 实例取，无需 import 基座源码。
export function useSystemStore() {
  const pinia = getActivePinia() as any
  return pinia?._s.get('systemStore')
}
