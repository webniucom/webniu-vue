<template>
  <div class="user-page art-full-height">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel class="art-full-height">
        <Search
          v-model="searchForm"
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
                  v-if="canCreate"
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="showDialog('insert')"
                  v-ripple
                  >新增{{ title }}</ElButton
                >
                <ElButton
                  v-if="selectedRows.length > 0"
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDelete"
                  v-ripple
                  plain
                  >删除{{ title }}</ElButton
                >
              </ElSpace>
            </template>
            <template #right>
              <ElTooltip placement="left" :show-after="100" popper-class="appgroup-tip">
                <template #content>
                  <div class="leading-6">
                    <p><b>私有分组</b>：由你自己创建，仅你可用；可选应用范围受你账号的可用应用限制。</p>
                    <p><b>公共分组</b>：由超管创建，所有子账户可选用；可选应用为全部已安装应用。</p>
                    <p>公众号未绑定任何分组时，默认可用其归属账号的全部应用。</p>
                  </div>
                </template>
                <span class="inline-flex items-center justify-center w-8 h-8 cursor-pointer text-gray-400 hover:text-primary">
                  <ArtSvgIcon icon="ri:question-line" class="text-lg" />
                </span>
              </ElTooltip>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable
            rowKey="id"
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
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
            :title="title"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { useUserStore } from '@stores/modules/user'

  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const userStore = useUserStore()
  const isSuper = computed(() => !!userStore?.getUserInfo?.isSuperAdmin)
  const SELECT_API = url + '/select'
  const INSERT_API = url + '/insert'
  const UPDATE_API = url + '/update'
  const DELETE_API = url + '/delete'

  const layout = ref('refresh')
  const title = ref('分组')
  // 搜索参数
  const searchForm = ref<any>({ name: '' })
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()
  const selectedRows = ref<any>([])
  // 非超管创建的子账户不允许创建分组
  const canCreate = ref(true)
  const loadPerm = async () => {
    try {
      const res: any = await get(url + '/perm')
      canCreate.value = !!res?.can_create
    } catch {
      canCreate.value = true
    }
  }
  onMounted(loadPerm)

  const fetchGetList = (params: any) => get(SELECT_API, params)

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
      immediate: true,
      apiFn: fetchGetList,
      apiParams: {},
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          prop: 'name',
          label: '分组名称',
          align: 'left',
          minWidth: 160
        },
        {
          prop: 'is_public',
          label: '类型',
          align: 'left',
          width: 90,
          formatter: (row: any) =>
            h(ElTag, { type: row.is_public === 1 ? 'warning' : 'info', size: 'small' }, () =>
              row.is_public === 1 ? '公共' : '私有'
            )
        },
        {
          prop: 'app_names',
          label: '可用应用',
          align: 'left',
          minWidth: 200,
          formatter: (row: any) => {
            const list: string[] = row.app_names || []
            if (!list.length) return '-'
            return h(
              'div',
              { class: 'flex flex-wrap gap-1' },
              list.map((name) => h(ElTag, { type: 'primary', size: 'small' }, () => name))
            )
          }
        },
        {
          prop: 'appcount',
          label: '公众号数',
          align: 'left',
          width: 110,
          formatter: (row: any) => `${row.appcount || 0}`
        },
        {
          prop: 'sort',
          label: '排序',
          align: 'left',
          width: 90
        },
        {
          prop: 'status',
          label: '状态',
          align: 'left',
          width: 100,
          formatter: (row: any) => {
            return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'created_at',
          label: '创建时间',
          align: 'left',
          width: 170
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          align: 'right',
          width: 120,
          formatter: (row: any) => {
            // 公共分组仅超管可编辑/删除
            if (!isSuper.value && row.is_public === 1) return '-'
            return h('div', { style: 'text-align: right' }, [
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
        }
      ]
    },
    transform: {
      dataTransformer: (records: any) => records
    }
  })

  // 打开弹窗添加or编辑
  const showDialog = (type: string, row?: any): void => {
    dialogType.value = type
    currentData.value = row || { sort: 0, status: 1 }
    dialogVisible.value = true
  }

  // 删除单条数据
  const deleteItem = async (row: any) => {
    ElMessageBox.confirm(`确定删除分组「${row.name}」吗？公众号不会被删除。`, '删除确认', {
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
    try {
      await post(dialogType.value === 'insert' ? INSERT_API : UPDATE_API, data)
      dialogVisible.value = false
      currentData.value = {}
      ElMessage.success(dialogType.value === 'insert' ? '添加成功' : '更新成功')
      if (dialogType.value === 'update') {
        refreshUpdate()
      } else {
        getData()
      }
    } catch (error: any) {
      ElMessage.error(error?.message || (dialogType.value === 'insert' ? '添加失败' : '更新失败'))
    }
  }
</script>
<style scoped>
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
