/**
 * 微信图片地址处理
 *
 * 微信官方 CDN 图片（公众号头像、素材图等）带防盗链，
 * 前端 <img> 直链会加载失败；这类地址统一走后端代理
 * /app/wechat/account/material/wximg 转输出。
 * 本地/用户自定义上传的地址原样返回。
 */

// 微信官方图片 CDN 域名
const WX_IMG_HOSTS = ['mmbiz.qpic.cn', 'mmbiz.qlogo.cn', 'wx.qlogo.cn']

// 后端图片代理地址
const WX_IMG_PROXY = '/app/wechat/account/material/wximg?url='

/**
 * 判断是否为微信官方 CDN 图片地址
 */
export const isWxImgUrl = (url?: string): boolean => {
  if (!url) return false
  try {
    const { hostname } = new URL(url, window.location.origin)
    return WX_IMG_HOSTS.some((host) => hostname === host || hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

/**
 * 获取可显示的图片地址：微信官方 CDN 走本地代理，其余原样返回
 */
export const wxImgUrl = (url?: string): string => {
  if (!url) return ''
  return isWxImgUrl(url) ? WX_IMG_PROXY + encodeURIComponent(url) : url
}
