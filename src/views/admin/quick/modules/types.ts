import type { AppRouteRecord } from '@/types/router'
/**
 * 菜单表单数据类型定义
 */
export interface MenuFormData {
  id: number
  pid: number
  type: number
  title: string
  description?: string
  name: string
  icon: string
  path: string
  key: string
  href: string
  component: string
  link: string
  isBlank: boolean
  showBadge: boolean
  showTextBadge: string
  authMark: string
  isEnable: boolean
  isFullPage: boolean
  isHide: boolean
  isHideTab: boolean
  isIframe: boolean
  keepAlive: boolean
  fixedTab: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

/**
 * 菜单对话框 Props 类型
 */
export interface MenuDialogProps {
  visible: boolean
  editData?: AppRouteRecord | any
  type?: number
  pid?: number
  lockType?: boolean
  data?: any[]
}

/**
 * 菜单对话框 Emits 类型
 */
export interface MenuDialogEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: MenuFormData): void
}
