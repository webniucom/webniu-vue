<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <ElSplitter lazy class="wn-splitter">
      <ElSplitterPanel class="art-full-height">
        <Search v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></Search>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader v-model:columns="columnChecks" :layout="layout" :loading="loading" @refresh="refreshData">
            <template #left>
              <ElSpace wrap>
                <ElTooltip
                  :disabled="!createLimitReached"
                  :content="`最多可创建 ${config.create_limit} 个公众号，已达上限`"
                  placement="top"
                >
                  <span>
                    <ElButton v-if="config.can_create" v-auth="'insert'" type="primary" class="h-8!" :disabled="createLimitReached" @click="adddialog" v-ripple>新增{{ title }}
                    </ElButton>
                  </span>
                </ElTooltip>
                <ElButton v-if="selectedRows.length > 0" v-auth="'delete'" type="danger" class="h-8!" @click="allDelete"
                  v-ripple plain>删除{{ title }}</ElButton>
              </ElSpace>
            </template>
            <template #right>
              <ElTooltip v-if="hasAuth('setconfig') && isSuper" class="box-item" effect="dark" content="全局公众号配置"
                placement="top-end">
                <div
                  class="size-8 flex items-center justify-center cursor-pointer rounded-md bg-g-300/55 dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0 md:mr-2.5"
                  @click="setConfigfun">
                  <ArtSvgIcon icon="ri:settings-line" class="text-g-600" />
                </div>
              </ElTooltip>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable ref="tableRef" rowKey="id" :loading="loading" :data="data" :columns="columns"
            :pagination="pagination" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :default-expand-all="false" @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange">
          </ArtTable>
          <!-- 配置弹窗 -->
          <Dialog v-model:visible="dialogVisible" v-model:editData="currentData" :type="dialogType" :items="form"
            :title="title" :datalist="data" :options="levelOptions" :loading="loading" :can-manage="!!config.can_create" @submit="handleSubmit" />
        </ElCard>
      </ElSplitterPanel>
    </ElSplitter>
    <ElDialog v-model="alertVisible" class="art-alert-dialog" width="550px" title="接入方式" align-center>
      <div class="flex gap-4">
        <div
          class="flex-1 p-4 border border-gray-200 rounded-lg flex flex-col hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer">
          <b class="block mb-2">手动添加公众号</b>
          <p class="text-gray-500 text-sm mb-3 flex-1">
            通过微信公众平台基本配置获取AppID和AppSecret，添加成功后，将本平台获取的服务器配置接口绑定到微信公众平台（注：添加过程中，请务必保持参数一致）</p>
          <ElButton type="primary" :icon="Plus" class="h-8!" @click="showDialog('insert')" v-ripple plain>手动添加公众号
          </ElButton>
        </div>
        <div :class="[
          'flex-1 p-4 border border-gray-200 rounded-lg flex flex-col transition-all duration-200',
          !formdata.wechatopentype || formdata.wechatopentype !== 1
            ? 'opacity-60 cursor-not-allowed bg-gray-50'
            : 'hover:bg-gray-50 hover:shadow-sm cursor-pointer'
        ]">
          <b class="block mb-2">授权添加公众号</b>
          <p class="text-gray-500 text-sm mb-3 flex-1">使用授权添加需认证微信开放平台和全网发布，并在微信开放平台设置中启用</p>
          <ElButton :disabled="!formdata.wechatopentype || formdata.wechatopentype !== 1" type="primary" :icon="Plus"
            @click="handleAddAuth" v-ripple class="h-8!" plain>授权添加公众号</ElButton>
        </div>
      </div>
    </ElDialog>
    <!-- 扫码授权等待弹窗：官方授权页在新窗口打开（页面自带二维码），本页轮询入库结果 -->
    <ElDialog v-model="authQrVisible" title="微信扫码授权" width="380px" align-center :close-on-click-modal="false"
      @close="stopAuthPolling">
      <div class="auth-qr-box">
        <ElIcon class="auth-wait-icon">
          <Loading />
        </ElIcon>
        <p class="qr-tip">已打开微信官方授权页，请使用微信「扫一扫」</p>
        <p class="qr-sub">在手机上确认授权后，公众号将自动添加到列表</p>
        <p class="qr-warn">若新窗口被浏览器拦截，请允许弹窗后重新点击</p>
        <ElButton class="mt-3" plain @click="reopenAuthPage">重新打开授权页</ElButton>
      </div>
    </ElDialog>
    <!-- 配置弹窗 -->
    <Config v-model:visible="configVisible" :formdata="formdata" @submit="handleSubmitConfig"></Config>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { toAdminApiUrl } from '@admin/core/utils/controller'
import { useWnTable } from '@admin/core/table/useWnTable'
import { get, post, del } from '@admin/core/request'
import { ElMessage, ElMessageBox, ElTag, ElImage } from 'element-plus'
import Search from './modules/search.vue'
import Dialog from './modules/dialog.vue'
import Config from './modules/config.vue'
import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
import { FormConfig } from './modules/types'
import { Plus, Loading } from '@element-plus/icons-vue'
import { useAuth } from '@admin/core/auth/useAuth'
import { useUserStore } from '@stores/modules/user'
import { wxImgUrl } from '@/utils/wximg'

defineOptions({ name: 'Wechat' })

const { hasAuth } = useAuth()
const userStore = useUserStore()
// 仅创始人账户（超管）可设置全局公众号配置
const isSuper = computed(() => !!userStore?.getUserInfo?.isSuperAdmin)
const route = useRoute()
const url = toAdminApiUrl(route.meta.key as string)
const form = ref<FormConfig[]>([])
const loadings = ref(false)
const formdata = ref<any>({})

const CONFIG_API = url + '/config'
const SETCONFIG_API = url + '/setconfig'
const UPDATE_API = url + '/update'
const INSERT_API = url + '/insert'
const SELECT_API = url + '/select'
const DELETE_API = url + '/delete'
const AUTH_API = url + '/auth'
// config
const config = ref<any>({})
// 是否已达创建上限（角色「限制」nums，0=不限制）
const createLimitReached = computed(
  () => Number(config.value.create_limit || 0) > 0 && Number(config.value.create_count || 0) >= Number(config.value.create_limit)
)
const levelOptions = ref<any>([
  {
    label: '订阅号',
    value: 1
  },
  {
    label: '服务号',
    value: 2
  }
])
// 全局配置参数
const configVisible = ref(false)
// 接入方式参数
const alertVisible = ref(false)
// 扫码授权弹窗
const authQrVisible = ref(false)
// 官方授权页 URL（供弹窗内"重新打开"使用）
const authUrl = ref('')
// 搜索参数
const selectedRows = ref<any>([])
const searchForm = ref<any>({ name: '', level: '' })
const layout = ref('refresh')
// 弹窗参数
const dialogVisible = ref(false)
const dialogType = ref('insert')
const currentData = ref<any>()
// 弹窗标题
const title = ref('数据')
//加载配置数据
const fetchGetConfig = () => {
  return get(CONFIG_API)
}
//加载数据列表
const fetchGetList = (params: any) => {
  return get(SELECT_API, params)
}
/**
 * POST 提交 id 到目标地址并跳转
 * 通过隐藏表单提交，实现 POST 方式携带 id 进入 row.url 页面
 */
const submitAndGo = (row: any) => {
  if (!row?.url) {
    ElMessage.warning('未配置跳转地址')
    return
  }
  const formEl = document.createElement('form')
  formEl.method = 'POST'
  formEl.action = row.url
  formEl.style.display = 'none'
  const idInput = document.createElement('input')
  idInput.type = 'hidden'
  idInput.name = 'id'
  idInput.value = String(row.id ?? '')
  formEl.appendChild(idInput)
  document.body.appendChild(formEl)
  formEl.submit()
  document.body.removeChild(formEl)
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
      { prop: 'id', label: '编号', align: 'left' },
      {
        prop: 'logo',
        label: 'LOGO',
        align: 'left',
        formatter: (row: any) => {
          // 微信官方 CDN 图片有防盗链，走本地代理；自定义上传的地址原样使用
          const logoSrc = wxImgUrl(row.logo)
          return h(ElImage, {
            class: 'w-10 h-10 rounded-md flex! items-center justify-center',
            src: logoSrc,
            previewSrcList: logoSrc ? [logoSrc] : [],
            // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
            previewTeleported: true
          })
        }
      },
      {
        prop: 'name',
        label: '名称',
        align: 'left'
      },
      {
        prop: 'level',
        label: '类型',
        align: 'left',
        showOverflowTooltip: true,
        formatter: (row: any) => {
          return levelOptions.value.find((item: any) => item.value === row.level)?.label || '-'
        }
      },
      {
        prop: 'isconnect',
        label: '接入方式',
        align: 'left',
        formatter: (row: any) => {
          return h(ElTag, { type: row.isconnect === 1 ? 'success' : 'primary' }, () =>
            row.isconnect === 1 ? '授权接入' : '手动接入'
          )
        }
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
        prop: 'valid_at',
        label: '有效时间',
        align: 'left',
        width: 200,
        showOverflowTooltip: true,
        formatter: (row: any) => {
          if (!row.valid_at) return h(ElTag, { type: 'success' }, () => '不限制')
          const expired = new Date(String(row.valid_at).replace(/-/g, '/')).getTime() < Date.now()
          return h('div', { class: 'flex items-center gap-1' }, [
            h('span', row.valid_at),
            h(ElTag, { type: expired ? 'danger' : 'success', size: 'small' }, () =>
              expired ? '已到期' : '有效'
            )
          ])
        }
      },
      {
        prop: 'created_at',
        label: '创建时间',
        align: 'left',
        visible: false,
        showOverflowTooltip: true
      },
      {
        prop: 'operation',
        label: '操作',
        fixed: 'right',
        width: 160,
        align: 'right',
        formatter: (row: any) =>
          h('div', { style: 'text-align: right' }, [
            h(ArtButtonTable, {
              type: 'add',
              vAuth: 'update',
              icon: 'ri:send-plane-line',
              onClick: () => {
                submitAndGo(row)
              }
            }),
            h(ArtButtonTable, {
              type: 'edit',
              vAuth: 'update',
              onClick: () => {
                // 只有在编辑不同行时才更新 currentData
                if (!currentData.value || currentData.value.id !== row.id) {
                  currentData.value = row
                }
                showDialog('update')
              }
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
const adddialog = () => {
  alertVisible.value = true
}
// 打开弹窗添加or编辑
const showDialog = (type: string): void => {
  alertVisible.value = false
  dialogType.value = type
  // 新增时重置数据，编辑时保持 currentData（原数据或 emit 更新后的数据）
  if (type === 'insert') {
    currentData.value = {
      isconnect: 0
    }
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
 * 全局配置
 */
const setConfigfun = () => {
  configVisible.value = true
}
/**
 * 提交全局配置
 * @param data 数据
 */
const handleSubmitConfig = async (data: any): Promise<void> => {
  configVisible.value = false
  try {
    await post(SETCONFIG_API, {
      label: 'wechatconfig',
      value: data
    })
    ElMessage.success('全局配置更新成功')
    formdata.value = data || {}
  } catch (error) {
    ElMessage.error('全局配置更新失败')
    return console.error(error)
  }
}

/**
 * 授权添加公众号
 * 1. 调后端生成微信开放平台扫码授权链接（含预授权码）
 * 2. 新窗口打开授权页，用户扫码确认后微信回跳 authback 自动入库
 * 3. 本页轮询列表，发现新授权公众号自动刷新并提示
 */
const AUTH_POLL_INTERVAL = 3000
const AUTH_POLL_MAX = 60 // 60次 x 3秒 = 180秒，给扫码确认留足时间
let authPollTimer: ReturnType<typeof setInterval> | null = null
let authPollCount = 0
// 轮询基线：弹窗打开时最新一条记录的快照。
// 之后出现「新增」（id/total 变大）或「重新授权」（同 app_id 走 upsert，updated_at 变新）都算授权完成
let authBaseline: { maxId: number; maxUpdatedAt: string; total: number } | null = null

// ===== 授权结果回传监听（authback 结果页 postMessage 主通道 + localStorage 同源兜底）=====
const AUTH_RESULT_TYPE = 'wechat-auth-result'
const AUTH_RESULT_KEY = 'wechat_auth_result'
let authWatchStartedAt = 0

const handleAuthResult = (ok: boolean, message?: string): void => {
  stopAuthPolling()
  authQrVisible.value = false
  if (ok) {
    ElMessage.success('授权成功，公众号已添加')
    getData()
  } else {
    ElMessage.error(message || '授权失败')
  }
}

// 只接受本次授权窗口开启之后产生的结果，忽略历史残留
const isFreshAuthResult = (d: any): boolean =>
  !!d && d.type === AUTH_RESULT_TYPE && Number(d.ts || 0) >= authWatchStartedAt

const onAuthMessage = (e: MessageEvent): void => {
  if (isFreshAuthResult(e?.data)) {
    handleAuthResult(!!e.data.ok, e.data.message)
  }
}

const onAuthStorage = (e: StorageEvent): void => {
  if (e.key !== AUTH_RESULT_KEY || !e.newValue) return
  try {
    const d = JSON.parse(e.newValue)
    if (isFreshAuthResult(d)) handleAuthResult(!!d.ok, d.message)
  } catch {
    // 非 JSON 忽略
  }
}

const stopAuthPolling = (): void => {
  if (authPollTimer) {
    clearInterval(authPollTimer)
    authPollTimer = null
  }
  window.removeEventListener('message', onAuthMessage)
  window.removeEventListener('storage', onAuthStorage)
}

// 按 updated_at 倒序取最新一条：插入/更新都会顶到最前
const fetchLatestRow = async (): Promise<{
  maxId: number
  maxUpdatedAt: string
  total: number
}> => {
  const res: any = await get(SELECT_API, {
    page: 1,
    limit: 1,
    order: 'desc',
    field: 'updated_at'
  })
  const row = res?.records?.[0]
  return {
    maxId: Number(row?.id || 0),
    maxUpdatedAt: String(row?.updated_at || ''),
    total: Number(res?.total ?? 0)
  }
}

const startAuthPolling = async (): Promise<void> => {
  stopAuthPolling()
  authPollCount = 0
  authBaseline = null
  // 主通道：监听 authback 结果页回传（覆盖新增/重新授权/失败，即时关闭弹窗）
  authWatchStartedAt = Date.now()
  window.addEventListener('message', onAuthMessage)
  window.addEventListener('storage', onAuthStorage)
  try {
    authBaseline = await fetchLatestRow()
  } catch {
    // 基线获取失败：首轮成功轮询时补基线，避免把存量数据误判为新增
  }
  authPollTimer = setInterval(async () => {
    authPollCount++
    if (authPollCount > AUTH_POLL_MAX) {
      stopAuthPolling()
      authQrVisible.value = false
      ElMessage.warning('等待授权超时，如已完成授权请手动刷新列表')
      return
    }
    try {
      const latest = await fetchLatestRow()
      if (!authBaseline) {
        authBaseline = latest
        return
      }
      const hasInsert = latest.maxId > authBaseline.maxId || latest.total > authBaseline.total
      const hasUpdate =
        latest.maxUpdatedAt !== '' && latest.maxUpdatedAt > authBaseline.maxUpdatedAt
      if (hasInsert || hasUpdate) {
        stopAuthPolling()
        authQrVisible.value = false
        ElMessage.success('授权成功，公众号已添加')
        getData()
      }
    } catch {
      // 轮询失败静默忽略，下轮重试
    }
  }, AUTH_POLL_INTERVAL)
}

/**
 * 授权添加公众号
 * 1. 调后端生成微信开放平台 PC 扫码授权链接（componentloginpage，官方页面自带二维码）
 * 2. 新窗口打开官方授权页，用户微信扫码确认后回跳 authback 自动入库
 * 3. 本页轮询列表，检测到新增即关闭弹窗并刷新
 */
const openAuthPage = (url: string): void => {
  const win = window.open(url, '_blank')
  if (!win) {
    ElMessage.warning('浏览器拦截了新窗口，请允许弹出窗口后点击「重新打开授权页」')
  }
}

const reopenAuthPage = (): void => {
  if (authUrl.value) openAuthPage(authUrl.value)
}

const handleAddAuth = async (): Promise<void> => {
  alertVisible.value = false
  try {
    const res: any = await get(AUTH_API)
    if (!res?.url) {
      ElMessage.error('获取授权链接失败')
      return
    }
    authUrl.value = res.url
    // 新窗口打开微信官方扫码授权页（页面自带二维码）
    openAuthPage(res.url)
    // 本弹窗保持轮询，等待扫码授权完成入库
    authQrVisible.value = true
    startAuthPolling()
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || '获取授权链接失败，请检查开放平台配置')
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
    const configData = await fetchGetConfig()
    // 初始化配置
    config.value = configData.config || {}
    config.value.url = url
    formdata.value = configData.wechatconfig || {}
    // 初始化弹窗标题
    title.value = config.value.title || '数据'
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
// 页面卸载停止授权轮询
onUnmounted(() => {
  stopAuthPolling()
})
</script>
<style scoped>
:deep(.el-splitter-bar__dragger-horizontal:after),
:deep(.el-splitter-bar__dragger-horizontal:before) {
  width: 0px;
}

.art-alert-dialog :global(.el-dialog__body) {
  padding: 0px !important;
}

.auth-qr-box {
  text-align: center;
  padding: 8px 4px 4px;
}

.auth-wait-icon {
  font-size: 42px;
  color: var(--el-color-primary);
  margin-bottom: 14px;
  animation: auth-spin 1.4s linear infinite;
}

@keyframes auth-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.qr-tip {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.qr-sub {
  margin: 0 0 10px;
  font-size: 13px;
  color: #606266;
}

.qr-warn {
  margin: 0;
  font-size: 12px;
  color: #909399;
}
</style>
