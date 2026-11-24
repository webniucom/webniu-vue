/**
 * 表格列表逻辑（共享包轻量版）
 *
 * 背景：插件子应用页面沿用 1.2 的 `useTable({ core: {...} })` 写法，
 * 但基座那份 useTable 依赖缓存 / ohash / i18n / 全局 Api 类型，不适合塞进共享包。
 *
 * 这里只保留列表页真正需要的 API 子集，签名与 `src/hooks/core/useTable.ts` 一致，
 * 页面只需换 import 即可，业务代码零改动：
 *   columns / columnChecks / data / loading / pagination
 *   getData / refreshUpdate / refreshData
 *   replaceSearchParams / resetSearchParams
 *   handleSizeChange / handleCurrentChange
 *
 * 零第三方依赖，基座与所有子应用共用同一份实现。
 */
import { computed, isRef, ref } from 'vue'

/** 表格列配置（结构对齐基座 @/types/component 的 ColumnOption） */
export interface ColumnOption<T = any> {
  type?: 'selection' | 'expand' | 'index' | 'globalIndex'
  prop?: string
  label?: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  visible?: boolean
  checked?: boolean
  formatter?: (row: T) => any
  useSlot?: boolean
  slotName?: string
  useHeaderSlot?: boolean
  headerSlotName?: string
  [key: string]: any
}

type ApiFn = (params?: any) => Promise<any>

export interface UseWnTableConfig<T = any> {
  core: {
    apiFn: ApiFn
    apiParams?: Record<string, any>
    excludeParams?: string[]
    /** 是否立即加载，默认 true */
    immediate?: boolean
    columnsFactory: () => ColumnOption<T>[]
    /** 分页参数名映射，后端用 page/limit 时传入 */
    paginationKey?: {
      current?: string
      size?: string
    }
  }
  transform?: {
    dataTransformer?: (rows: T[]) => T[]
  }
  performance?: {
    /** 兼容基座配置，本实现不缓存 */
    enableCache?: boolean
    cacheTime?: number
    debounceTime?: number
  }
}

/** 后端列表响应的列表字段（按优先级探测，对齐基座 tableConfig） */
const RECORD_FIELDS = ['list', 'records', 'rows', 'items', 'result', 'data']
const TOTAL_FIELDS = ['total', 'count']

/** 特殊列（多选 / 展开 / 序号）的固定标题与内部 key */
const SPECIAL_COLUMNS: Record<string, string> = {
  selection: '勾选列',
  expand: '展开行',
  index: '序号'
}

function pickTotal(raw: any, fallback: number): number {
  for (const field of TOTAL_FIELDS) {
    const value = raw?.[field]
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return fallback
}

/**
 * 解析列表响应
 * 兼容 { records, total }（webman Crud 默认）/{ list, total }/直接返回数组
 */
function parseResponse(raw: any): { rows: any[]; total: number } {
  if (Array.isArray(raw)) return { rows: raw, total: raw.length }
  for (const field of RECORD_FIELDS) {
    if (Array.isArray(raw?.[field])) return { rows: raw[field], total: pickTotal(raw, raw[field].length) }
  }
  return { rows: [], total: 0 }
}

/** 把列工厂结果转成带可见状态的列清单 */
function toColumnChecks<T>(columns: ColumnOption<T>[]): ColumnOption<T>[] {
  return columns.map((col) => {
    const specialLabel = col.type ? SPECIAL_COLUMNS[col.type] : undefined
    if (specialLabel) {
      return { ...col, prop: `__${col.type}__`, label: specialLabel, visible: true }
    }
    const visible = col.visible !== undefined ? col.visible : col.checked !== false
    return { ...col, visible }
  })
}

export function useWnTable<T = any>(config: UseWnTableConfig<T>) {
  const { core, transform } = config
  const currentKey = core.paginationKey?.current || 'current'
  const sizeKey = core.paginationKey?.size || 'size'

  /** 全量列（含隐藏），工具栏勾选写的就是这份的 visible */
  const columnChecks = ref<ColumnOption<T>[]>(toColumnChecks(core.columnsFactory()))
  /** 实际渲染列：过滤掉被隐藏的 */
  const columns = computed(() => columnChecks.value.filter((col) => col.visible !== false))

  const data = ref<T[]>([]) as any
  const loading = ref(false)
  const pagination = ref({ current: 1, size: 10, total: 0 })

  /** 搜索栏提交的额外参数（与 apiParams 合并） */
  let extraParams: Record<string, any> = {}

  /** 拉取当前页数据 */
  async function getData(): Promise<void> {
    loading.value = true
    try {
      // 展开 apiParams 并解包其中可能的 ref/computed 值
      const resolvedApiParams: Record<string, any> = {}
      const rawApiParams = core.apiParams || {}
      Object.keys(rawApiParams).forEach((key) => {
        const v = (rawApiParams as any)[key]
        resolvedApiParams[key] = isRef(v) ? v.value : v
      })
      const params: Record<string, any> = {
        ...resolvedApiParams,
        ...extraParams,
        [currentKey]: pagination.value.current,
        [sizeKey]: pagination.value.size
      }
      if (core.excludeParams) {
        core.excludeParams.forEach((key) => delete params[key])
      }
      // 去掉空值，避免后端把空字符串当查询条件
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) delete params[key]
      })

      const raw = await core.apiFn(params)
      const { rows, total } = parseResponse(raw)
      data.value = transform?.dataTransformer ? transform.dataTransformer(rows) : rows
      pagination.value.total = total
    } finally {
      loading.value = false
    }
  }

  /** 保持当前页刷新（新增/删除后使用） */
  function refreshUpdate(): Promise<void> {
    return getData()
  }

  /** 回到第一页刷新（工具栏刷新按钮使用） */
  function refreshData(): Promise<void> {
    pagination.value.current = 1
    return getData()
  }

  /** 搜索条件变更 */
  function replaceSearchParams(params: Record<string, any>): void {
    extraParams = { ...params }
    pagination.value.current = 1
  }

  /** 重置搜索条件并刷新 */
  function resetSearchParams(): Promise<void> {
    extraParams = {}
    pagination.value.current = 1
    return getData()
  }

  function handleSizeChange(size: number): void {
    pagination.value.size = size
    pagination.value.current = 1
    getData()
  }

  function handleCurrentChange(current: number): void {
    pagination.value.current = current
    getData()
  }

  /** 重建列配置（重新执行 columnsFactory，恢复默认显隐） */
  function resetColumns(): void {
    columnChecks.value = toColumnChecks(core.columnsFactory())
  }

  if (core.immediate !== false) {
    getData()
  }

  return {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    refreshUpdate,
    refreshData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    resetColumns
  }
}
