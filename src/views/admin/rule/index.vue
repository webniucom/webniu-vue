<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        layout="refresh,columns"
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'insert'" type="primary" class="h-8!" @click="handleAddMenu" v-ripple>
            添加菜单
          </ElButton>
          <ElButton @click="toggleExpand" class="h-8!" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      >
        <!-- 自定义用户信息表头 -->
        <template #sort-header="{ column }">
          <div class="flex-c gap-1">
            <span>{{ column.label }}</span>
            <ElTooltip content="排序字段,数值越大越靠前" placement="top">
              <ElIcon>
                <QuestionFilled />
              </ElIcon>
            </ElTooltip>
          </div>
        </template>
      </ArtTable>
      <!-- 菜单弹窗 -->
      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :pid="pid"
        :lockType="lockMenuType"
        @submit="handleSubmit"
        :data="tableData"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import type { AppRouteRecord } from '@/types/router'
  import MenuDialog from './modules/menu-dialog.vue'
  import { ElTag, ElMessageBox, ElTooltip, ElIcon } from 'element-plus'
  import { post, del, get } from '@/api/common-request'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import { useMenuStore } from '@/store/modules/menu'
  import { MenuProcessor } from '@/router/core/MenuProcessor'

  defineOptions({ name: 'Rule' })

  //菜单列表
  const menuStore = useMenuStore()
  const menuProcessor = new MenuProcessor()
  async function refreshMenus() {
    const menuList = await menuProcessor.getMenuList()
    menuStore.setMenuList(menuList)
  }

  // 状态管理
  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()
  const SearchModel = ref('webniu')

  // 弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<number>(0)
  const editData = ref<AppRouteRecord | any>(null)
  const lockMenuType = ref(false)
  const pid = ref<number>(0)

  // API 相关
  const UPDATE_API = '/webniu/admin/rule/update'
  const INSERT_API = '/webniu/admin/rule/insert'
  const SELECT_API = '/webniu/admin/rule/select'
  const DELETE_API = '/webniu/admin/rule/delete'

  // 搜索相关
  const initialSearchState = {
    model: SearchModel.value,
    title: '',
    path: ''
  }

  const formFilters = reactive({ ...initialSearchState })
  const appliedFilters = reactive({ ...initialSearchState })

  const formItems = computed(() => [
    {
      label: '菜单模型',
      key: 'model',
      type: 'select',
      props: {
        clearable: false,
        options: [
          { label: '网牛引擎', value: 'webniu' },
          { label: '微信公众号', value: 'wechat' },
          { label: '微信小程序', value: 'wxapp' },
          { label: '企业微信', value: 'work' },
          { label: '支付宝平台', value: 'aliapp' },
          { label: '抖音平台', value: 'douyin' },
          { label: '快手平台', value: 'kuaishou' }
        ]
      }
    },
    {
      label: '菜单名称',
      key: 'title',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '路由地址',
      key: 'path',
      type: 'input',
      props: { clearable: true }
    }
  ])

  onMounted(() => {
    getMenuList()
  })

  /**
   * 获取菜单列表数据
   */
  const getMenuList = async (): Promise<void> => {
    loading.value = true
    try {
      const list = await get(SELECT_API, {
        format: 'table_tree',
        type: '0,1,2,3',
        limit: 5000,
        ...appliedFilters
      })
      tableData.value = list
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取菜单失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取菜单类型标签颜色
   * @param row 菜单行数据
   * @returns 标签颜色类型
   */
  const getMenuTypeTag = (
    row: AppRouteRecord
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    if (row.meta?.type === 2) return 'danger'
    if (row.meta?.type === 0) return 'info'
    if (row.meta?.link && row.meta?.isIframe) return 'success'
    if (row.meta?.type === 1) return 'primary'
    if (row.meta?.type === 3) return 'warning'
    return 'info'
  }

  /**
   * 获取菜单类型文本
   * @param row 菜单行数据
   * @returns 菜单类型文本
   */
  const getMenuTypeText = (row: AppRouteRecord): string => {
    if (row.meta?.type === 2) return '按钮'
    if (row.meta?.type === 0) return '目录'
    if (row.meta?.link && row.meta?.isIframe) return '内嵌'
    if (row.meta?.type === 1) return '菜单'
    if (row.meta?.type === 3) return '外链'
    return '未知'
  }

  // 表格列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'meta.title',
      label: '菜单名称',
      minWidth: 120,
      formatter: (row: AppRouteRecord) => formatMenuTitle(row.meta?.title)
    },
    {
      prop: 'meta.icon',
      label: '菜单图标',
      align: 'center',
      formatter: (row: AppRouteRecord) => {
        if (row.meta?.icon === null) return '-'
        return h(ArtSvgIcon, { icon: row.meta?.icon || '', class: 'text-xl' })
      }
    },
    {
      prop: 'type',
      label: '菜单类型',
      formatter: (row: AppRouteRecord) => {
        return h(ElTag, { type: getMenuTypeTag(row) }, () => getMenuTypeText(row))
      }
    },
    {
      prop: 'key',
      label: '控制器/目录',
      showOverflowTooltip: true,
      formatter: (row: AppRouteRecord) => {
        if (row.meta?.type === 2) return '-'
        return row.meta?.key || '-'
      }
    },
    {
      prop: 'path',
      label: '路由',
      showOverflowTooltip: true,
      formatter: (row: AppRouteRecord) => {
        if (row.meta?.type === 2) return '-'
        return row.meta?.link || row.path || '-'
      }
    },
    {
      prop: 'meta.authMark',
      label: '权限标识',
      align: 'center',
      formatter: (row: AppRouteRecord) => {
        if (row.meta?.type === 2) {
          return row.meta?.authMark || '-'
        }
        return '-'
      }
    },
    {
      prop: 'sort',
      label: '排序',
      useHeaderSlot: true,
      sortable: false,
      formatter: (row: AppRouteRecord) => {
        return row.meta?.sort || '0'
      }
    },
    {
      prop: 'date',
      label: '编辑时间',
      showOverflowTooltip: true,
      visible: false,
      formatter: (row: AppRouteRecord) => {
        return row.meta?.updatedAt || ''
      }
    },
    {
      prop: 'isEnable',
      label: '状态',
      formatter: (row: any) => {
        return h(ElTag, { type: row.meta?.isEnable === 1 ? 'success' : 'danger' }, () =>
          row.meta?.isEnable === 1 ? '启用' : '禁用'
        )
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: AppRouteRecord) => {
        const buttonStyle = { style: 'text-align: right' }

        return h('div', buttonStyle, [
          h(ArtButtonTable, {
            type: 'add',
            onClick: () => handleAddMenu(row),
            title: '新增菜单',
            vAuth: 'insert',
            hidden: row.meta?.type === 2
          }),
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => handleEditMenu(row),
            vAuth: 'update'
          }),
          h(ArtButtonTable, {
            type: 'delete',
            class: '!mr-0',
            onClick: () => handleDeleteMenu(row),
            vAuth: 'delete'
          })
        ])
      }
    }
  ])

  // 数据相关
  const tableData = ref<AppRouteRecord[]>([])

  /**
   * 重置搜索条件
   */
  const handleReset = (): void => {
    Object.assign(formFilters, { ...initialSearchState })
    Object.assign(appliedFilters, { ...initialSearchState })
    getMenuList()
  }
  /**
   * 执行搜索
   */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
    getMenuList()
  }

  /**
   * 刷新菜单列表
   */
  const handleRefresh = (): void => {
    getMenuList()
  }

  // 过滤后的表格数据
  const filteredTableData = computed(() => {
    return tableData.value
  })

  // 监听formFilters.model变化
  watch(
    () => formFilters.model,
    (newVal) => {
      if (newVal) {
        appliedFilters.model = newVal
        SearchModel.value = newVal
        getMenuList()
      }
    }
  )

  /**
   * 添加菜单
   */
  const handleAddMenu = (row: any): void => {
    dialogType.value = row.meta?.type || 0
    editData.value = {
      meta: {
        pid: row.id || 0,
        model: SearchModel.value,
        isEnable: 1,
        keepAlive: 1
      }
    }
    if (row.id) {
      pid.value = row.id || 0
    }
    lockMenuType.value = true
    dialogVisible.value = true
  }

  /**
   * 编辑菜单
   * @param row 菜单行数据
   */
  const handleEditMenu = (row: AppRouteRecord | any): void => {
    dialogType.value = row.meta?.type || 0
    editData.value = row
    lockMenuType.value = true
    dialogVisible.value = true
  }

  /**
   * 提交表单数据
   * @param formData 表单数据
   */
  const handleSubmit = async (formData: any): Promise<void> => {
    try {
      await post(formData.id ? UPDATE_API : INSERT_API, formData)
      ElMessage.success(`${formData.id ? '编辑' : '新增'}成功`)
      lockMenuType.value = false
      dialogVisible.value = false
      getMenuList()
      refreshMenus()
    } catch (error: any) {
      return error
    }
  }

  /**
   * 删除菜单
   */
  const handleDeleteMenu = async (row: AppRouteRecord | any): Promise<void> => {
    ElMessageBox.confirm('确定要删除该菜单吗？删除后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        if (row.children?.length && row.meta?.type !== 1) {
          ElMessage.error('该菜单下有子菜单，不能删除')
          return
        }
        try {
          await del(DELETE_API, { id: row.id })
          ElMessage.success('删除成功')
          getMenuList()
        } catch (error) {
          if (error !== 'cancel') {
            ElMessage.error('删除失败')
          }
        }
      })
      .catch(() => {
        ElMessage.info('删除已取消')
      })
  }

  /**
   * 切换展开/收起所有菜单
   */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: AppRouteRecord[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(filteredTableData.value)
      }
    })
  }
</script>
<style scoped lang="scss">
  .my-header-right {
    height: 30px;
    margin-right: 15px;
  }
  /* 自定义 radio-group 尺寸 */
  .my-header-right :deep(.el-radio-button) {
    height: 30px;
    font-size: 12px;
    border-radius: 8px;
  }
  .my-header-right :deep(.el-radio-button__inner) {
    height: 30px;
    line-height: 11px;
    font-size: 12px;
  }
</style>
