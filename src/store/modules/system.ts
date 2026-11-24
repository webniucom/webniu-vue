/**
 * 系统全局配置状态管理模块
 *
 * 管理系统的全局配置，包括系统信息、主题列表、菜单布局列表等
 *
 * ## 主要功能
 *
 * - 系统信息管理（系统名称、logo 等）
 * - 系统主题列表管理
 * - 菜单布局列表管理
 * - 菜单主题列表管理
 * - 系统主色列表管理
 * - 远程配置加载和持久化
 *
 * ## 持久化
 *
 * - 使用 localStorage 存储
 * - 存储键：system
 * - 支持跨版本数据迁移
 *
 * @module store/modules/system
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SYSTEM_DEFAULT_CONFIG } from '@/config/system'
/**
 * 系统全局配置状态管理
 * 管理应用的全局配置信息
 */
export const useSystemStore = defineStore(
  'systemStore',
  () => {
    const systemConfig = ref<any>(SYSTEM_DEFAULT_CONFIG)
    const updateSystemConfig = (config: any) => {
      systemConfig.value = { ...systemConfig.value, ...config }
    }
    const resetSystemConfig = () => {
      systemConfig.value = SYSTEM_DEFAULT_CONFIG
    }
    return {
      systemConfig,
      updateSystemConfig,
      resetSystemConfig
    }
  },
  {
    persist: {
      key: 'system',
      storage: localStorage
    }
  }
)
