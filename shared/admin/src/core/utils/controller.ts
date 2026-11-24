/**
 * 后端控制器路径 → URL 路径
 *
 * webman 的 URL 规律：plugin/{插件}/app/admin/controller/{Xxx}Controller
 *                  → /{插件}/admin/xxx
 *
 * 例子：
 *   plugin\webniu\app\admin\controller\ArticleController → /webniu/admin/article
 *   plugin\devs\app\admin\controller\ModelController     → /devs/admin/model
 *   plugin\webniu\app\mobile\controller\IndexController → /webniu/mobile/index
 *
 * 纯函数，零依赖，基座和子应用均可直接 import 使用。
 */
export function convertControllerToUrl(controllerPath: string): string {
  if (!controllerPath) return ''
  // 去除 plugin\ 前缀
  let path = controllerPath.replace(/^plugin\\/, '')
  // 去除 \app\ 部分
  path = path.replace(/\\app\\/, '\\')
  // 去除 \controller\ 部分
  path = path.replace(/\\controller\\/, '\\')
  // 将控制器名的 Controller 后缀去掉
  path = path.replace(/Controller$/, '')
  // 将反斜杠转换为斜杠
  path = path.replace(/\\/g, '/')
  // 转换为小写
  path = path.toLowerCase()
  // 确保以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return path
}

/**
 * 带 /app 前缀的完整后台 API 前缀
 * 因为子应用前端在任何 URL 下运行时，后端都挂在 /app/ 下（由 webman 插件路由决定）
 */
export function toAdminApiUrl(controllerPath: string): string {
  const url = convertControllerToUrl(controllerPath)
  return url ? `${url}` : ''
}
