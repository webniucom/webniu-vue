import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url:
      __Login__ === '{{ $login_url }}' || __Login__ === ''
        ? '/webniu/admin/account/login'
        : __Login__,
    params
    // showSuccessMessage: true // 显示成功消息
    // showErrorMessage: false // 不显示错误消息
  })
}
/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: __Info__ === '{{ $info_url }}' || __Info__ === '' ? '/webniu/admin/account/info' : __Info__
    // 自定义请求头
    // headers: {
    //   'X-Custom-Header': 'your-custom-value'
    // }
  })
}

/**
 * 获取站点基础配置
 * @returns 站点基础配置
 */
export function fetchGetSiteConfig() {
  return request.get<Api.asyncSystem.SiteConfig>({
    url:
      __Config__ === '{{ $confit_url }}' || __Config__ === '' ? '/webniu/admin/config' : __Config__
    // 自定义请求头
    // headers: {
    //   'X-Custom-Header': 'your-custom-value'
    // }
  })
}
