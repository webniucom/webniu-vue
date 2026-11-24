<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <Search
          v-model="searchForm"
          :formItems="searchFormItems"
          @search="handleSearch"
          @reset="resetSearchParams"
        ></Search>
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
            :data="data"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>

    <!-- 二维码放大弹窗 -->
    <ElDialog
      v-model="qrcodeVisible"
      title="二维码"
      width="320px"
      :show-close="true"
      :close-on-click-modal="true"
    >
      <div class="flex flex-col items-center">
        <QrcodeVue
          :value="qrcodeValue"
          :size="240"
          level="H"
          render-as="svg"
          :margin="0"
          background="#ffffff"
          foreground="#000000"
        />
        <p class="mt-4 text-sm text-gray-500 text-center">{{ qrcodeValue }}</p>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag, ElDialog } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import QrcodeVue from 'qrcode.vue'
  import type { Level, RenderAs } from 'qrcode.vue'

  defineOptions({ name: 'Qrcode' })
  const route = useRoute()
  const router = useRouter()
  const url = toAdminApiUrl(route.meta.key as string)
  const loadings = ref(false)

  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({
    title: '二维码',
    layout: 'refresh',
    url: url
  })
  const selectedRows = ref<any>([])

  // 搜索参数
  const searchForm = ref<any>({
    title: ''
  })
  // 搜索表单配置
  const searchFormItems = ref<any>([
    {
      label: '标题',
      key: 'title',
      type: 'input',
      props: {
        placeholder: '请输入标题',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    }
  ])
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()

  // 二维码放大弹窗
  const qrcodeVisible = ref(false)
  const qrcodeValue = ref('')

  const showQrcode = (url: string) => {
    qrcodeValue.value = url
    qrcodeVisible.value = true
  }

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
          label: '二维码',
          prop: 'url',
          formatter: (row: any) => {
            return h(
              'div',
              {
                class:
                  'w-10 h-10 rounded-md flex! items-center justify-center cursor-pointer hover:opacity-80 transition-opacity',
                onClick: () => showQrcode(row.short_url || '无数据')
              },
              [
                h(QrcodeVue, {
                  value: row.short_url || '无数据',
                  size: 80,
                  level: 'H' as Level,
                  renderAs: 'svg' as RenderAs,
                  margin: 0,
                  background: '#ffffff',
                  foreground: '#000000'
                })
              ]
            )
          }
        },
        {
          label: '标题',
          prop: 'title'
        },
        {
          label: '类型',
          prop: 'type',
          formatter: (row: any) => (row.type === 1 ? '永久' : '临时')
        },
        {
          label: '场景值',
          prop: 'scene_str',
          formatter: (row: any) => row.scene_str || '-'
        },
        {
          label: '关键字',
          prop: 'keyword'
        },
        {
          label: '到期时间',
          prop: 'expire',
          formatter: (row: any) => row.expire || '-'
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
          width: 180,
          align: 'right',
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                title: '编辑',
                onClick: () => showDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'add',
                title: '二维码统计',
                icon: 'ri:line-chart-line',
                onClick: () => scenesDialog('more', row)
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
  const showDialog = (type: string, row?: any): void => {
    dialogType.value = type
    currentData.value = row || {
      name: '',
      from: '',
      subject: '',
      status: 1,
      content: ''
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
  // 打开弹窗查看详情
  const scenesDialog = (type: string, row?: any): void => {
    router.push({ name: 'qrcodescenes', params: { id: row.ticket } })
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
