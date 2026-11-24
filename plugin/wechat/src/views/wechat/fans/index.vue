<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <ElSplitter lazy class="wn-splitter">
      <ElSplitterPanel class="art-full-height">
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
                <ElDropdown placement="bottom-end" @command="handleAssignTag">
                  <ElButton class="h-8!" type="primary">
                    分配标签 <ArtSvgIcon icon="ri:arrow-down-s-line" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem
                        v-for="item in groupList.filter((g: any) => g.id !== 0)"
                        :key="item.id"
                        :command="item.tagid"
                      >
                        {{ item.name }}
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
                <ElDropdown placement="bottom-end">
                  <ElButton class="h-8!" type="primary">
                    同步操作 <ArtSvgIcon icon="ri:arrow-down-s-line" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem @click="syncDialogVisible = true">同步粉丝</ElDropdownItem>
                      <ElDropdownItem @click="handleSyncInfo">同步资料</ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
                <ElButton
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDelete"
                  v-ripple
                  plain
                  v-if="selectedRows.length > 0"
                  >删除{{ title }}</ElButton
                >
              </ElSpace>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable
            ref="tableRef"
            rowKey="fanid"
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
            :title="title"
            :data="data"
            :loading="loading"
            @submit="handleSubmit"
          />
          <!-- 同步粉丝弹窗 -->
          <SyncDialog
            v-model:visible="syncDialogVisible"
            :api-url="SYNC_API"
            @refresh="refreshData"
          />
        </ElCard>
      </ElSplitterPanel>
      <ElSplitterPanel v-if="config.group" collapsible class="art-full-height" min="230" size="230">
        <Group
          :items="groupList"
          :group="group"
          :config="config"
          :groupname="groupname"
          @nodeClick="handleNodeClick"
          @refresh="handleGroupRefresh"
        ></Group>
      </ElSplitterPanel>
    </ElSplitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag, ElPopover, ElImage } from 'element-plus'
  import { wxImgUrl } from '@/utils/wximg'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import SyncDialog from './modules/sync-dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { IndexConfig } from './modules/types'
  import Group from './modules/group.vue'

  defineOptions({ name: 'General' })
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const loadings = ref(false)

  const INDEX_API = url + '/index'
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  const SYNC_API = url + '/sync'
  const SYNCINFO_API = url + '/syncinfo'
  const TAG_API = url + '/tag'
  const UNTAG_API = url + '/untag'
  // config
  const config = ref<any>({})
  // 分组列表
  const groupList = ref<any>([])
  const group = ref(0)
  const groupname = ref('数据')

  const selectedRows = ref<any>([])
  // 搜索参数
  const searchForm = ref<any>({
    nickname: '',
    openid: ''
  })
  const searchFormItems = ref<any>([
    {
      label: '粉丝昵称',
      labelWidth: '100px',
      key: 'nickname',
      type: 'input',
      props: {
        placeholder: '请输入粉丝昵称',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: '粉丝openid',
      labelWidth: '100px',
      key: 'openid',
      type: 'input',
      props: {
        placeholder: '请输入粉丝openid',
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
  // 同步粉丝对话框
  const syncDialogVisible = ref(false)
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
  } = useWnTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
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
        {
          prop: 'uid',
          label: '会员ID',
          width: 90,
          align: 'left',
          formatter: (row: any) => {
            // uid 即 wn_webniu_user.id，可在会员列表按此ID查询对应会员
            return row.uid ? String(row.uid) : '-'
          }
        },
        {
          prop: 'subscribe',
          label: '是否关注',
          align: 'left',
          formatter: (row: any) => {
            return row.subscribe === 1 ? '是' : '否'
          }
        },
        {
          prop: 'headimgurl',
          label: '微信头像',
          align: 'left',
          formatter: (row: any) => {
            // 无头像时使用默认头像；微信官方头像走本地代理防防盗链
            const avatar = wxImgUrl(row.headimgurl) || '/app/webniu/images/avatar.png'
            return h(ElImage, {
              class: 'size-9.5 rounded-md flex! items-center justify-center',
              src: avatar,
              previewSrcList: [avatar],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          prop: 'nickname',
          label: '粉丝名称',
          align: 'left',
          formatter: (row: any) => {
            return row.nickname || '微信匿名'
          }
        },
        {
          prop: 'openid',
          label: 'OPENID',
          align: 'left',
          showOverflowTooltip: true,
        },
        {
          prop: 'tagid_list',
          label: '标签',
          width: 220,
          align: 'left',
          formatter: (row: any) => {
            // 解析 tagid_list（数据库存 JSON 字符串）
            let tagids: number[] = []
            if (row.tagid_list) {
              try {
                const parsed =
                  typeof row.tagid_list === 'string' ? JSON.parse(row.tagid_list) : row.tagid_list
                if (Array.isArray(parsed)) tagids = parsed
              } catch {
                tagids = []
              }
            }
            if (tagids.length === 0) return '-'

            // 表格里最多直接显示的标签数，超出折叠成 +N
            const maxVisible = 1
            const tagName = (tagid: number) => {
              const tag = groupList.value.find((g: any) => g.tagid === tagid)
              return tag?.name || `标签${tagid}`
            }
            // 单个标签节点（带 × 可移除）
            const renderTag = (tagid: number) =>
              h(
                ElTag,
                {
                  key: tagid,
                  closable: true,
                  type: 'info',
                  onClose: (e: Event) => {
                    e?.stopPropagation?.()
                    handleRemoveTag(row, tagid)
                  }
                },
                () => tagName(tagid)
              )

            const visible = tagids.slice(0, maxVisible)
            const rest = tagids.slice(maxVisible)
            const nodes = visible.map(renderTag)

            // 多余的折叠成 +N，点击弹出 Popover 展示剩余（也带 ×）
            if (rest.length > 0) {
              nodes.push(
                h(
                  ElPopover,
                  {
                    trigger: 'click',
                    placement: 'top',
                    width: 240,
                    showArrow: true
                  },
                  {
                    reference: () =>
                      h(
                        ElTag,
                        {
                          type: 'warning',
                          style: 'cursor: pointer'
                        },
                        () => `+${rest.length}`
                      ),
                    default: () =>
                      h(
                        'div',
                        { style: 'display: flex; flex-wrap: wrap; gap: 6px;' },
                        rest.map(renderTag)
                      )
                  }
                )
              )
            }

            return h(
              'div',
              { style: 'display: flex; flex-wrap: wrap; gap: 4px; align-items: center;' },
              nodes
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
                type: 'edit',
                vAuth: 'update',
                title: '点击备注',
                onClick: () => showDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
                title: '点击删除',
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
        // WechatFans 主键为 fanid，映射出 id 供 rowKey/删除/编辑使用
        return records.map((r: any) => ({ ...r, id: r.fanid }))
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
        await del(DELETE_API, { fanid: row.fanid })
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
        await del(DELETE_API, { fanid: selectedRows.value.map((item: any) => item.fanid) })
        ElMessage.success('删除成功')
        refreshUpdate()
      })
      .catch(() => {
        return
      })
  }
  /**
   * 给选中粉丝打标签
   * @param tagid 标签的微信 tagid（来自 groupList 的 item.tagid）
   */
  const handleAssignTag = (tagid: number) => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选要打标签的粉丝')
      return
    }
    const openids = selectedRows.value.map((r: any) => r.openid)
    ElMessageBox.confirm(`确定要为选中的 ${openids.length} 个粉丝打上此标签吗？`, '打标签确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
      beforeClose: async (action, instance, done) => {
        if (action !== 'confirm') {
          done()
          return
        }
        instance.confirmButtonLoading = true
        instance.confirmButtonText = '打标签中...'
        try {
          await post(TAG_API, { openid: openids, tagid })
          done()
          ElMessage.success('打标签成功')
          refreshUpdate()
        } catch (e) {
          console.error('打标签失败:', e)
          ElMessage.error('打标签失败，请重试')
          instance.confirmButtonLoading = false
          instance.confirmButtonText = '确定'
        }
      }
    }).catch(() => {})
  }
  /**
   * 移除单个粉丝的单个标签（点击标签上的 ×）
   * @param row 粉丝行数据
   * @param tagid 要移除的标签微信 tagid
   */
  const handleRemoveTag = (row: any, tagid: number) => {
    ElMessageBox.confirm('确定要移除该粉丝的此标签吗？', '移除标签确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: async (action, instance, done) => {
        if (action !== 'confirm') {
          done()
          return
        }
        instance.confirmButtonLoading = true
        instance.confirmButtonText = '移除中...'
        try {
          await post(UNTAG_API, { openid: row.openid, tagid })
          done()
          ElMessage.success('移除标签成功')
          refreshUpdate()
        } catch (e) {
          console.error('移除标签失败:', e)
          ElMessage.error('移除标签失败，请重试')
          instance.confirmButtonLoading = false
          instance.confirmButtonText = '确定'
        }
      }
    }).catch(() => {})
  }
  /**
   * 同步资料（对勾选粉丝批量拉取微信最新资料更新到本地）
   */
  const handleSyncInfo = () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选要同步资料的粉丝')
      return
    }
    const openids = selectedRows.value.map((r: any) => r.openid)
    ElMessageBox.confirm(
      `确定要同步选中的 ${openids.length} 个粉丝的最新资料吗？同步将从微信服务器拉取数据，可能需要一些时间。`,
      '同步资料确认',
      {
        confirmButtonText: '开始同步',
        cancelButtonText: '取消',
        type: 'info',
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') {
            done()
            return
          }
          instance.confirmButtonLoading = true
          instance.confirmButtonText = '同步中...'
          try {
            const res: any = await post(SYNCINFO_API, { openid: openids })
            done()
            ElMessage.success(`同步完成，已更新 ${res.updated} 个粉丝资料`)
            refreshUpdate()
          } catch (e) {
            console.error('同步资料失败:', e)
            ElMessage.error('同步资料失败，请重试')
            instance.confirmButtonLoading = false
            instance.confirmButtonText = '开始同步'
          }
        }
      }
    ).catch(() => {})
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
    group.value = item.tagid
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

      if (group.value && !groupList.value.find((item: any) => item.tagid === group.value)) {
        group.value = groupList.value[0]?.tagid || 0
      }

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

      groupList.value = res.grouplist || []
      group.value = groupList.value[0]?.tagid || 0
      groupname.value = res.config.groupname || '数据'
      layout.value = res.config.layout || 'refresh'

      if (resetColumns) {
        resetColumns()
      }
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
  :deep(.wn-splitter .el-splitter-bar .el-splitter-bar__horizontal-collapse-icon-end) {
    left: 8px !important;
  }
</style>
