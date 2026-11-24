/**
 * @admin 内置请求封装
 *
 * webman 后台接口统一挂在 /app/<plugin>/... 下，鉴权走 session cookie（不是 Bearer token），
 * 所以必须带 credentials: 'include'。直接返回接口的 data 字段（webman Crud 约定 code=200 为成功）。
 */
const API_PREFIX = '/app'

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

function buildUrl(path: string, params?: Record<string, any>): string {
  // http(s) 绝对地址直接透传，避免拼出 /apphttp:// 这类错误地址
  const url = /^https?:\/\//.test(path)
    ? path
    : API_PREFIX + (path.startsWith('/') ? path : `/${path}`)
  if (!params) return url

  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.append(key, String(value))
  })
  const qs = query.toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

/** GET 请求 */
export async function get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  // 显式声明 Accept: application/json，让后端 401 时走 JSON 分支（返回 {"code":401,"msg":"请登录"}）
  // 否则 webman 会返回 <script>top.location.href=...</script> 的 HTML，前端解析 JSON 失败，
  // 真实原因（未登录）会被误报成「响应解析失败」
  const res = await fetch(buildUrl(path, params), {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  })
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null
  if (!json) throw new Error('响应解析失败（可能未登录）')
  if (json.code !== 200) throw new Error(json.msg || `请求失败(${json.code})`)
  return json.data
}

/**
 * POST 请求：JSON body 提交，与基座 axios 封装的实际报文格式一致，
 * webman Crud 基类 $request->post() 可直接读取（支持数组字段如 id: [1,2]）。
 */
export async function post<T = any>(path: string, data?: Record<string, any>): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data || {})
  })
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null
  if (!json) throw new Error('响应解析失败（可能未登录）')
  if (json.code !== 200) throw new Error(json.msg || `请求失败(${json.code})`)
  return json.data
}

/**
 * 删除请求
 *
 * webman Crud 的 delete 接口同样走 POST + body（基座 common-request.del 即此实现），
 * 这里直接复用 post，保证两端行为一致。
 */
export const del = post
