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
          <!-- 配置弹窗 -->
          <Dialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :editData="currentData"
            :title="config.title"
            :replyTypes="replyTypes"
            :data="data"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick, ref, h } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  defineOptions({ name: 'Reply' })
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const loadings = ref(false)

  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({
    title: '回复',
    layout: 'refresh',
    url: url
  })
  const selectedRows = ref<any>([])

  // 搜索参数
  const searchForm = ref<any>({
    name: '',
    content: ''
  })
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()
  // 回复类型选项
  const replyTypes = ref<any>([
    { id: 0, label: '文本消息', value: 'text', icon: 'ri:file-text-line' },
    { id: 1, label: '图文消息', value: 'news', icon: 'ri:image-edit-line' },
    { id: 2, label: '微信图片', value: 'image', icon: 'ri:image-line' },
    { id: 3, label: '微信音频', value: 'voice', icon: 'ri:music-line' },
    { id: 4, label: '微信视频', value: 'video', icon: 'ri:video-line' },
    { id: 5, label: '应用入口', value: 'apps', icon: 'ri:function-ai-line' }
  ])

  // 应用入口规则：type=5，由各插件通过 module 标识生成（如抽奖 module=lottery）
  const appEntryModuleLabel: Record<string, string> = { lottery: '抽奖' }
  const isAppEntry = (row: any) => Number(row?.type) === 5
  const appEntryLabel = (row: any) => appEntryModuleLabel[row?.module] || row?.module || '应用'

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
      apiParams: {},
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection', selectable: (row: any) => !isAppEntry(row) },
        {
          label: '回复名称',
          prop: 'name'
        },
        {
          label: '关键词',
          prop: 'content'
        },
        {
          label: '类型',
          prop: 'type',
          formatter: (row: any) => {
            if (isAppEntry(row)) {
              return h('div', { style: 'display:flex;align-items:center;gap:6px' }, [
                h(ElTag, { type: 'warning', size: 'small' }, () => '应用入口'),
                h(
                  'span',
                  { style: 'color:var(--el-text-color-secondary);font-size:12px' },
                  appEntryLabel(row)
                )
              ])
            }
            return replyTypes.value.find((item: any) => item.id === row.type)?.label || ''
          }
        },
        {
          prop: 'default',
          label: '默认回复',
          align: 'left',
          formatter: (row: any) => {
            return h(ElTag, { type: row.default === 1 ? 'success' : 'info' }, () =>
              row.default === 1 ? '启用' : '无'
            )
          }
        },
        {
          prop: 'subscribe',
          label: '关注回复',
          align: 'left',
          formatter: (row: any) => {
            return h(ElTag, { type: row.subscribe === 1 ? 'success' : 'info' }, () =>
              row.subscribe === 1 ? '启用' : '无'
            )
          }
        },
        {
          prop: 'status',
          label: '状态',
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
          align: 'right',
          formatter: (row: any) =>
            isAppEntry(row)
              ? h('div', { style: 'text-align: right' }, [
                  h(
                    ElButton,
                    {
                      size: 'small',
                      type: 'info',
                      plain: true,
                      disabled: true,
                      title: `该规则由${appEntryLabel(row)}插件生成，请在对应插件中编辑`
                    },
                    () => `${appEntryLabel(row)}插件维护`
                  )
                ])
              : h('div', { style: 'text-align: right' }, [
                  h(ArtButtonTable, {
                    type: 'edit',
                    vAuth: 'update',
                    onClick: () => showDialog('update', row)
                  }),
                  h(ArtButtonTable, {
                    type: 'delete',
                    vAuth: 'delete',
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
  const showDialog = (type: string, row?: any): void => {
    dialogType.value = type
    currentData.value = row || {
      name: '',
      content: '',
      default: 0,
      displayorder: 0,
      subscribe: 0,
      status: 1,
      type: '',
      module: '',
      reply: {}
    }
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
