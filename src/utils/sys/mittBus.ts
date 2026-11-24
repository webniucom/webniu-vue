/**
 * 转发导出：真正的 mittBus 实例来自 @admin/core/sys/mittBus。
 * 但共享包只定义了通用事件类型（WnBusEvents），
 * 壳子专属的 UI 事件（triggerFireworks / openSetting / openChat 等）
 * 在本地重新扩展类型映射，保持既有代码 `import mittBus from '@/utils/sys/mittBus'` 可用。
 */
import { mittBus as base } from '@admin/core/sys/mittBus'

// 壳子专属事件（共享包不包含，子应用不需要）
type Events = {
  triggerFireworks: string | undefined
  openSetting: void
  openSearchDialog: void
  openChat: void
  openLockScreen: void
}

// 合并类型 + 保持同一个 mitt 实例引用
export default base as typeof base & { on: <K extends keyof Events>(type: K, handler: (payload: Events[K]) => void) => void }
