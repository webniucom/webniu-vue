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
                  >{{ config.action }}{{ config.title }}</ElButton
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
            <template #right>
              <el-radio-group v-model="group">
                <el-radio-button value="news">图文</el-radio-button>
                <el-radio-button value="video">视频</el-radio-button>
                <el-radio-button value="image">图片</el-radio-button>
                <el-radio-button value="voice">语音</el-radio-button>
              </el-radio-group>
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
            :data="data"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
    <!-- 素材同步弹窗（跟同步粉丝同款交互：batch_size / 进度条 / 继续-停止 / 断点） -->
    <SyncDialog
      v-if="group !== 'news'"
      v-model:visible="syncVisible"
      :api-url="SYNC_API"
      :type="syncType"
      @refresh="getData"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, nextTick, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag, ElImage } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import SyncDialog from './modules/sync-dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { wxImgUrl } from '@/utils/wximg'

  defineOptions({ name: 'Material' })
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const loadings = ref(false)

  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  const SYNC_API = url + '/sync'
  // config
  const config = ref<any>({
    title: '图文',
    layout: '',
    url: url,
    action: '新增'
  })
  const selectedRows = ref<any>([])

  const group = ref('news')
  // 传给 SyncDialog 的收窄类型（v-if="group!=='news'" 已保证只传这三个值）
  // 放在 computed 里做 as，避免 template 中用 TS `as` 语法导致 JS 解析器报错
  const syncType = computed(() => group.value as 'image' | 'video' | 'voice')
  // 搜索参数
  const searchForm = ref<any>({
    type: group.value,
    name: ''
  })
  const layout = ref('')
  const syncVisible = ref(false)
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
        type: group.value
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          label: '类型',
          prop: 'type',
          formatter: (row: any) => {
            return row.type === 'news'
              ? '图文'
              : row.type === 'video'
                ? '视频'
                : row.type === 'image'
                  ? '图片'
                  : '语音'
          }
        },
        {
          label: '标题',
          prop: 'name',
          showOverflowTooltip: true
        },
        {
          label: '题图',
          prop: 'cover_url',
          formatter: (row: any) => {
            // 微信官方 CDN 图片走本地代理，本地/自定义上传的地址原样使用
            const cover = wxImgUrl(row.cover_url)
            return h(ElImage, {
              class: 'w-10 h-10 rounded-md flex! items-center justify-center text-center',
              src: cover,
              previewSrcList: cover ? [cover] : [],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          label: '连接',
          prop: 'diy_url',
          formatter: (row: any) => {
            const url = row.diy_url || row.vid || ''
            if (!url) {
              return '-'
            }
            return h('a', { href: url, target: '_blank' }, '点击查看')
          }
        },
        {
          label: '更新时间',
          prop: 'update_time'
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
                type: 'edit',
                vAuth: 'update',
                onClick: () => showDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
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
    if (group.value === 'news') {
      dialogType.value = type
      currentData.value = row || {
        type: group.value,
        name: '',
        description: '',
        cover_url: '',
        diy_url: '',
        status: 1,
        content: ''
      }
      dialogVisible.value = true
    } else {
      syncVisible.value = true
    }
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
  // 素材分组对应的中文标题（用于 config.title：新增图文 / 同步视频 / 同步图片 / 同步语音）
  const groupTitleMap: Record<string, string> = {
    news: '图文',
    video: '视频',
    image: '图片',
    voice: '语音'
  }
  const updateGroupConfig = (type: string) => {
    config.value.title = groupTitleMap[type] ?? '素材'
    config.value.action = type === 'news' ? '新增' : '同步'
  }
  // 监听 searchForm.type 变化
  watch(
    () => searchForm.value.type,
    (newVal) => {
      if (!newVal || newVal === group.value) return
      group.value = newVal
      updateGroupConfig(newVal)
    }
  )
  watch(
    () => group.value,
    (newVal) => {
      searchForm.value.type = newVal
      updateGroupConfig(newVal)
      replaceSearchParams({ type: newVal })
      getData()
    },
    { immediate: true }
  )

  // 初始化默认选中第一个分组
  onMounted(async () => {
    try {
      loadings.value = true
      layout.value = config.value.layout || ''
      updateGroupConfig(group.value)
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
  :deep(.material-dialog .material-dialog-body) {
    padding: 0 !important;
  }
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
  :deep(.material-index-dialog .el-dialog__body) {
    padding: 0px !important;
  }
</style>
