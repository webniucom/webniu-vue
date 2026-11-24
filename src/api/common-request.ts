import request from '@/utils/http'

interface RequestOptions {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  headers?: Record<string, string>
  [key: string]: any // 支持其他额外配置
}
/**
 * 通用 GET 请求
 * @param url 请求地址
 * @param params 请求参数（可选）
 * @param options 其他配置选项（可选）
 */
export function get<T = any>(url: string, params?: Record<string, any>, options?: RequestOptions) {
  return request.get<T>({
    url,
    params,
    ...options
  })
}

/**
 * 通用 POST 请求
 * @param url 请求地址
 * @param data 请求数据（可选）
 * @param options 其他配置选项（可选）
 */
export function post<T = any>(url: string, data?: Record<string, any>, options?: RequestOptions) {
  return request.post<T>({
    url,
    params: data,
    ...options
  })
}

/**
 * 通用 PUT 请求
 * @param url 请求地址
 * @param data 请求数据（可选）
 * @param options 其他配置选项（可选）
 */
export function put<T = any>(url: string, data?: Record<string, any>, options?: RequestOptions) {
  return request.put<T>({
    url,
    params: data,
    ...options
  })
}

/**
 * 通用 DELETE 请求
 * @param url 请求地址
 * @param params 请求参数（可选）
 * @param options 其他配置选项（可选）
 */
export function del<T = any>(url: string, params?: Record<string, any>, options?: RequestOptions) {
  return request.post<T>({
    url,
    params,
    ...options
  })
}
