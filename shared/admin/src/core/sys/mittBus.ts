/**
 * 全局事件总线
 *
 * 基于 mitt 的类型安全事件总线。跨组件 / 跨子应用通信。
 *
 * MF 下基座和子应用 import 的是同一份 mitt 实例（同一份共享包源码打包），
 * 所以基座 emit 的事件子应用也能收到——这是除 provide/inject 外另一种
 * 基座→子应用 / 子应用→基座的通信通道。
 *
 * 用法：
 *   mittBus.emit('openDevsPanel', { id: 42 })   // 子应用触发基座动作
 *   mittBus.on('openDevsPanel', (payload) => { ... })   // 基座监听
 */
import mitt, { type Emitter } from 'mitt'

/**
 * 事件类型映射（通用部分，基座专属事件留在基座侧扩展）
 * 子应用可以直接 mittBus.emit('xxx', payload) 发任何事件，
 * mitt 的类型安全是可选的——不匹配的事件名 emit/on 也能工作。
 */
export interface WnBusEvents {
  /** 子应用请求基座跳转到某个菜单路径 */
  navigateTo: string
  /** 通用全局通知：基座→子应用或子应用→基座广播 */
  notice: { type: 'info' | 'warn' | 'error' | 'success'; msg: string }
  /** 数据变更广播（刷新列表等场景） */
  dataChanged: { plugin: string; controller: string; action: string }
  /** 子应用请求基座显示 loading */
  loading: boolean
  /** symbol key 兜底（mitt 要求 Record<EventType, unknown>） */
  [key: symbol]: unknown
  /** string key 兜底：任何 string 事件名都能 emit/on */
  [key: string]: any
}

export const mittBus: Emitter<WnBusEvents> = mitt<WnBusEvents>()

export default mittBus
