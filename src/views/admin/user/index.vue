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
          <!-- 充值弹窗 -->
          <Recharge
            v-model:visible="rechargeVisible"
            :user="currentData"
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
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'
  import { useTable } from '@/hooks/core/useTable'
  import { get, post, del } from '@/api/common-request'
  import { ElMessage, ElMessageBox, ElTag, ElImage } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import Recharge from './modules/recharge.vue'
  import FinanceLog from './modules/financelog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  defineOptions({ name: 'SmsTemp' })
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)
  const loadings = ref(false)

  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({
    title: '会员',
    layout: 'refresh,size,fullscreen,columns,settings',
    url: url
  })
  // 搜索参数
  const selectedRows = ref<any>([])
  const searchForm = ref<any>({
    id: '',
    name: ''
  })
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()
  // 充值/变动记录
  const rechargeVisible = ref(false)
  const logVisible = ref(false)
  const logUid = ref(0)

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
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'asc',
        field: 'sort'
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          label: '用户名',
          prop: 'username',
          minWidth: 140,
          formatter: (row: any) =>
            h(
              'span',
              {
                class:
                  'inline-block max-w-40 truncate align-middle cursor-pointer hover:text-primary',
                title: '点击复制用户名',
                onClick: () => copyText(row.username)
              },
              row.username || '-'
            )
        },
        {
          label: '昵称',
          prop: 'nickname'
        },
        {
          label: '头像',
          prop: 'avatar',
          align: 'left',
          formatter: (row: any) => {
            const fallback = '/app/webniu/images/avatar.png'
            const src = row.avatar || fallback
            return h(
              ElImage,
              {
                class: 'size-9.5 rounded-md flex! items-center justify-center',
                src,
                previewSrcList: row.avatar ? [row.avatar] : [fallback],
                // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
                previewTeleported: true,
                fit: 'cover'
              },
              {
                // 头像加载失败时用基座默认头像托底
                error: () =>
                  h('img', {
                    class: 'size-9.5 rounded-md object-cover',
                    src: fallback,
                    alt: 'avatar'
                  })
              }
            )
          }
        },
        {
          label: '性别',
          prop: 'gender',
          align: 'center',
          formatter: (row: any) => (row.gender === 1 ? '男' : '女')
        },
        {
          label: '邮箱',
          prop: 'email'
        },
        {
          label: '手机号',
          prop: 'mobile'
        },
        {
          label: '等级',
          prop: 'level'
        },
        {
          label: '生日',
          prop: 'birthday'
        },
        {
          label: '余额(元)',
          prop: 'money'
        },
        {
          label: '积分',
          prop: 'score'
        },
        {
          label: '登录时间',
          prop: 'last_time',
          visible: false
        },
        {
          label: '登录ip',
          prop: 'last_ip',
          visible: false
        },
        {
          label: '注册时间',
          prop: 'join_time',
          visible: false
        },
        {
          label: '注册ip',
          prop: 'join_ip',
          visible: false
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          align: 'center',
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
          width: 280,
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
  // 复制文本（非 HTTPS 环境回退 execCommand）
  const copyText = async (text: string) => {
    if (!text) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      ElMessage.success('用户名已复制')
    } catch {
      ElMessage.error('复制失败，请手动选择复制')
    }
  }
  // 打开弹窗添加or编辑
  const showDialog = (type: string, row?: any): void => {
    dialogType.value = type
    currentData.value = row || {
      username: '',
      nickname: '',
      gender: 1,
      email: '',
      mobile: '',
      level: 0,
      birthday: '',
      status: 1
    }
    dialogVisible.value = true
  }
  // 打开充值弹窗
  const showRecharge = (row: any): void => {
    currentData.value = row
    rechargeVisible.value = true
  }
  // 打开余额/积分变动记录
  const showLog = (row: any): void => {
    logUid.value = row.id
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
