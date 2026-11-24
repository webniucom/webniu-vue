import { useSystemStore } from '@/store/modules/system'
import { fetchGetSiteConfig } from '@/api/auth'
import { SYSTEM_DEFAULT_CONFIG } from '@/config/system'
import { useUserStore } from '@/store/modules/user'
import { updateSettingDefaultsFromRemote } from '@/config/setting'

let initPromise: Promise<void> | null = null
/**
 * 初始化系统配置
 */
export async function initSystemConfig() {
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      const systemStore = useSystemStore()
      const isInstalled = await fetchGetSiteConfig()
      // 未安装时清空本地登录态。
      // 第二个参数 skipNavigation=true：此处早于 initRouter(app) 执行，路由守卫尚未注册，
      // 若在这里 push 会抢占初始导航，导致 beforeEach 里的安装向导跳转彻底失效。
      if (!isInstalled.systemSetting.isInstall) {
        const userStore = useUserStore()
        userStore.logOut(true, true)
      }
      systemStore.updateSystemConfig(isInstalled)
      updateSettingDefaultsFromRemote(isInstalled)
    } catch (error: any) {
      const systemStore = useSystemStore()
      systemStore.updateSystemConfig(SYSTEM_DEFAULT_CONFIG)
      return error
    }
  })()

  return initPromise
}
