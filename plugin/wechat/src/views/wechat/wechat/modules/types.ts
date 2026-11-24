/* ==========================================
    General 页面专用类型定义
   ========================================== */

// 模型类型
export interface FormConfig {
  key: string
  label: string
  type: string
  showlist?: boolean
  search?: boolean
  props?: Record<string, any>
}

export interface IndexConfig {
  grouplist: GroupConfig[]
  form: FormConfig[]
  [key: string]: any
  config: {
    title: string
    layout?: string
    groupname?: string
  }
}

export interface GroupConfig {
  id: string
  label: string
  value: string
  status: number
}

// 分组类型
export interface GroupItem {
  id: number
  value: string
  label: string
  sort: number
  status: number
}

export type FormRules = Record<string, any[]>
