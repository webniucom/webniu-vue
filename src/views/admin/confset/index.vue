<template>
  <div class="user-page art-full-height">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel
        collapsible
        class="art-full-height mr-2"
        size="220px"
        min="220px"
        max="220px"
      >
        <ElCard class="tree-card art-card-xs flex flex-col h-full mt-0">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <el-radio-group v-model="model" size="small" @change="handleModelSwitch">
                  <el-radio-button value="system">系统</el-radio-button>
                  <el-radio-button value="apptem">应用</el-radio-button>
                </el-radio-group>
              </div>
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
            <VueDraggable
              v-model="groupList"
              class="category-list"
              handle=".drag-handle"
              :animation="200"
              ghostClass="ghost"
              @end="handleDragEnd"
            >
              <div
                v-for="item in groupList"
                :key="item.id"
                :class="[
                  'category-item flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer group',
                  groupId === item.id ? 'bg-gray-50' : ''
                ]"
                @click="handleNodeClick(item)"
              >
                <div class="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600">
                  <ArtSvgIcon icon="ri:draggable" style="vertical-align: text-top" />
                </div>
                <div class="category-info flex-1">
                  <div class="category-label text-xs">{{ item.label }}</div>
                  <div class="category-name text-xs text-gray-500">{{ item.name }}</div>
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
            </VueDraggable>
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
      <el-splitter-panel collapsible class="art-full-height ml-2">
        <ConfsetSearch
          v-model="searchForm"
          @search="handleSearch"
          @reset="resetSearchParams"
        ></ConfsetSearch>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElButton
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="confsetDialog('insert')"
                  v-ripple
                  :disabled="name == ''"
                  >新增配置</ElButton
                >
                <ElButton
                  v-if="selectedRows.length > 0"
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDeleteConfset"
                  v-ripple
                  plain
                  :disabled="selectedRows.length === 0"
                  >删除配置</ElButton
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
          <ConfsetDialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :editData="currentConfsetData"
            :loading="loading"
            @submit="handleConfsetSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'
  import GroupDialog from './modules/group-dialog.vue'
  import { ElTag, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { VueDraggable } from 'vue-draggable-plus'
  import { onMounted } from 'vue'
  import { post, del, get } from '@/api/common-request'
  import { ElMessage } from 'element-plus'
  import type { ModelType, GroupItem, GroupDialogType, SearchForm } from './modules/confset-types'
  import ConfsetSearch from './modules/confset-search.vue'
  import ConfsetDialog from './modules/confset-dialog.vue'

  defineOptions({ name: 'Confset' })
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)
  // 分组 API 相关
  const GROUP_UPDATE_API = url + '/groupupdate'
  const GROUP_INSERT_API = url + '/groupinsert'
  const GROUP_SELECT_API = url + '/groupselect'
  const GROUP_DELETE_API = url + '/groupdelete'

  // 分组弹窗相关
  const groupDialogType = ref<GroupDialogType>('groupinsert')
  const groupDialogVisible = ref(false)
  const groupCurrentDictData = ref<Partial<GroupItem>>({})
  const loadingGroup = ref(false)
  const model = ref<ModelType>('system')
  const name = ref<string>('')
  const groupList = ref<GroupItem[]>([])
  // 选中的分组
  const groupId = ref<number | null>(null)

  // 初始化默认选中第一个分组
  onMounted(async () => {
    await getGroupMenuList()
    if (groupList.value.length > 0) {
      groupId.value = groupList.value[0].id
      name.value = groupList.value[0].name
      getData()
    }
  })

  /**
   * 获取分组列表数据
   */
  async function getGroupMenuList(): Promise<void> {
    const res = await get<{ records: GroupItem[] }>(GROUP_SELECT_API, {
      model: model.value,
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
      model: model.value,
      name: '',
      label: '',
      sort: 0
    }
  }

  // 编辑分组
  const editGroupCategory = (id: number) => {
    groupDialogType.value = 'groupupdate'
    groupDialogVisible.value = true
    groupCurrentDictData.value = groupList.value.find((item) => item.id === id) || {}
  }

  // 切换模型类型
  const handleModelSwitch = () => {
    groupId.value = null
    name.value = ''
    model.value = model.value === 'system' ? 'system' : 'apptem'
    getGroupMenuList()
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
          name.value = ''
          getGroupMenuList()
        } catch (error) {
          return error
        }
      })
      .catch(() => {
        return
      })
  }

  // 处理分组拖拽排序结束事件
  const handleDragEnd = () => {
    const sortData = groupList.value.map((item, index) => ({
      id: item.id,
      sort: index + 1
    }))
    saveSortOrder(sortData)
  }

  // 保存排序到后台
  const saveSortOrder = async (sortData: { id: number; sort: number }[]) => {
    await post(GROUP_UPDATE_API, {
      dragsort: sortData
    })
    ElMessage.success('排序已保存')
    getGroupMenuList()
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
    name.value = data.name
    getData()
  }

  // 配置 API 相关
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'

  // 配置弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<string>('insert')
  const currentConfsetData = ref<Partial<any>>({})
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
  const fetchGetConfsetList = async (params: any): Promise<any> => {
    return await get<any>(SELECT_API, {
      ...params,
      field: 'sort',
      order: 'asc',
      name: name.value,
      model: model.value
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
      apiFn: fetchGetConfsetList,
      apiParams: {
        page: 1,
        limit: 10,
        ...searchForm.value
      },
      // 自定义分页字段映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          prop: 'label',
          label: '配置标题',
          width: 200,
          formatter: (row: any) => {
            return row.label
          }
        },
        {
          prop: 'key',
          label: '字段标识',
          width: 200
        },
        {
          prop: 'type',
          label: '字段类型',
          formatter: (row: any) => {
            return row.type
          }
        },
        {
          prop: 'sort',
          label: '排序'
        },
        {
          prop: 'hidden',
          label: '显示',
          formatter: (row: any) => {
            return h(ElTag, { type: row.hidden === 1 ? 'danger' : 'success' }, () =>
              row.hidden === 1 ? '隐藏' : '显示'
            )
          }
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
          width: 120,
          align: 'right',
          formatter: (row: any) =>
            h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                onClick: () => confsetDialog('update', row)
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
   * 显示配置弹窗
   */
  const confsetDialog = (type: string, row?: any): void => {
    if (type === 'update' && typeof row?.options === 'string') {
      row.options = JSON.parse(row?.options || '[]')
    } else {
      row = {
        ...row,
        model: model.value,
        name: name.value
      }
    }
    currentConfsetData.value = row || {}
    nextTick(() => {
      dialogType.value = type
      dialogVisible.value = true
    })
  }
  /**
   * 删除配置项
   */
  const deleteConfset = (row: any): void => {
    ElMessageBox.confirm(`确定要删除该配置项吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: row.id })
        ElMessage.success('删除成功')
        getData()
      })
      .catch(() => {
        return
      })
  }
  /**
   * 批量删除配置项
   */
  const allDeleteConfset = async () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请选择要删除的配置项')
      return
    }
    ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个配置项吗？`, '删除确认', {
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
  const handleConfsetSubmit = async (data: any) => {
    await post(dialogType.value === 'insert' ? INSERT_API : UPDATE_API, data)
    dialogVisible.value = false
    currentConfsetData.value = {}
    ElMessage.success(dialogType.value === 'insert' ? '添加成功' : '更新成功')
    refreshUpdate()
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
  .wn-splitter :deep(.el-splitter-bar__dragger:after),
  .wn-splitter :deep(.el-splitter-bar__dragger:before) {
    background-color: #f5f5f5;
    width: 0px;
  }
  :deep(.confset-empty-image .el-empty__image) {
    width: 80px;
  }
</style>
