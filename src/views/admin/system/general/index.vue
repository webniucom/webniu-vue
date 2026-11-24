<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel
        v-if="config.group"
        collapsible
        class="art-full-height"
        min="200"
        size="200"
      >
        <Group
          :items="groupList"
          :group="group"
          :config="config"
          :groupname="groupname"
          @nodeClick="handleNodeClick"
          @refresh="handleGroupRefresh"
        ></Group>
      </el-splitter-panel>
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
            :items="form"
            :title="title"
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
  import Group from './modules/group.vue'

  defineOptions({ name: 'General' })
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)
  const form = ref<FormConfig[]>([])
  const loadings = ref(false)

  const INDEX_API = url + '/index'
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({})
  // 分组列表
  const groupList = ref<any>([])
  const group = ref(0)
  const groupname = ref('数据')

  const selectedRows = ref<any>([])
  // 搜索参数
  const searchForm = ref<any>()
  const searchFormItems = ref<any>([])
  const columnsFactory = ref<any>([])
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()
  // 弹窗标题
  const title = ref('数据')
  //加载数据列表
  const fetchGetIndex = () => {
    return get(INDEX_API)
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
    refreshData,
    resetColumns
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'asc',
        field: 'sort',
        //计算属性
        group: computed(() => {
          return group.value || 0
        })
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        ...columnsFactory.value,
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
      group: group.value
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
   * 处理分组点击事件
   * @param item 点击的分组项
   */
  const handleNodeClick = (item: any): void => {
    group.value = item.id
    getData()
  }

  /**
   * 处理分组刷新事件
   * 重新加载分组列表数据
   */
  const handleGroupRefresh = async (): Promise<void> => {
    try {
      loadings.value = true
      const res: IndexConfig = await fetchGetIndex()

      // 更新分组列表
      groupList.value = res.grouplist || []
      // 初始化表单数据
      form.value = res.form || []
      // 如果当前选中的分组已被删除，选中第一个分组或清空
      if (group.value && !groupList.value.find((item: any) => item.id === group.value)) {
        group.value = groupList.value[0]?.id || 0
      }
      // 构建搜索表单初始数据对象，key为字段名，value为空字符串
      searchFormItems.value = form.value
        .filter((item: any) => item.search === true)
        .map((item: any) => {
          const newItem = { ...item }
          delete newItem.labelWidth
          delete newItem.span
          return newItem
        })
      getData()
      loadings.value = false
    } catch (error) {
      ElMessage.error('刷新分组列表失败')
      loadings.value = false
      console.error(error)
    }
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
      // 初始化表单数据
      form.value = res.form || []
      // 初始化分组列表
      groupList.value = res.grouplist || []
      group.value = groupList.value[0]?.id || 0
      groupname.value = res.config.groupname || '数据'
      // 初始化弹窗标题
      title.value = res.config.title || '数据'
      // 初始化表格列数据
      const showListFields = form.value.filter((item: any) => item.showlist === true)
      columnsFactory.value = showListFields.map((item: any) => ({
        prop: item.key,
        label: item.label
      }))
      // 重置表格列配置，使其重新读取 columnsFactory.value
      if (resetColumns) {
        resetColumns()
      }
      // 构建搜索表单初始数据对象，key为字段名，value为空字符串
      searchFormItems.value = form.value
        .filter((item: any) => item.search === true)
        .map((item: any) => {
          const newItem = { ...item }
          delete newItem.labelWidth
          delete newItem.span
          return newItem
        })
      searchForm.value = searchFormItems.value.reduce((acc: any, item: any) => {
        // 如果配置了默认值，使用默认值；否则使用空字符串
        acc[item.key] = item.props?.defaultValue !== undefined ? item.props.defaultValue : ''
        return acc
      }, {})
      layout.value = res.config.layout || 'refresh'
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
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
