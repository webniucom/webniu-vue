<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      @reset="resetSearchParams"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        layout="refresh"
        v-model:columns="columnChecks"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'insert'" type="primary" class="h-8!" @click="handleAddMenu" v-ripple>
              添加入口
            </ElButton>
            <ElButton
              v-if="selectedRows.length > 0"
              v-auth="'delete'"
              type="danger"
              class="h-8!"
              @click="allDelete"
              v-ripple
              plain
              >删除数据</ElButton
            >
          </ElSpace>
        </template>
      </ArtTableHeader>
      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :default-expand-all="false"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
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
      <Dialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :pid="pid"
        :lockType="lockMenuType"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import type { AppRouteRecord } from '@/types/router'
  import Dialog from './modules/dialog.vue'
  import { ElTag, ElMessageBox, ElTooltip, ElIcon } from 'element-plus'
  import { post, del, get } from '@/api/common-request'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'

  defineOptions({ name: 'Rule' })
  // 路由参数
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)

  // 状态管理
  const tableRef = ref()

  // 弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<number>(1)
  const editData = ref<AppRouteRecord | any>(null)
  const lockMenuType = ref(false)
  const pid = ref<number>(0)
  const selectedRows = ref<any>([])

  // API 相关
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'

  // 搜索相关
  const initialSearchState = {
    title: '',
    path: '',
    username: ''
  }

  const formFilters = reactive({ ...initialSearchState })

  const formItems = computed(() => [
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
    },
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      props: { clearable: true }
    }
  ])

  onMounted(() => {
    getData()
  })

  //加载数据列表
  const fetchGetList = (params: any) => {
    return get(SELECT_API, params)
  }
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams,
    refreshData,
    refreshUpdate
    //resetColumns
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'asc',
        field: 'sort'
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          prop: 'title',
          label: '菜单名称',
          minWidth: 60,
          formatter: (row: any) => formatMenuTitle(row.title)
        },
        {
          prop: 'icon',
          label: '菜单图标',
          align: 'center',
          formatter: (row: any) => {
            if (row.icon === null) return '-'
            return h(ArtSvgIcon, { icon: row.icon || '', class: 'text-xl' })
          }
        },
        {
          prop: 'type',
          label: '菜单类型',
          formatter: (row: any) => {
            return h(ElTag, { type: getMenuTypeTag(row) }, () => getMenuTypeText(row))
          }
        },
        {
          prop: 'path',
          label: '路由',
          showOverflowTooltip: true,
          formatter: (row: any) => {
            if (row.type === 2) return '-'
            return row.link || row.path || '-'
          }
        },
        {
          prop: 'username',
          label: '所属账户',
          minWidth: 60,
          formatter: (row: any) => formatMenuTitle(row.username)
        },
        {
          prop: 'sort',
          label: '排序',
          useHeaderSlot: true,
          sortable: false,
          formatter: (row: any) => {
            return row.sort || '0'
          }
        },
        {
          prop: 'is_login_jump',
          label: '登录跳转',
          formatter: (row: any) => {
            return row.is_login_jump === 1 ? '是' : '-'
          }
        },
        {
          prop: 'is_enable',
          label: '状态',
          width: 70,
          align: 'center',
          formatter: (row: any) => {
            return h(ElTag, { type: row.is_enable === 1 ? 'success' : 'danger' }, () =>
              row.is_enable === 1 ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'operation',
          label: '操作',
          align: 'right',
          formatter: (row: any) => {
            const buttonStyle = { style: 'text-align: right' }

            return h('div', buttonStyle, [
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
      ]
    },
    // 数据处理
    transform: {
      dataTransformer: (records: any) => {
        return records
      }
    }
  })

  /**
   * 获取菜单类型标签颜色
   * @param row 菜单行数据
   * @returns 标签颜色类型
   */
  const getMenuTypeTag = (row: any): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    if (row.type === 2) return 'danger'
    if (row.type === 0) return 'info'
    if (row.link && row.isIframe) return 'success'
    if (row.type === 1) return 'primary'
    if (row.type === 3) return 'warning'
    return 'info'
  }

  /**
   * 获取菜单类型文本
   * @param row 菜单行数据
   * @returns 菜单类型文本
   */
  const getMenuTypeText = (row: any): string => {
    if (row.type === 2) return '按钮'
    if (row.type === 0) return '目录'
    if (row.link && row.isIframe) return '内嵌'
    if (row.type === 1) return '菜单'
    if (row.type === 3) return '外链'
    return '未知'
  }

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: any = {}): void => {
    console.log(params)
    replaceSearchParams(params)
    getData()
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: any): void => {
    selectedRows.value = selection
  }

  /**
   * 添加菜单
   */
  const handleAddMenu = (row: AppRouteRecord | any): void => {
    dialogType.value = row.meta?.type || 1
    editData.value = null
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
      getData()
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
          getData()
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
  // 删除多个数据
  const allDelete = async () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请选择要删除的数据')
      return
    }
    ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个数据吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: selectedRows.value.map((item: any) => item.id) })
        ElMessage.success('删除成功')
        refreshUpdate()
      })
      .catch(() => {
        return
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
