<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="wechat-dialog"
    header-class="wechat-dialog-header"
    body-class="wechat-dialog-body"
    @closed="handleClosed"
  >
    <template #header>
      <div class="my-header ml-2">
        <el-radio-group v-model="activeName">
          <el-radio-button value="basic">基本信息</el-radio-button>
          <el-radio-button v-if="props.type === 'update' && props.canManage !== false && hasAuth('userset')" value="group"
            >用户分组</el-radio-button
          >
          <el-radio-button v-if="props.type === 'update' && props.canManage !== false" value="appgroup"
            >应用分组</el-radio-button
          >
          <el-radio-button v-if="props.type === 'update'" value="params">通信接口</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <div v-if="activeName === 'group'" class="group-config">
      <el-alert
        title="用户分组管理"
        type="primary"
        description="管理公众号绑定的用户列表"
        show-icon
      />
      <!-- 标题行 -->
      <div class="group-header-row mb-3 flex items-center mt-3">
        <div class="w-[80px] font-medium text-gray-700">头像</div>
        <div class="flex-1 font-medium text-gray-700">昵称</div>
        <div class="w-[150px] font-medium text-gray-700">用户名</div>
        <div class="w-[80px]"></div>
      </div>
      <!-- 用户列表 -->
      <div v-for="item in userList" :key="item.id" class="group-item mb-2 flex items-center">
        <div class="w-[80px]">
          <ElAvatar :src="wxImgUrl(item.avatar)" class="w-8 h-8" :icon="User" />
        </div>
        <div class="flex-1 text-gray-800">{{ item.nickname }}</div>
        <div class="w-[150px] text-gray-600">{{ item.username }}</div>
        <div class="w-[80px]" style="text-align: right">
          <ElButton
            v-if="hasAuth('userdel')"
            type="danger"
            size="small"
            @click="removeUser(item.id)"
            :disabled="item.id === formData?.admin_id"
            plain
          >
            解绑
          </ElButton>
        </div>
      </div>
      <div class="mb-2">
        <ElButton
          v-if="hasAuth('useradd')"
          class="mt-1"
          type="primary"
          size="small"
          @click="addUser"
          plain
        >
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          添加用户
        </ElButton>
      </div>
    </div>

    <div v-if="activeName === 'appgroup'" class="appgroup-config">
      <el-alert
        title="应用分组"
        type="primary"
        description="一个公众号可以同时属于多个应用分组，保存后生效"
        show-icon
      />
      <div class="mt-4">
        <ElSelect
          v-model="formData.group_ids"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择应用分组"
          style="width: 100%"
        >
          <ElOption
            v-for="item in groupOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
      </div>
    </div>

    <div v-if="activeName === 'params'" class="params-config">
      <el-alert
        title="配置说明"
        type="primary"
        description="请将以下配置信息填写到微信公众平台的基本配置中"
        show-icon
      />
      <!-- 标题行 -->
      <div class="params-header-row mb-3 flex items-center mt-3">
        <div class="w-[100px] font-medium text-gray-700">配置项</div>
        <div class="flex-1 font-medium text-gray-700">配置值</div>
        <div class="w-[140px]"></div>
      </div>
      <!-- 服务器地址 -->
      <div class="params-item mb-2 flex items-center">
        <div class="w-[100px] text-gray-600">服务器地址</div>
        <div class="flex-1 text-gray-800 break-all">{{ formData.serviceurl }}</div>
        <ElButton size="small" @click="copyToClipboard(formData.serviceurl)"> 复制 </ElButton>
      </div>
      <!-- 令牌 -->
      <div class="params-item mb-2 flex items-center">
        <div class="w-[100px] text-gray-600">令牌</div>
        <div class="flex-1 text-gray-800 break-all">{{ formData.token }}</div>
        <div class="flex gap-1">
          <ElButton type="primary" size="small" @click="generateToken">生成</ElButton>
          <ElButton size="small" @click="copyToClipboard(formData.token)">复制</ElButton>
        </div>
      </div>
      <!-- 解密密钥 -->
      <div class="params-item mb-2 flex items-center">
        <div class="w-[100px] text-gray-600">解密密钥</div>
        <el-text class="w-400px flex-1 text-gray-800 break-all" truncated line-clamp="1">{{
          formData.aes_key
        }}</el-text>
        <div class="flex gap-1">
          <ElButton type="primary" size="small" @click="generateAesKey">生成</ElButton>
          <ElButton size="small" @click="copyToClipboard(formData.aes_key)">复制</ElButton>
        </div>
      </div>
    </div>
    <ArtForm
      v-if="activeName === 'basic'"
      ref="formRef"
      v-model="formData"
      :items="formItems"
      :rules="rules"
      label-width="80px"
      :show-reset="false"
      :show-submit="false"
    >
    </ArtForm>
    <template #footer>
      <div class="wechat-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
    <ElDialog v-model="userlistDialogVisible" title="用户列表" width="500" align-center>
      <template #default>
        <ArtSearchBar
          ref="searchBarRef"
          v-model="SearchformData"
          :items="SearchFormItems"
          @reset="resetSearchParams"
          @search="handleSearch"
        >
        </ArtSearchBar>
        <ArtTable
          ref="userlistRef"
          rowKey="id"
          height="293"
          :loading="loading"
          :data="data"
          :columns="columns"
          :show-pagination="false"
          :default-expand-all="false"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        ></ArtTable>
      </template>
      <template #footer>
        <div class="dialog-footer flex justify-between items-center w-full">
          <ElPagination
            v-model:current-page="pagination.current"
            :page-size="pagination.size"
            :total="pagination.total"
            :layout="'prev, pager, next'"
            @current-change="handleCurrentChange"
          />
          <div>
            <el-button @click="userlistDialogVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </ElDialog>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { ElMessage, ElImage } from 'element-plus'
  import { User } from '@element-plus/icons-vue'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, post } from '@admin/core/request'
  import { useAuth } from '@admin/core/auth/useAuth'
  import { useUserStore } from '@stores/modules/user'
  import { wxImgUrl } from '@/utils/wximg'

  const { hasAuth } = useAuth()
  const userStore = useUserStore()
  // 有效期仅超管可设置
  const isSuper = computed(() => !!userStore?.getUserInfo?.isSuperAdmin)

  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
    items?: any[]
    datalist?: any[]
    options?: any[]
    // 受限账户（非超管创建的子账户）为 false：隐藏用户分组/应用分组
    canManage?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'update:editData', data: any): void
    (e: 'submit', data: any): void
  }
  //搜索
  const searchBarRef = ref()
  const SearchformData = ref<any>({ username: '' })
  const SearchFormItems = computed(() => [
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      labelWidth: '60px',
      span: 16,
      props: {
        placeholder: '请输入用户名'
      }
    }
  ])
  const props = defineProps<Props>()
  const levelOptions = ref<any>(props.options || [])
  const emit = defineEmits<Emits>()

  const data_id = ref<number>(0)
  // 用户列表对话框显示控制
  const userlistDialogVisible = ref<boolean>(false)
  // 已绑定用户列表数据
  const userList = ref<any[]>([])
  // 添加用户
  const addUser = () => {
    userlistDialogVisible.value = true
    userlistselectedRows.value = []
    getData()
  }

  const title = computed(() => {
    if (props.type === 'update') return `编辑${props.title}`
    return `新增${props.title}`
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '平台图标',
      labelWidth: '100px',
      key: 'logo',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请选择平台图标',
        tooltip: true,
        multiple: false,
        uploadlist: true,
        action: '/app/webniu/admin/upload/insert'
      },
      rules: [
        {
          required: true,
          message: '请选择平台图标',
          trigger: 'change'
        }
      ]
    },
    {
      label: '平台二维码',
      labelWidth: '100px',
      key: 'qrcode',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请选择平台二维码',
        tooltip: true,
        multiple: false,
        uploadlist: true,
        action: '/app/webniu/admin/upload/insert'
      },
      rules: [
        {
          required: true,
          message: '请选择平台二维码',
          trigger: 'change'
        }
      ]
    },
    {
      label: '平台名称',
      labelWidth: '100px',
      key: 'name',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入平台名称',
        tooltip: true,
        multiple: false,
        uploadlist: true
      },
      rules: [
        {
          required: true,
          message: '请输入平台名称',
          trigger: 'change'
        }
      ]
    },
    {
      label: '平台描述',
      labelWidth: '100px',
      key: 'description',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入平台描述',
        tooltip: true,
        type: 'textarea',
        rows: 3
      },
      rules: [
        {
          required: false,
          message: '请输入平台描述',
          trigger: 'change'
        }
      ]
    },
    {
      label: '平台类型',
      labelWidth: '100px',
      key: 'level',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择平台类型',
        tooltip: true,
        options: levelOptions.value
      },
      rules: [
        {
          required: true,
          message: '请选择平台类型',
          trigger: 'change'
        }
      ]
    },
    {
      label: '原始ID',
      labelWidth: '100px',
      key: 'original',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入原始ID',
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入原始ID',
          trigger: 'change'
        }
      ]
    },
    {
      label: 'AppId',
      labelWidth: '100px',
      key: 'app_id',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入AppId',
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入AppId',
          trigger: 'change'
        }
      ]
    },
    {
      label: 'AppSecret',
      labelWidth: '100px',
      key: 'secret',
      type: 'input',
      span: 24,
      props: {
        placeholder: isAuthConnect.value ? '授权接入可留空' : '请输入AppSecret',
        tooltip: true
      },
      rules: isAuthConnect.value
        ? []
        : [
            {
              required: true,
              message: '请输入AppSecret',
              trigger: 'change'
            }
          ]
    },
    {
      label: '接入方式',
      labelWidth: '100px',
      key: 'isconnect',
      type: 'radiogroup',
      span: 24,
      props: {
        placeholder: '请选择接入方式',
        tooltip: true,
        disabled: true,
        options: [
          {
            label: '手动接入',
            value: 0
          },
          {
            label: '授权接入',
            value: 1
          }
        ]
      }
    },
    ...(isSuper.value
      ? [
          {
            label: '有效期',
            labelWidth: '100px',
            key: 'valid_at',
            type: 'datetime',
            span: 24,
            props: {
              placeholder: '留空则按全局赠送天数计算',
              tooltip: true,
              clearable: true,
              type: 'datetime',
              valueFormat: 'YYYY-MM-DD HH:mm:ss',
              style: { width: '100%' }
            }
          }
        ]
      : []),
    {
      label: '状态',
      labelWidth: '100px',
      key: 'status',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '请选择状态',
        tooltip: true,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
      }
    }
  ])
  // 选项名称
  const activeName = ref('basic')
  const formRef = ref<any>()
  const defaultdata = {
    logo: '',
    qrcode: '',
    isconnect: 0,
    status: 1
  }
  // 表单数据
  const formData = ref<any>({})
  // 授权接入（isconnect=1）时 AppSecret 可不填
  const isAuthConnect = computed(() => Number(formData.value?.isconnect ?? 0) === 1)
  // 表单验证规则
  const rules = {}

  // 应用分组选项
  const groupOptions = ref<any[]>([])
  const loadGroupOptions = async () => {
    try {
      const res: any = await get('/wechat/admin/appgroup/options')
      groupOptions.value = Array.isArray(res) ? res : []
    } catch (error: any) {
      ElMessage.error(error?.message || '加载应用分组失败')
    }
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    formRef.value?.reset()
    formData.value = {}
    userList.value = []
    data_id.value = 0
    const row = props.editData || {}
    Object.assign(formData.value, {
      ...defaultdata,
      ...row
    })
    formData.value.group_ids = Array.isArray(row.group_ids)
      ? row.group_ids.map((id: any) => Number(id))
      : []
    userList.value = row.userlist || []
    data_id.value = row.id || 0
  }

  /**
   * 关闭对话框时触发
   * 清空表单数据并重置验证状态
   */
  const handleClosed = () => {
    initFormData()
    nextTick(() => {})
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        initFormData()
        if (props.type === 'update') {
          loadGroupOptions()
        }
        nextTick(() => {})
      }
    },
    { immediate: true }
  )

  /**
   * 监听 editData 变化
   * 当父组件通过 emit 更新 editData 时，同步更新本地 userList
   */
  watch(
    () => props.editData,
    (newEditData) => {
      if (newEditData?.userlist) {
        userList.value = newEditData.userlist
      }
    },
    { deep: true }
  )

  // 选择用户列表
  const SET_API = '/wechat/admin/index/userset'
  const ADD_API = '/wechat/admin/index/useradd'
  const DEL_API = '/wechat/admin/index/userdel'
  const userlistselectedRows = ref<any[]>([])
  //加载数据列表
  const fetchGetList = (params: any) => {
    return get(SET_API, params)
  }

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams
  } = useWnTable<any>({
    // 核心配置
    core: {
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'desc',
        field: 'id'
      },
      paginationKey: {
        current: 'page'
      },
      columnsFactory: () => [
        {
          prop: 'avatar',
          label: '头像',
          align: 'center',
          width: 70,
          formatter: (row: any) => {
            return h(ElImage, {
              class: 'w-10 h-10 rounded-md flex! items-center justify-center',
              src: wxImgUrl(row.avatar)
            })
          }
        },
        {
          prop: 'nickname',
          label: '昵称',
          align: 'left',
          showOverflowTooltip: true,
          formatter: (row: any) => {
            return h('div', { class: 'ml-0' }, [
              h('p', { class: 'user-name' }, '昵称:' + row.nickname),
              h('p', { class: 'email' }, '账户:' + row.username)
            ])
          }
        },
        {
          prop: 'operation',
          label: '操作',
          align: 'right',
          formatter: (row: any) =>
            h('div', {}, [
              h(ArtButtonTable, {
                class: 'ml-0 !mr-0',
                type: 'edit',
                vAuth: 'update',
                //选择图标
                icon: 'ri:send-plane-line',
                onClick: () => userlistSubmit(row)
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
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }

  // 移除用户
  const removeUser = async (id: number) => {
    // 调用删除接口
    await post(DEL_API, { id: data_id.value, user_id: id }).then(() => {
      // 更新本地列表
      userList.value = userList.value.filter((item) => item.id !== id)
      // 通过 emit 通知父组件更新 editData
      if (props.editData) {
        emit('update:editData', {
          ...props.editData,
          userlist: userList.value
        })
      }
      ElMessage.success('解绑成功')
    })
  }

  // 提交用户选择
  const userlistSubmit = async (row: any) => {
    // 根据 ID 去重检查
    const exists = userList.value.some((user) => user.id === row.id)
    if (exists) {
      ElMessage.warning('该用户已绑定')
      return
    }
    // 调用添加接口
    await post(ADD_API, { id: data_id.value, user_id: row.id }).then(() => {
      ElMessage.success('绑定成功')
      userlistDialogVisible.value = false
      userList.value.push(row)
      // 通过 emit 通知父组件更新 editData
      if (props.editData) {
        emit('update:editData', {
          ...props.editData,
          userlist: userList.value
        })
      }
    })
  }
  /**
   * 提交表单
   * 验证通过后触发提交事件，包含所有标签页的数据
   */
  const handleSubmit = async () => {
    // 如果在 basic 标签页且表单存在，进行表单验证
    if (activeName.value === 'basic' && formRef.value) {
      await formRef.value.validate()
    }

    // 提交所有数据，包括基本信息和通信接口配置
    emit('submit', { ...formData.value })
  }

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('复制成功')
    } catch (error) {
      ElMessage.error('复制失败')
      return error
    }
  }

  /**
   * 生成令牌
   */
  const generateToken = () => {
    // 32位随机字符串
    const token =
      Math.random().toString(36).substring(2, 18) +
      Math.random().toString(36).substring(2, 18) +
      Math.random().toString(36).substring(2, 18)
    formData.value.token = token
    ElMessage.success('令牌生成成功')
  }

  /**
   * 生成解密密钥
   */
  const generateAesKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 43; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    formData.value.aes_key = key
    ElMessage.success('解密密钥生成成功')
  }

  // 在组件挂载时添加键盘事件监听
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  // 在组件卸载时移除键盘事件监听
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
  // 键盘事件处理函数
  const handleKeyDown = (event: KeyboardEvent) => {
    // 只在弹窗可见时处理
    if (props.visible && event.key === 'Enter' && !event.shiftKey) {
      // 如果焦点在 textarea 中，不阻止默认行为，允许换行
      const activeElement = document.activeElement
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        return
      }
      // 阻止默认行为
      event.preventDefault()
      // 触发表单提交
      handleSubmit()
    }
  }
</script>
<style scoped>
  :global(.wechat-dialog .wechat-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.wechat-dialog .wechat-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .wechat-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .wechat-dialog .options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.w-e-text-placeholder) {
    top: 0px !important;
  }
  :global(.w-e-text-container p) {
    margin: 5px 0px !important;
  }

  /* 自定义 radio-group 尺寸 */
  .my-header {
    height: 33px;
  }
  .my-header :deep(.el-radio-button) {
    height: 32px;
    font-size: 12px;
    border-radius: 8px;
  }
  .my-header :deep(.el-radio-button__inner) {
    height: 32px;
    line-height: 13px;
    font-size: 12px;
  }

  /* 参数配置区域样式 */
  .params-config ,.appgroup-config{
    padding: 0 8px;
    font-size: 13px;
  }
  .params-header-row {
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
  }
  .params-item {
    padding: 8px 12px;
    background-color: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    transition: all 0.2s;
    font-size: 13px;
  }
  .params-item:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary), 0.1);
  }
  .params-item .el-text {
    font-size: 13px !important;
  }

  /* 用户分组区域样式 */
  .group-config {
    padding: 0 8px;
    font-size: 13px;
  }
  .group-header-row {
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
  }
  .group-item {
    padding: 8px 12px;
    background-color: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    transition: all 0.2s;
    font-size: 13px;
  }
  .group-item:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary), 0.1);
  }
</style>
