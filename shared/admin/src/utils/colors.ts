/**
 * 颜色工具（共享版）
 *
 * 只保留图表/共享组件真正用到的纯函数，不依赖基座 store。
 * 基座原版的 setElementThemeColor 等写主题的逻辑留在基座侧，不进共享包。
 *
 * @module @admin/utils/colors
 */

interface RgbaResult {
  red: number
  green: number
  blue: number
  rgba: string
}

/** 获取 CSS 变量值 */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name)
}

/** 验证 hex 颜色格式 */
function isValidHexColor(hex: string): boolean {
  const cleanHex = hex.trim().replace(/^#/, '')
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)
}

/** hex 转 rgba */
export function hexToRgba(hex: string, opacity: number): RgbaResult {
  if (!isValidHexColor(hex)) {
    throw new Error('Invalid hex color format')
  }

  let cleanHex = hex.trim().replace(/^#/, '').toUpperCase()
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char.repeat(2))
      .join('')
  }

  const [red, green, blue] = cleanHex.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  const validOpacity = Math.max(0, Math.min(1, opacity))
  const rgba = `rgba(${red}, ${green}, ${blue}, ${validOpacity.toFixed(2)})`

  return { red, green, blue, rgba }
}
