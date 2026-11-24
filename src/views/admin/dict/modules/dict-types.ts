/* ==========================================
   Confset 页面专用类型定义
   ========================================== */

// 模型类型
export type ModelType = 'system' | 'apptem'

// 分组对话框类型
export type GroupDialogType = 'groupinsert' | 'groupupdate'

// 分组类型
export interface GroupItem {
  id: number
  value: string
  label: string
}

// 搜索表单类型
export interface SearchForm {
  label: string
  status?: string
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
  | 'radiogroup'
  | 'checkboxgroup'
  | 'datetime'
  | 'timeselect'
  | 'timepicker'
  | 'switch'
  | 'number'
  | 'rate'
  | 'slider'
  | 'divider'
  | 'treeselect'
  | 'cascader'

// 配置项类型
export interface FormData {
  id: string | number
  pid: number
  group: string
  label: string
  value: string
  sort: number
  disabled: number
  status: number
}

// 配置选项
export interface ConfsetOption {
  label: string
  value: string
}
