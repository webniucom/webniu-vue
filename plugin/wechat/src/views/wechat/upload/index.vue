<template>
  <div class="user-page art-full-height">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel collapsible class="art-full-height" min="200" size="200">
        <WnGroupList
          :list="groupList"
          v-model:selectedId="groupId"
          title="附件分组"
          :draggable="true"
          @click="handleNodeClick"
          @create="createGroup"
          @edit="editGroupCategory"
          @delete="deleteGroupCategory"
          @sortChange="handleSortChange"
        >
          <!-- 分组弹窗 -->
          <Dialog
            v-model:visible="groupDialogVisible"
            :type="groupDialogType"
            :editData="groupCurrentDictData"
            :loading="loadingGroup"
            @submit="handleGroupSubmit"
          />
        </WnGroupList>
      </el-splitter-panel>
      <el-splitter-panel class="art-full-height">
        <Search v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></Search>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader
            v-model:columns="columnChecks"
            :loading="loading"
            layout="refresh"
            @refresh="refreshData"
          >
            <template #left>
              <ElSpace wrap>
                <ElButton
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="confsetDialog()"
                  v-ripple
                  :disabled="label == ''"
                  >点击上传</ElButton
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
                  >删除附件</ElButton
                >
                <ElDropdown
                  v-if="selectedRows.length > 0"
                  :disabled="selectedRows.length === 0"
                  @command="handleBatchCategoryChange"
                >
                  <ElButton plain class="h-8!" :disabled="selectedRows.length === 0">
                    修改分类
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem v-for="item in groupList" :key="item.id" :command="item.id">
                        {{ item.name }}
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </ElSpace>
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
          <WnUploadDialog
            v-model:visible="dialogVisible"
            :title="title"
            :multiple="true"
            :loading="loading"
            @submit="handleUploadSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
    <el-image-viewer
      v-if="showPreview"
      show-progress
      :url-list="srcList"
      @close="showPreview = false"
    >
    </el-image-viewer>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import Dialog from './modules/dialog.vue'
  import WnGroupList from '@admin/forms/wn-group-list/index.vue'
  import { ElMessageBox, ElDropdown, ElDropdownMenu, ElDropdownItem, ElImage } from 'element-plus'
  import { wxImgUrl } from '@/utils/wximg'
  import { onMounted, h } from 'vue'
  import { post, del, get } from '@admin/core/request'
  import { ElMessage } from 'element-plus'
  import type { SearchForm, GroupItem } from './modules/types'
  import Search from './modules/search.vue'
  import WnUploadDialog from '@admin/forms/wn-upload-dialog/wn-upload-dialog.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'

  defineOptions({ name: 'Upload' })

  // 分组 API 相关
  const GROUP_UPDATE_API = '/webniu/admin/upload/groupupdate'
  const GROUP_INSERT_API = '/webniu/admin/upload/groupinsert'
  const GROUP_SELECT_API = '/webniu/admin/upload/groupselect'
  const GROUP_DELETE_API = '/webniu/admin/upload/groupdelete'

  // 批量修改分类相关
  const batchCategoryId = ref<number | null>(null)
  // 分组弹窗相关
  const groupDialogType = ref<'groupinsert' | 'groupupdate'>('groupinsert')
  const groupDialogVisible = ref(false)
  const groupCurrentDictData = ref<Partial<GroupItem>>({})
  const loadingGroup = ref(false)
  const label = ref<string>('')
  const groupList = ref<GroupItem[]>([])
  const groupId = ref<number>(0)

  // 初始化默认选中第一个分组
  onMounted(async () => {
    await getGroupMenuList()
    if (groupList.value.length > 0) {
      groupId.value = groupList.value[0].id
      label.value = groupList.value[0].label
      getData()
    }
  })
  // 预览图片相关
  const showPreview = ref(false)
  const srcList = ref<string[]>([])
  /**
   * 获取分组列表数据
   */
  async function getGroupMenuList(): Promise<void> {
    const res = await get<{ records: GroupItem[] }>(GROUP_SELECT_API)
    // 禁止拖拽
    const noGroup: GroupItem = {
      id: 0,
      name: '无分组',
      label: 'nogroup',
      sort: 0
    }
    groupList.value = [noGroup, ...(res.records || [])]
  }

  // 创建分组
  const createGroup = () => {
    groupDialogType.value = 'groupinsert'
    groupDialogVisible.value = true
    groupCurrentDictData.value = {
      name: '',
      label: '',
      sort: 0
    }
  }

  // 编辑分组
  const editGroupCategory = (item: any) => {
    groupDialogType.value = 'groupupdate'
    groupDialogVisible.value = true
    groupCurrentDictData.value = { ...item }
  }

  // 删除分组
  const deleteGroupCategory = async (id: number | string) => {
    await del(GROUP_DELETE_API, { id })
    ElMessage.success('删除成功')
    label.value = ''
    getGroupMenuList()
  }

  // 处理分组拖拽排序变化
  const handleSortChange = async (sortData: any[]) => {
    const result = sortData.map((item) => ({
      id: item.id,
      sort: item.sort
    }))
    await post(GROUP_UPDATE_API, result)
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
  const handleNodeClick = (item: any) => {
    groupId.value = item.id
    label.value = item.label
    getData()
  }

  // 批量修改分类
  const handleBatchCategoryChange = async (categoryId: number | null) => {
    if (categoryId === null || selectedRows.value.length === 0) {
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定要将 ${selectedRows.value.length} 个附件移动到所选分类吗？`,
        '批量修改分类',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      const id = selectedRows.value.map((row) => row.id)
      await post(UPDATE_API, { id, category: categoryId })
      ElMessage.success('分类修改成功')
      batchCategoryId.value = null
      getData()
    } catch {
      batchCategoryId.value = null
    }
  }

  // 配置 API 相关
  const SELECT_API = '/webniu/admin/upload/select'
  const UPDATE_API = '/webniu/admin/upload/update'
  const DELETE_API = '/webniu/admin/upload/delete'

  // 配置弹窗相关
  const dialogVisible = ref(false)
  const title = ref<string>('新增上传')
  const currentUploadData = ref<Partial<any>>({})
  // 选中行
  const selectedRows = ref<any[]>([])
  // 搜索表单
  const searchForm = ref<SearchForm>({
    name: '',
    ext: '',
    createdAt: ''
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
      order: 'desc',
      field: 'id',
      category: groupId.value
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
  } = useWnTable<any>({
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
          prop: 'url',
          label: '图片URL',
          formatter: (row: any) => {
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
            const ext = row.ext?.toLowerCase() || ''
            if (imageExtensions.includes(ext)) {
              const imgSrc = wxImgUrl(row.url)
              return h(ElImage, {
                class: 'w-10 h-10 rounded-md flex! items-center justify-center',
                src: imgSrc,
                previewSrcList: imgSrc ? [imgSrc] : [],
                // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
                previewTeleported: true
              })
            } else {
              return h(ArtSvgIcon, {
                style: 'width: 35px; height: 35px;color: #999;',
                icon: 'ri:file-ai-2-line'
              })
            }
          }
        },
        {
          prop: 'name',
          label: '图片名称',
          showOverflowTooltip: true,
          formatter: (row: any) => {
            return row.name || '-'
          }
        },
        {
          prop: 'ext',
          label: '图片类型',
          align: 'center',
          formatter: (row: any) => {
            return row.ext || '-'
          }
        },
        {
          prop: 'file_size',
          label: '文件大小',
          align: 'center',
          formatter: (row: any) => {
            return row.file_size || '-MB'
          }
        },
        {
          prop: 'image_width',
          label: '图片宽度',
          align: 'center',
          formatter: (row: any) => {
            return row.image_width || '-'
          }
        },
        {
          prop: 'image_height',
          label: '图片高度',
          align: 'center',
          formatter: (row: any) => {
            return row.image_height || '-'
          }
        },
        {
          prop: 'created_at',
          label: '上传时间',
          //visible: false,
          showOverflowTooltip: true,
          formatter: (row: any) => {
            return row.created_at || '-'
          }
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          width: 80,
          align: 'right',
          formatter: (row: any) =>
            h(ArtButtonTable, {
              type: 'delete',
              vAuth: 'delete',
              class: '!mr-0',
              style: 'margin-right: 0px;',
              onClick: () => deleteConfset(row.id)
            })
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
  const confsetDialog = (): void => {
    nextTick(() => {
      dialogVisible.value = true
    })
  }
  /**
   * 删除配置项
   */
  const deleteConfset = (id: number | number[]): void => {
    ElMessageBox.confirm(
      `确定要删除${Array.isArray(id) ? '选中的' : '该'}${Array.isArray(id) ? '多个' : '一个'}配置项吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        await del(DELETE_API, { id })
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
    deleteConfset(selectedRows.value.map((item: any) => item.id))
  }
  /**
   * 处理弹窗提交事件
   */
  const handleUploadSubmit = () => {
    dialogVisible.value = false
    currentUploadData.value = {}
    ElMessage.success('上传成功')
    refreshUpdate()
  }
  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: any): void => {
    selectedRows.value = selection
    batchCategoryId.value = null
  }
</script>

<style scoped>
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
