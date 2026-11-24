<template>
  <div class="user-page art-full-height">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel collapsible class="art-full-height" min="220" size="220">
        <ElCard class="tree-card art-card-xs flex flex-col h-full mt-0 mr-4">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2"> 字典分组 </div>
              <ElButton
                size="small"
                v-auth="'groupinsert'"
                type="primary"
                @click="createGroupCategory"
                v-ripple
              >
                创建分组
              </ElButton>
            </div>
          </template>
          <ElScrollbar max-height="calc(100vh - 200px)">
            <div class="category-list">
              <div
                v-for="item in groupList"
                :key="item.id"
                :class="[
                  'category-item flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer group',
                  groupId === item.id ? 'bg-gray-50' : ''
                ]"
                @click="handleNodeClick(item)"
              >
                <div class="mr-2 text-gray-400">
                  <ArtSvgIcon icon="ri:list-view" style="vertical-align: text-top" />
                </div>
                <div class="category-info flex-1">
                  <div class="category-label text-xs">{{ item.label }}</div>
                  <div class="category-name text-xs text-gray-500">{{ item.value }}</div>
                </div>
                <div
                  class="category-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ElTag
                    class="cursor-pointer mr-1"
                    v-auth="'groupupdate'"
                    type="primary"
                    @click.stop="editGroupCategory(item.id)"
                  >
                    <ArtSvgIcon icon="ri:edit-line" />
                  </ElTag>
                  <ElTag
                    class="cursor-pointer"
                    v-auth="'groupdelete'"
                    type="danger"
                    @click.stop="deleteGroupCategory(item.id)"
                  >
                    <ArtSvgIcon icon="ri:delete-bin-5-line" />
                  </ElTag>
                </div>
              </div>
              <el-empty
                v-if="groupList.length == 0"
                class="confset-empty-image"
                description="暂无分组数据"
              />
            </div>
            <!-- 字典分组弹窗 -->
            <GroupDialog
              v-model:visible="groupDialogVisible"
              :type="groupDialogType"
              :editData="groupCurrentDictData"
              :loading="loadingGroup"
              @submit="handleGroupSubmit"
            />
          </ElScrollbar>
        </ElCard>
      </el-splitter-panel>
      <el-splitter-panel class="art-full-height">
        <DictSearch
          v-model="searchForm"
          @search="handleSearch"
          @reset="resetSearchParams"
        ></DictSearch>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader
            v-model:columns="columnChecks"
            layout="refresh"
            :loading="loading"
            @refresh="refreshData"
          >
            <template #left>
              <ElSpace wrap>
                <ElButton
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="dictDialog('insert')"
                  v-ripple
                  :disabled="group == ''"
                  >新增数据</ElButton
                >
                <ElButton
                  :disabled="group == ''"
                  type="primary"
                  class="h-8!"
                  @click="toggleExpand"
                  v-ripple
                  plain
                  >{{ isExpanded ? '收起' : '展开' }}</ElButton
                >
                <ElButton
                  v-if="selectedRows.length > 0"
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDeleteDict"
                  v-ripple
                  plain
                  :disabled="selectedRows.length === 0"
                  >删除数据</ElButton
                >
              </ElSpace>
            </template>
            <!-- 右侧插槽 -->
            <template #right>
              <div
                class="size-8 flex items-center justify-center cursor-pointer rounded-md bg-g-300/55 dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0 md:mr-2.5"
                @click="handleExportJson"
              >
                <ArtSvgIcon icon="ri:download-line" class="text-g-600" />
              </div>
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
          <DictDialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :editData="currentData"
            :data="data"
            :loading="loading"
            @submit="handleDictSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import GroupDialog from './modules/group-dialog.vue'
  import { ElTag, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { onMounted } from 'vue'
  import { post, del, get } from '@/api/common-request'
  import { ElMessage } from 'element-plus'
  import type { GroupItem, GroupDialogType, SearchForm } from './modules/dict-types'
  import DictSearch from './modules/dict-search.vue'
  import DictDialog from './modules/dict-dialog.vue'

  defineOptions({ name: 'Dict' })
  // 分组 API 相关
  const GROUP_UPDATE_API = '/webniu/admin/dict/groupupdate'
  const GROUP_INSERT_API = '/webniu/admin/dict/groupinsert'
  const GROUP_SELECT_API = '/webniu/admin/dict/groupselect'
  const GROUP_DELETE_API = '/webniu/admin/dict/groupdelete'

  // 分组弹窗相关
  const groupDialogType = ref<GroupDialogType>('groupinsert')
  const groupDialogVisible = ref(false)
  const groupCurrentDictData = ref<Partial<GroupItem>>({})
  const loadingGroup = ref(false)
  const group = ref<string>('')
  const groupList = ref<GroupItem[]>([])
  // 选中的分组
  const groupId = ref<number | null>(null)

  // 表格相关
  const tableRef = ref()
  const isExpanded = ref(false)

  // 初始化默认选中第一个分组
  onMounted(async () => {
    await getGroupMenuList()
    if (groupList.value.length > 0) {
      groupId.value = groupList.value[0].id
      group.value = groupList.value[0].value
      getData()
    }
  })

  /**
   * 获取分组列表数据
   */
  async function getGroupMenuList(): Promise<void> {
    const res = await get<{ records: GroupItem[] }>(GROUP_SELECT_API, {
      order: 'asc',
      field: 'sort'
    })
    groupList.value = res.records || []
  }

  // 创建分组
  const createGroupCategory = () => {
    groupDialogType.value = 'groupinsert'
    groupDialogVisible.value = true
    groupCurrentDictData.value = {
      value: '',
      label: ''
    }
  }

  // 编辑分组
  const editGroupCategory = (id: number) => {
    groupDialogType.value = 'groupupdate'
    groupDialogVisible.value = true
    groupCurrentDictData.value = groupList.value.find((item) => item.id === id) || {}
  }

  // 删除分组
  const deleteGroupCategory = (id: number) => {
    ElMessageBox.confirm('确定删除该分组吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await del(GROUP_DELETE_API, { id })
          ElMessage.success('删除成功')
          group.value = ''
          getGroupMenuList()
        } catch (error) {
          return error
        }
      })
      .catch(() => {
        return
      })
  }

  //处理分组弹窗提交事件
  const handleGroupSubmit = async (data: GroupItem): Promise<void> => {
    groupDialogVisible.value = false
    await post(groupDialogType.value === 'groupinsert' ? GROUP_INSERT_API : GROUP_UPDATE_API, data)
    ElMessage.success(groupDialogType.value === 'groupinsert' ? '添加成功' : '更新成功')
    getGroupMenuList()
  }
  // 处理分组节点点击事件
  const handleNodeClick = (data: GroupItem) => {
    groupId.value = data.id
    group.value = data.value
    getData()
  }

  // 配置 API 相关
  const UPDATE_API = '/webniu/admin/dict/update'
  const INSERT_API = '/webniu/admin/dict/insert'
  const SELECT_API = '/webniu/admin/dict/select'
  const DELETE_API = '/webniu/admin/dict/delete'

  // 配置弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<string>('insert')
  const currentData = ref<Partial<any>>({})
  // 选中行
  const selectedRows = ref<any[]>([])
  // 搜索表单
  const searchForm = ref<SearchForm>({
    label: '',
    status: ''
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: SearchForm) => {
    replaceSearchParams(params)
    getData()
  }
  // 获取配置列表数据
  const fetchGetList = async (params: any): Promise<any> => {
    return await get<any>(SELECT_API, {
      ...params,
      group: group.value
    })
  }
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    refreshUpdate,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        format: 'table_tree',
        limit: 5000,
        order: 'asc',
        field: 'sort',
        ...searchForm.value
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          prop: 'label',
          label: '数据名',
          formatter: (row: any) => {
            return row.label
          }
        },
        {
          prop: 'value',
          label: '数据值',
          formatter: (row: any) => {
            return row.value
          }
        },
        {
          prop: 'sort',
          label: '排序'
        },
        {
          prop: 'status',
          label: '状态',
          formatter: (row: any) => {
            return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          visible: false
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
                title: '新增子配置',
                vAuth: 'insert',
                onClick: () => dictDialog('insert', row)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                onClick: () => dictDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
                class: '!mr-0',
                onClick: () => deleteConfset(row)
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
  /**
   * 切换展开/收起所有字典项
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
  /**
   * 显示配置弹窗
   * @param type 弹窗类型 insert/update
   * @param row 当前行数据，如果存在则表示添加子菜单
   */
  const dictDialog = (type: string, row?: any): void => {
    if (type === 'update') {
      if (typeof row?.options === 'string') {
        row.options = JSON.parse(row?.options || '[]')
      }
      currentData.value = { ...row, group: group.value }
    } else {
      // 新增：如果是添加子数据，则传递 pid
      currentData.value = {
        group: group.value,
        pid: row?.id || 0
      }
    }
    nextTick(() => {
      dialogType.value = type
      dialogVisible.value = true
    })
  }
  /**
   * 删除配置项
   */
  const deleteConfset = (row: any): void => {
    ElMessageBox.confirm(`确定要删除该数据吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        if (row.children?.length && row.meta?.type !== 1) {
          ElMessage.error('该数据下有子数据，不能删除')
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
        return
      })
  }
  /**
   * 批量删除配置项
   */
  const allDeleteDict = async () => {
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
        getData()
      })
      .catch(() => {
        return
      })
  }
  /**
   * 导出配置为 JSON
   */
  const handleExportJson = () => {
    if (data.value.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }
    const jsonStr = JSON.stringify(data.value, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `confset-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }
  /**
   * 处理弹窗提交事件
   */
  const handleDictSubmit = async (data: any) => {
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
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: any): void => {
    selectedRows.value = selection
  }
</script>
<style scoped>
  .tree-card :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    padding: 10px 10px 10px 10px;
  }
  :deep(.confset-empty-image .el-empty__image) {
    width: 80px;
  }
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
