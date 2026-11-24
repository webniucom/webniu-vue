<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <Search
          v-model="searchForm"
          :items="searchFormItems"
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
                  :disabled="config.group && group === 0"
                  >新增{{ title }}</ElButton
                >
                <ElButton type="primary" class="h-8!" @click="toggleExpand" v-ripple plain>{{
                  isExpanded ? '收起' : '展开'
                }}</ElButton>
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
            :default-expand-all="isExpanded"
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
            :items="form"
            :title="title"
            :data="data"
            :userInfo="userInfo"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'
  import { useTable } from '@/hooks/core/useTable'
  import { get, post, del } from '@/api/common-request'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { IndexConfig, FormConfig } from './modules/types'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'Role' })

  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)
  //管理信息
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const form = ref<FormConfig[]>([])
  const loadings = ref(false)
  const isExpanded = ref(true)
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({})
  const tableRef = ref()

  const group = ref(0)

  const selectedRows = ref<any>([])
  // 搜索参数
  const searchForm = ref<any>({
    name: '',
    format: 'table_tree',
    limit: 5000
  })
  const searchFormItems = ref<any>([])
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()
  // 弹窗标题
  const title = ref('角色')
  //加载数据列表
  const fetchGetIndex = () => {
    return Promise.resolve({
      config: {
        group: false,
        title: '角色',
        layout: 'refresh,size,fullscreen,columns,settings'
      }
    })
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
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        format: 'table_tree',
        limit: 5000
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection', selectable: (row: any) => row.id !== 1 },
        {
          label: '角色名',
          prop: 'name',
          formatter: (row: any) => {
            return row.name
          }
        },
        {
          label: '编号',
          prop: 'id',
          formatter: (row: any) => {
            return row.id
          }
        },
        {
          label: '描述',
          prop: 'description',
          formatter: (row: any) => {
            return row.description
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
                type: 'edit',
                vAuth: 'update',
                class: row.id === 1 ? '!mr-0' : 'mr-0',
                hidden: row.id !== 1 && userInfo.value?.roles?.includes(row.id),
                onClick: () => showDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
                class: '!mr-0',
                hidden: row.id === 1,
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
      pid: 1,
      name: '',
      description: '',
      nums: 0,
      status: 1
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
      const res: IndexConfig = await fetchGetIndex()
      // 初始化配置
      config.value = res.config || {}
      config.value.url = url

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

  /**
   * 切换展开/收起所有权限项
   */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && data.value) {
        const processRows = (rows: any[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(data.value)
      }
    })
  }
</script>
<style scoped>
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
