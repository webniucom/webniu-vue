/* ==========================================
   Upload 页面专用类型定义
   ========================================== */

// 分组对话框类型
export type GroupDialogType = 'groupinsert' | 'groupupdate'

// 分组类型
export interface GroupItem {
  id: number
  name: string
  label: string
  sort: number
}

// 搜索表单类型
export interface SearchForm {
  name?: string
  ext?: string
  createdAt?: string
}
// 组件类型
export type ComponentType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'upload'
  | 'file'
  | 'editor'

// 配置项类型
export interface FormData {
  id: string | number
  model: string
  title: string
  label: string
  type: string
  sort: number
  desc: string
  field: string
  value: string
  status: number
  options: { title: string; value: string }[]
}

// 配置选项
export interface ConfsetOption {
  title: string
  value: string
}
