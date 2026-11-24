<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <Search v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></Search>
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
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="showDialog('insert')"
                  v-ripple
                  >新增{{ config.title }}</ElButton
                >
                <ElButton
                  type="success"
                  class="h-8!"
                  :loading="syncLoading"
                  @click="syncMenu"
                  v-ripple
                  plain
                >
                  同步菜单
                </ElButton>
                <ElButton
                  v-if="selectedRows.length > 0"
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDelete"
                  v-ripple
                  plain
                  >删除{{ config.title }}</ElButton
                >
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
    <!-- 配置弹窗 -->
    <Dialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :editData="currentData"
      :title="config.title"
      :data="data"
      :loading="loading"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  defineOptions({ name: 'Menus' })
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const loadings = ref(false)

  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  const ENABLE_API = url + '/enable'
  const SYNC_API = url + '/sync'
  // config
  const config = ref<any>({
    title: '菜单',
    layout: 'refresh',
    url: url
  })
  const selectedRows = ref<any>([])
  // 同步按钮 loading 态（同步过程中禁用按钮，避免重复点击）
  const syncLoading = ref(false)

  // 搜索参数
  const searchForm = ref<any>({
    title: ''
  })
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()

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
    refreshUpdate,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams,
    refreshData
    //resetColumns
  } = useWnTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'desc',
        field: 'id'
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          label: '菜单标题',
          prop: 'title'
        },
        {
          label: '菜单类型',
          prop: 'menutype',
          formatter: (row: any) => {
            return row.menutype === 1 ? '个性化菜单' : '普通菜单'
          }
        },
        {
          prop: 'enable',
          label: '启用',
          width: 100,
          align: 'left',
          formatter: (row: any) => {
            return h(ElTag, { type: row.enable === 1 ? 'success' : 'danger' }, () =>
              row.enable === 1 ? '启用' : '无'
            )
          }
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          align: 'left',
          formatter: (row: any) => {
            return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
          }
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
                type: 'add',
                vAuth: 'update',
                title: row.enable === 1 ? '禁用' : '启用',
                icon: row.enable === 1 ? 'ri:pause-circle-line' : 'ri:send-plane-line',
                onClick: () => showDialog('enable', row)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                title: '编辑',
                onClick: () => showDialog('update', row)
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
    // 数据处理
    transform: {
      dataTransformer: (records: any) => {
        return records
      }
    }
  })
  // 打开弹窗添加or编辑
  const showDialog = async (type: string, row?: any): Promise<void> => {
    if (type === 'enable') {
      try {
        await post(ENABLE_API, {
          id: row.id,
          enable: row.enable === 1 ? 0 : 1
        })
        ElMessage.success('操作成功')
        refreshUpdate()
      } catch (error) {
        ElMessage.error('操作失败' + error)
      }
      return
    }
    dialogType.value = type
    currentData.value = row || {}
    dialogVisible.value = true
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

  /**
   * 提交处理
   * @param data 数据
   */
  const handleSubmit = async (data: any): Promise<void> => {
    await post(dialogType.value === 'insert' ? INSERT_API : UPDATE_API, data)
    dialogVisible.value = false
    currentData.value = {}
    ElMessage.success(dialogType.value === 'insert' ? '添加成功' : '更新成功')
    if (dialogType.value === 'update') {
      refreshUpdate()
    } else {
      getData()
    }
  }

  /**
   * 同步微信端菜单到本地
   * - 弹确认框 → 调 /sync 接口 → 刷新列表
   * - 后端会调 /cgi-bin/menu/get 拉取当前公众号菜单覆盖本地
   */
  const syncMenu = async () => {
    try {
      await ElMessageBox.confirm(
        '同步操作会从微信端拉取当前菜单覆盖本地记录，是否继续？',
        '同步确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
    syncLoading.value = true
    try {
      const res: any = await get(SYNC_API)
      // axios 拦截器返回的就是 data 字段，所以 res 已经是 {inserted, updated, total, has_more, ...}
      const inserted = Number(res?.inserted ?? 0)
      const updated = Number(res?.updated ?? 0)
      const total = Number(res?.total ?? inserted + updated)
      ElMessage.success(`同步完成：共 ${total} 条，新增 ${inserted}，更新 ${updated}`)
      getData()
    } catch (error: any) {
      ElMessage.error('同步失败：' + (error?.message || '未知错误'))
    } finally {
      syncLoading.value = false
    }
  }
  // 初始化默认选中第一个分组
  onMounted(async () => {
    try {
      loadings.value = true
      layout.value = config.value.layout || 'refresh'
      // 初始化表格数据
      nextTick(() => {
        getData()
        loadings.value = false
      })
      // 处理成功逻辑
    } catch (error) {
      ElMessage.error('加载配置失败')
      loadings.value = false
      console.error(error)
    }
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
