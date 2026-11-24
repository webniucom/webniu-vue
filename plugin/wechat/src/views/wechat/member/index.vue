<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel
        v-if="config.group"
        collapsible
        class="art-full-height"
        min="230"
        size="230"
      >
        <Group
          :items="groupList"
          :groupid="groupid"
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
                  :disabled="config.groupid && groupid === 0"
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
            :grouplist="groupList"
            :loading="loading"
            @submit="handleSubmit"
          />
          <!-- 充值弹窗 -->
          <Recharge
            v-model:visible="rechargeVisible"
            :user="rechargeUser"
            :api="url"
            @success="refreshUpdate"
          />
          <!-- 余额/积分变动记录 -->
          <FinanceLog v-model:visible="logVisible" :uid="logUid" :api="url" />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post, del } from '@admin/core/request'
  import { ElMessage, ElMessageBox, ElTag, ElImage } from 'element-plus'
  import { wxImgUrl } from '@/utils/wximg'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import Recharge from './modules/recharge.vue'
  import FinanceLog from './modules/financelog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { IndexConfig, FormConfig } from './modules/types'
  import Group from './modules/group.vue'

  defineOptions({ name: 'General' })
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
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
  const groupid = ref(0)
  const groupname = ref('数据')

  const selectedRows = ref<any>([])
  // 搜索参数
  const searchForm = ref<any>({
    groupid: groupid.value,
    userid: '',
    openid: '',
    username: '',
    nickname: '',
    created_at: ''
  })

  const memberGroupOptions = computed(() =>
    groupList.value.map((item: any) => ({
      label: item.name,
      value: item.groupid
    }))
  )

  const searchFormItems = ref<any>([
    {
      label: '会员分组',
      labelWidth: '100px',
      key: 'groupid',
      type: 'select',
      props: {
        placeholder: '请选择会员分组',
        options: memberGroupOptions,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: '会员ID',
      labelWidth: '100px',
      key: 'userid',
      type: 'input',
      props: {
        placeholder: '请输入会员ID',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: '会员账户',
      labelWidth: '100px',
      key: 'username',
      type: 'input',
      props: {
        placeholder: '请输入会员账户',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: '会员名称',
      labelWidth: '100px',
      key: 'nickname',
      type: 'input',
      props: {
        placeholder: '请输入会员名称',
        clearable: true,
        onClear: () => {
          handleSearch(searchForm.value)
        }
      }
    },
    {
      label: '创建时间',
      labelWidth: '100px',
      key: 'created_at',
      type: 'datetime',
      props: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
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
  // 充值/变动记录（uid 为基座会员ID，即 wechat_users.userid）
  const rechargeVisible = ref(false)
  const rechargeUser = ref<any>()
  const logVisible = ref(false)
  const logUid = ref(0)
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
    refreshData
  } = useWnTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        //计算属性
        groupid: computed(() => {
          return groupid.value || 0
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
          prop: 'avatar',
          label: '头像',
          align: 'left',
          formatter: (row: any) => {
            const avatar = wxImgUrl(row.avatar) || '/app/webniu/images/avatar.png'
            return h(ElImage, {
              class: 'w-10 h-10 rounded-md flex! items-center justify-center',
              src: avatar,
              previewSrcList: [avatar],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          prop: 'groupid',
          label: '分组',
          align: 'left',
          formatter: (row: any) => {
            return groupList.value.find((item: any) => item.groupid === row.groupid)?.name || '-'
          }
        },
        {
          prop: 'username',
          label: '用户名/ID',
          align: 'left',
          showOverflowTooltip: true
        },
        {
          prop: 'nickname',
          label: '微信/昵称',
          align: 'left',
          showOverflowTooltip: true
        },
        {
          prop: 'openid',
          label: '微信绑定',
          align: 'left',
          showOverflowTooltip: true
        },
        {
          prop: 'mobile',
          label: '手机',
          align: 'left',
          showOverflowTooltip: true
        },
        {
          prop: 'email',
          label: '邮箱',
          align: 'left',
          showOverflowTooltip: true
        },
        {
          prop: 'money',
          label: '余额(元)',
          align: 'left'
        },
        {
          prop: 'score',
          label: '积分',
          align: 'left'
        },
        {
          prop: 'last_time',
          label: '登录时间',
          align: 'left',
          visible: false
        },
        {
          prop: 'last_ip',
          label: '登录ip',
          align: 'left',
          visible: false
        },
        {
          prop: 'join_time',
          label: '注册时间',
          align: 'left',
          visible: false
        },
        {
          prop: 'join_ip',
          label: '注册ip',
          align: 'left',
          visible: false
        },
        {
          prop: 'created_at',
          label: '创建时间',
          align: 'left',
          visible: false
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
          width: 240,
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h('div', {
                class: 'inline-flex items-center justify-center h-8 px-2.5 mr-2.5 text-sm c-p rounded-md align-middle bg-warning/12 text-warning',
                title: '余额/积分充值',
                onClick: () => showRecharge(row)
              }, () => '充值'),
              h('div', {
                class: 'inline-flex items-center justify-center h-8 px-2.5 mr-2.5 text-sm c-p rounded-md align-middle bg-info/12 text-info',
                title: '充值/变动记录',
                onClick: () => showLog(row)
              }, () => '记录'),
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
      groupid: groupid.value || 0,
      sex: 1,
      level: 0,
      money: 0,
      score: 0,
      status: 1
    }
    dialogVisible.value = true
  }
  // 打开充值弹窗（userid 为基座会员ID）
  const showRecharge = (row: any): void => {
    if (!row.userid) {
      ElMessage.warning('该用户未绑定会员，无法充值')
      return
    }
    rechargeUser.value = {
      id: row.userid,
      username: row.username,
      money: row.money,
      score: row.score
    }
    rechargeVisible.value = true
  }
  // 打开余额/积分变动记录
  const showLog = (row: any): void => {
    if (!row.userid) {
      ElMessage.warning('该用户未绑定会员，暂无变动记录')
      return
    }
    logUid.value = row.userid
    logVisible.value = true
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
    groupid.value = item.groupid
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
      // 如果当前选中的分组已被删除，选中第一个分组或清空
      if (groupid.value && !groupList.value.find((item: any) => item.groupid === groupid.value)) {
        groupid.value = groupList.value[0]?.groupid || 0
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
      // 初始化分组列表
      groupList.value = res.grouplist || []
      groupid.value = groupList.value[0]?.groupid || 0
      groupname.value = res.config.groupname || '数据'
      // 初始化弹窗标题
      title.value = res.config.title || '数据'
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
  :deep(.wn-splitter .el-splitter-bar .el-splitter-bar__horizontal-collapse-icon-start) {
    left: -9px !important;
  }
</style>
