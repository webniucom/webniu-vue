/**
 * 上传限制配置（provide/inject 解耦）
 *
 * 共享组件不依赖任何 store / i18n / 全局注册，上传限制（后缀、单文件上限、个数）
 * 通过注入获取：宿主应用（如基座）在 main.ts 里 provide 真实配置，
 * 子应用不提供时自动落到安全默认值，组件 props 里显式传入的值优先级最高。
 */
import { computed, inject, type ComputedRef } from 'vue'

export interface WnUploadLimit {
  /** 允许的后缀/类型串，如 'jpg,jpeg,png' */
  include: string
  /** 单文件大小上限（MB） */
  single_limit: number
  /** 单次最多上传个数 */
  nums: number
}

/** 宿主注入键：值形如 computed(() => systemConfig?.attachMent)
 *  用字符串而非 Symbol——MF 架构下共享包被基座和子应用各自打包，
 *  Symbol 每次执行生成新引用导致 provide/inject 永远匹配不上 */
export const WN_UPLOAD_LIMIT_KEY = 'wnUploadLimit' as const

export const WN_UPLOAD_LIMIT_DEFAULT: WnUploadLimit = {
  include: 'jpg,jpeg,png,gif,bmp,webp,svg',
  single_limit: 10,
  nums: 10
}

/** 组件内部统一从这取配置，保证始终有完整值 */
export function useWnUploadLimit(): ComputedRef<WnUploadLimit> {
  // 显式传默认值 undefined：子应用无 provide 时避免 Vue 开发态 "injection not found" 警告
  const injected = inject<ComputedRef<Partial<WnUploadLimit> | undefined> | undefined>(
    WN_UPLOAD_LIMIT_KEY,
    undefined
  )
  return computed(() => {
    const merged = { ...WN_UPLOAD_LIMIT_DEFAULT, ...(injected?.value || {}) }
    // 后端配置表存的是字符串（如 nums: "10"），ElUpload 的 limit 严格要求 Number，这里统一归一化
    return {
      include: String(merged.include),
      single_limit: Number(merged.single_limit) || WN_UPLOAD_LIMIT_DEFAULT.single_limit,
      nums: Number(merged.nums) || WN_UPLOAD_LIMIT_DEFAULT.nums
    }
  })
}
