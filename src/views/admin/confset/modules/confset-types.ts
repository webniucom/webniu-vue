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
  name: string
  label: string
  sort: number
  model?: ModelType
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
  model: ModelType
  name: string
  label: string
  label_width: number
  desc: string
  type: ComponentType
  dict: string
  key: string
  value: string
  span: number
  sort: number
  hidden: number
  props: string
  status: number
  disabled: number
  options: { label: string; value: string }[]
}

// 配置选项
export interface ConfsetOption {
  label: string
  value: string
}
