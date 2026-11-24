import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// get获取菜单列表
export function fetchGetMenuList($url: string) {
  return request.get<AppRouteRecord[]>({
    url: $url
  })
}
