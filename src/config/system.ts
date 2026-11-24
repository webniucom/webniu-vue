/**
 * 系统设置默认值配置
 */

/**
 * 系统设置默认值配置
 */
export const SYSTEM_DEFAULT_CONFIG = {
  systemInfo: {
    title: 'Webniu 网牛引擎',
    name: 'Webniu 网牛引擎',
    description: '基于webman框架开发的后台管理系统',
    logo: '',
    favicon: '',
    copyright: 'Powered by webniu.com © 2010-2026.',
    footerTxt: '一款兼具设计美学与高效开发的后台系统',
    version: '',
    signature: 'webniu',
    ipcbeian: ''
  },
  systemSetting: {
    isRegister: true,
    isCaptcha: true,
    forgetPassword: true,
    isInstall: false
  },
  systemPath: {
    menuList: '/webniu/admin/rule/menulist'
  }
}

/**
 * 获取设置默认值
 * @returns 设置默认值对象
 */
export function getSystemDefaults() {
  return { ...SYSTEM_DEFAULT_CONFIG }
}

/**
 * 重置为默认设置
 * @param currentSettings 当前设置对象
 */
export function resetToSystemDefaults(currentSettings: Record<string, any>) {
  const defaults = getSystemDefaults()
  Object.keys(defaults).forEach((key) => {
    if (key in currentSettings) {
      currentSettings[key] = defaults[key as keyof typeof defaults]
    }
  })
}
