<!-- 二维码扫码记录列表 -->
<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <div class="search-row">
          <Search
            v-model="searchForm"
            :formItems="searchFormItems"
            @search="handleSearch"
            @reset="resetSearchParams"
          ></Search>
        </div>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader
            v-model:columns="columnChecks"
            :layout="layout"
            :loading="loading"
            @refresh="refreshData"
          >
            <template #left>
              <ElSpace wrap>
                <ElButton
                  v-if="selectedRows.length > 0"
                  type="danger"
                  class="h-8!"
                  @click="allDelete"
                  v-ripple
                  plain
                  >删除{{ config.title }}</ElButton
                >
                <ElButton class="h-8!" @click="goBack" v-ripple> 关闭并返回 </ElButton>
              </ElSpace>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable
            ref="tableRef"
            rowKey="id"
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :default-expand-all="false"
            @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import Search from './modules/search.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  defineOptions({ name: 'qrcodescenes' })

  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)

  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({
    title: '记录',
    layout: 'refresh',
    url: url
  })
  const selectedRows = ref<any>([])

  // 当前查看的二维码 ticket（路由动态段 :id 传入）
  // 用于 fetchGetList 给后端按 ticket 过滤扫码记录
  const currentTicket = ref<string>('')

  // 搜索参数
  const searchForm = ref<any>({
    keyword: '',
    openid: ''
  })
  const searchFormItems = ref<any>([
    {
      label: '关键字',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '请输入关键字',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: 'OpenID',
      key: 'openid',
      type: 'input',
      props: {
        placeholder: '请输入OpenID',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    }
  ])
  const layout = ref('refresh')
  const loadings = ref(false)

  //加载数据列表
  // 路由 path = qrcodescenes/:id（动态段），跳转通过 params.id 传入 ticket，
  // currentTicket 在 initPageMode 阶段已从 route.params.id 注入
  const fetchGetList = (params: any) => {
    return get(SELECT_API, { ...params, ticket: currentTicket.value })
  }
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    refreshUpdate,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams,
    refreshData
  } = useWnTable<any>({
    core: {
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'desc',
        field: 'id'
      },
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          label: '场景',
          prop: 'scenes'
        },
        {
          label: '关键字',
          prop: 'keyword'
        },
        {
          label: 'OpenID',
          prop: 'openid'
        },
        {
          label: '扫码次数',
          prop: 'nums'
        },
        {
          label: '创建时间',
          prop: 'created_at'
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          width: 180,
          align: 'right',
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                title: '查看',
                onClick: () => showDialog('view', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
                title: '删除',
                class: '!mr-0',
                onClick: () => deleteItem(row)
              })
            ])
        }
      ]
    },
    transform: {
      dataTransformer: (records: any) => {
        return records
      }
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }
  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: any): void => {
    selectedRows.value = selection
  }

  // 打开弹窗查看详情
  const showDialog = (type: string, row?: any) => {
    if (type === 'view') {
      console.log(row)
    }
  }

  /**
   * 初始化：从 route.params.id 取 ticket 注入 currentTicket
   * 缺失时 toast 警告并阻止 getData 跑（避免后端按空 ticket 返回空集浪费时间）
   */
  const initPageMode = () => {
    currentTicket.value = (route.params.id as string) || ''
    if (!currentTicket.value) {
      ElMessage.warning('缺少 ticket 参数，无法加载扫码记录')
    }
  }

  /**
   * 返回：先关闭当前 tab，removeTab 内部会自动把激活 tab 切到相邻的那个
   * （即二维码列表），不需要再手动 router.push 跳转
   */
  const goBack = () => {
  }

  // 删除单条数据
  const deleteItem = async (row: any) => {
    ElMessageBox.confirm(`确定要删除选中的数据吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: row.id })
        ElMessage.success('删除成功')
        refreshUpdate()
      })
      .catch(() => {
        return
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

  window.scrollTo({ top: 0 })

  onMounted(() => {
    window.scrollTo({ top: 0 })
    // 先把 ticket 从路由取出来注入响应式变量，再触发列表加载
    initPageMode()
    loadings.value = true
    layout.value = config.value.layout || 'refresh'
    nextTick(() => {
      getData()
      loadings.value = false
    })
  })
</script>
<style scoped>
  :deep(.smsdialog .dialog-body) {
    padding: 0 !important;
  }
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
