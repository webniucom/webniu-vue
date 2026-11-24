<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <Search
          v-model="searchForm"
          :typeOptions="typeOptions"
          :classOptions="classOptions"
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
                <div class="custom-radio-group">
                  <el-radio-group v-model="installedtype" size="default" @change="typeChange">
                    <el-radio-button value="installed">已安装</el-radio-button>
                    <el-radio-button value="waitapps">云安装</el-radio-button>
                    <el-radio-button value="localapps">本地包</el-radio-button>
                  </el-radio-group>
                </div>
              </ElSpace>
            </template>
            <template #right>
              <el-tooltip
                v-if="webniuyunstatus"
                class="box-item"
                effect="dark"
                content="网牛云信息"
                placement="top-end"
              >
                <div
                  class="size-8 flex items-center justify-center cursor-pointer rounded-md bg-g-300/55 dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0 md:mr-2.5"
                  @click="webniuYunInfo(false)"
                >
                  <ArtSvgIcon icon="ri:account-circle-line" class="text-g-600" />
                </div>
              </el-tooltip>
              <el-tooltip class="box-item" effect="dark" content="刷新" placement="top-end">
                <div
                  class="size-8 flex items-center justify-center cursor-pointer rounded-md bg-g-300/55 dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0 md:mr-2.5"
                  @click="refreshData"
                >
                  <ArtSvgIcon icon="ri:refresh-line" class="text-g-600" />
                </div>
              </el-tooltip>
              <el-tooltip
                v-if="setpustatus"
                class="box-item"
                effect="dark"
                content="应用安装配置"
                placement="top-end"
              >
                <div
                  v-if="hasAuth('setconfig')"
                  class="size-8 flex items-center justify-center cursor-pointer rounded-md bg-g-300/55 dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0 md:mr-2.5"
                  @click="setConfigfun"
                >
                  <ArtSvgIcon icon="ri:settings-line" class="text-g-600" />
                </div>
              </el-tooltip>
               
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable
            ref="tableRef"
            rowKey="identifier"
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :default-expand-all="false"
            :empty-text="emptyText"
            @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
            <template #webniu_version-header="{ column }">
              <div class="flex-c gap-1">
                <span>{{ column.label }}</span>
                <ElTooltip content="网牛引擎版本必须大于等于该版本才能安装" placement="top">
                  <ElIcon>
                    <QuestionFilled />
                  </ElIcon>
                </ElTooltip>
              </div>
            </template>
          </ArtTable>
          <!-- 配置弹窗 -->
          <Dialog
            v-model:visible="dialogVisible"
            :editData="editData"
            :title="title"
            :data="{
              type: typeOptions,
              class: classOptions
            }"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
    <!-- 配置弹窗 -->
    <Config
      v-model:visible="configVisible"
      :formdata="globalplugin"
      @submit="handleSubmitConfig"
    ></Config>
    <ElDialog
      v-model="LoginDialogVisible"
      :title="loginMode === 'login' ? '登录网牛云' : '注册账号'"
      width="360"
      align-center
      destroy-on-close
      body-class="plugin-dialog-wnyun-body"
      footer-class="plugin-dialog-wnyun-footer"
      @close="handleDialogClose"
    >
      <!-- 登录表单 -->
      <ElForm
        v-if="loginMode === 'login'"
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        size="large"
      >
        <ElFormItem prop="username">
          <ElInput v-model="loginForm.username" placeholder="请输入账户" clearable>
            <template #prefix>
              <ArtSvgIcon icon="ri:user-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="password">
          <ElInput
            v-model="loginForm.password"
            :type="showLoginPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:lock-password-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="captcha">
          <div class="flex gap-2 w-full">
            <ElInput
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              class="flex-1"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <ArtSvgIcon icon="ri:image-line" />
              </template>
            </ElInput>
            <div class="captcha-box" @click="refreshCaptcha" title="点击刷新验证码">
              <img v-if="captchaUrl" :src="captchaUrl" class="w-full h-full object-cover" />
              <span v-else class="text-gray-400 text-sm">加载中...</span>
            </div>
          </div>
        </ElFormItem>
      </ElForm>

      <!-- 注册表单 -->
      <ElForm
        v-else
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="0"
        size="large"
      >
        <ElFormItem prop="username">
          <ElInput
            v-model="registerForm.username"
            placeholder="请输入账户（字母或手机号）"
            clearable
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:user-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="password">
          <ElInput
            v-model="registerForm.password"
            :type="showRegisterPassword ? 'text' : 'password'"
            placeholder="请输入密码（6-20位）"
            show-password
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:lock-password-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="confirmPassword">
          <ElInput
            v-model="registerForm.confirmPassword"
            :type="showRegisterConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            show-password
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:lock-password-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="nickname">
          <ElInput v-model="registerForm.nickname" placeholder="请输入昵称" clearable>
            <template #prefix>
              <ArtSvgIcon icon="ri:user-line" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="captcha" style="margin-bottom: 5px !important">
          <div class="flex gap-2 w-full">
            <ElInput v-model="registerForm.captcha" placeholder="请输入验证码" class="flex-1">
              <template #prefix>
                <ArtSvgIcon icon="ri:image-line" />
              </template>
            </ElInput>
            <div class="captcha-box" @click="refreshCaptcha" title="点击刷新验证码">
              <img v-if="captchaUrl" :src="captchaUrl" class="w-full h-full object-cover" />
              <span v-else class="text-gray-400 text-sm">加载中...</span>
            </div>
          </div>
        </ElFormItem>
        <ElFormItem prop="agreement" style="margin-bottom: 10px !important">
          <ElCheckbox v-model="registerForm.agreement">
            我已阅读并同意
            <a
              class="text-blue-500 hover:text-blue-600 cursor-pointer"
              @click.prevent="agreementDialogVisible = true"
            >
              《会员须知》
            </a>
          </ElCheckbox>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer flex items-center justify-between">
          <div class="text-sm">
            <template v-if="loginMode === 'login'">
              还没有账号？
              <a class="text-blue-500 hover:text-blue-600 cursor-pointer" @click="switchToRegister"
                >立即注册</a
              >
            </template>
            <template v-else>
              <a class="text-blue-500 hover:text-blue-600 cursor-pointer" @click="switchToLogin">
                返回登录
              </a>
            </template>
          </div>
          <div class="flex gap-2">
            <ElButton @click="handleCancel">取消</ElButton>
            <ElButton
              v-if="loginMode === 'login'"
              type="primary"
              :loading="loginLoading"
              @click="handleLogin"
            >
              登录
            </ElButton>
            <ElButton v-else type="primary" :loading="registerLoading" @click="handleRegister">
              注册
            </ElButton>
          </div>
        </div>
      </template>
    </ElDialog>

    <!-- 会员须知弹窗 -->
    <ElDialog
      v-model="agreementDialogVisible"
      title="会员须知"
      width="500"
      align-center
      append-to-body
      body-class="plugin-dialog-agreement-body"
    >
      <template #default>
        <ElScrollbar class="h-[300px]" max-height="300">
          <div> 注册须知 </div>
        </ElScrollbar>
      </template>
      <template #footer>
        <div class="dialog-footer flex justify-end gap-2">
          <ElButton @click="agreementDialogVisible = false">关闭</ElButton>
          <ElButton
            type="primary"
            @click="
              () => {
                registerForm.agreement = true
                agreementDialogVisible = false
                registerFormRef?.value?.validateField('agreement').catch(() => {})
              }
            "
          >
            我已阅读并同意
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 用户状态弹窗 -->
    <ElDialog
      v-model="userDialogVisible"
      title=""
      width="360"
      align-center
      append-to-body
      body-class="plugin-dialog-user-body"
    >
      <div v-loading="userInfoLoading" class="user-info-panel">
        <div v-if="userInfo" class="user-info-content">
          <!-- 头像居中 -->
          <div class="user-avatar-wrap">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" class="user-avatar" alt="avatar" />
            <div v-else class="user-avatar user-avatar-default">
              <ArtSvgIcon icon="ri:user-3-line" class="text-3xl text-gray-400" />
            </div>
          </div>
          <!-- 昵称和账号居中 -->
          <div class="user-info-detail">
            <div class="user-nickname">{{ userInfo.nickname || '未设置昵称' }}</div>
            <div class="user-account">账号：{{ userInfo.username }}</div>
          </div>
          <!-- 统计卡片 -->
          <div class="user-stats-cards">
            <div class="stat-card">
              <span class="stat-label">会员积分</span>
              <span class="stat-value">{{ userInfo.score || 0 }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">账户余额</span>
              <span class="stat-value text-orange-500">¥{{ userInfo.money || '0.00' }}</span>
            </div>
          </div>
        </div>
        <ElEmpty v-else-if="!userInfoLoading" description="暂无用户信息" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <ElButton size="small" @click="handleLogout"> 退出登录 </ElButton>
          <ElButton size="small" type="primary" @click="userDialogVisible = false">关闭</ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 更新确认弹窗 -->
    <ElDialog
      v-model="updateDialogVisible"
      title="发现新版本"
      width="400"
      align-center
      append-to-body
      draggable
      body-class="plugin-dialog-update-body"
    >
      <div v-if="updateRow" class="update-info">
        <div class="update-rows">
          <div class="update-row">
            <span class="update-label">插件名称</span>
            <span class="update-value">{{ updateRow.name || '-' }}</span>
          </div>
          <div class="update-row">
            <span class="update-label">当前版本</span>
            <span class="update-value font-semibold">{{ updateRow.version || '-' }}</span>
          </div>
          <div class="update-row">
            <span class="update-label">最新版本</span>
            <span class="update-value !text-orange-500 font-semibold">
              {{ updateRow.yundata?.version || '-' }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer flex items-center justify-end gap-0">
          <ElButton size="small" @click="updateDialogVisible = false">取消</ElButton>
          <ElButton
            :disabled="isauthority"
            size="small"
            type="primary"
            :loading="updateLoading"
            @click="handleConfirmUpdate"
          >
            {{ authority_name }}
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 安装/升级进度弹窗 -->
    <ElDialog
      v-model="progressVisible"
      :title="progressTitle"
      width="420px"
      align-center
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="plugin-progress">
        <div class="plugin-progress__head">
          <span class="plugin-progress__name">{{ progressName }}</span>
          <span class="plugin-progress__percent">{{ Math.round(progressPercent) }}%</span>
        </div>
        <ElProgress
          :percentage="Math.round(progressPercent)"
          :stroke-width="8"
          :show-text="false"
          striped
          striped-flow
        />
        <div class="plugin-progress__text">{{ progressText }}</div>
        <div class="plugin-progress__tip">安装过程在服务端执行，请勿关闭页面</div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'
  import { useTable } from '@/hooks/core/useTable'
  import { get, post, del } from '@/api/common-request'
  import {
    ElMessage,
    ElMessageBox,
    ElImage,
    ElForm,
    ElFormItem,
    ElInput,
    ElCheckbox,
    ElTooltip,
    ElIcon,
    ElBadge,
    ElEmpty
  } from 'element-plus'
  import NProgress from 'nprogress'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import Config from './modules/config.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { useMenuStore } from '@/store/modules/menu'
  import { MenuProcessor } from '@/router/core/MenuProcessor'
  import { useAuth } from '@/hooks/core/useAuth'
  import { QuestionFilled } from '@element-plus/icons-vue'
  defineOptions({ name: 'Plugin' })

  //菜单列表
  const menuStore = useMenuStore()
  const menuProcessor = new MenuProcessor()
  async function refreshMenus() {
    const menuList = await menuProcessor.getMenuList()
    menuStore.setMenuList(menuList)
  }
  // 全局配置参数
  const configVisible = ref(false)
  const globalplugin = ref<any>({})
  const { hasAuth } = useAuth()
  // 空数据提示
  const emptyText = ref('暂无数据')
  // 登录/注册弹窗
  const LoginDialogVisible = ref(false)
  const loginMode = ref<'login' | 'register'>('login')
  const loginFormRef = ref()
  const registerFormRef = ref()
  const loginLoading = ref(false)
  const registerLoading = ref(false)
  const showLoginPassword = ref(false)
  const showRegisterPassword = ref(false)
  const showRegisterConfirmPassword = ref(false)
  const captchaUrl = ref('')
  const captchaKey = ref('')
  // 会员须知弹窗
  const agreementDialogVisible = ref(false)
  // 用户状态弹窗
  const userDialogVisible = ref(false)
  const userInfo = ref<any>(null)
  const userInfoLoading = ref(false)

  // 登录表单
  const loginForm = ref({
    username: '',
    password: '',
    captcha: ''
  })

  // 注册表单
  const registerForm = ref({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    captcha: '',
    agreement: false
  })

  // 登录验证规则
  const loginRules = {
    username: [
      { required: true, message: '请输入账户', trigger: 'blur' },
      { min: 3, max: 20, message: '账户长度为 3-20 个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度为 6-20 个字符', trigger: 'blur' }
    ],
    captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }

  // 注册验证规则
  const registerRules = {
    username: [
      { required: true, message: '请输入账户', trigger: 'blur' },
      //账户正则：只能包含字母、数字和下划线，长度6-20
      {
        pattern: /^[a-zA-Z0-9_]{6,20}$/,
        message: '账户只能包含字母、数字和下划线，长度6-20个字符',
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度为 6-20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      {
        validator: (_rule: any, value: string, callback: any) => {
          if (value !== registerForm.value.password) {
            callback(new Error('两次密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '昵称长度为 2-20 个字符', trigger: 'blur' }
    ],
    captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    agreement: [
      {
        validator: (_rule: any, value: boolean, callback: any) => {
          if (!value) {
            callback(new Error('请阅读并同意《会员须知》'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  }

  // 路由参数
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)
  const loadings = ref(false)

  // API 相关
  const CONFIG_API = url + '/config'
  const SETCONFIG_API = url + '/setconfig'
  const UPDATE_API = url + '/update'
  const INSTALL_API = url + '/install'
  const SELECT_API = ref(url + '/select')
  const DELETE_API = url + '/uninstall'
  const WNYUN_API = url + '/wnyun'
  const OUT_API = url + '/out'
  const UPDATE_CHECK_API = url + '/checkupdate'

  const webniuyunstatus = ref(true)
  const setpustatus = ref(true)
  // config
  const config = ref<any>({})
  const title = computed(() => config.value.title || '未定义')

  const installedtype = ref('installed')
  // 搜索参数
  const typeOptions = ref<any[]>([])
  const classOptions = ref<any[]>([])
  const selectedRows = ref<any>([])
  const searchForm = ref<any>({
    type: '',
    class: '',
    name: ''
  })
  const layout = ref('')
  // 弹窗参数
  const dialogVisible = ref(false)
  const editData = ref<any>()
  // 是否有权限
  const isauthority = ref(false)
  // 权限名称
  const authority_name = ref('更新')
  //加载配置数据
  const fetchGetConfig = () => {
    return get(CONFIG_API)
  }
  //加载数据列表 - 直接定义函数，每次调用时使用最新的 SELECT_API.value
  const fetchGetList = (params: any) => {
    return get(SELECT_API.value, params)
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
        {
          label: '图标',
          prop: 'logo',
          width: 80,
          align: 'center',
          formatter: (row: any) => {
            return h(ElImage, {
              class: 'w-10 h-10 rounded-md flex! items-center justify-center',
              src: row.logo,
              previewSrcList: [row.logo],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          label: '名称',
          prop: 'name'
        },
        {
          label: '类别',
          prop: 'type',
          formatter: (row: any) => {
            return (
              typeOptions.value.find((item: any) => {
                return item.value === row.type
              })?.label || '未知'
            )
          }
        },
        {
          label: '分类',
          prop: 'class',
          formatter: (row: any) => {
            return (
              classOptions.value.find((item: any) => item.value === String(row.class))?.label ||
              '未知'
            )
          }
        },
        {
          label: '描述',
          showOverflowTooltip: true,
          prop: 'desc'
        },
        {
          label: '标识',
          prop: 'identifier'
        },
        {
          label: '版本号',
          prop: 'version',
          formatter: (row: any) => {
            const hasUpdate = !!row.yundata?.version
            return h(
              ElBadge,
              {
                isDot: true,
                hidden: !hasUpdate,
                type: 'danger',
                class: 'version-badge'
              },
              {
                default: () =>
                  h(
                    'span',
                    {
                      class: hasUpdate ? 'version-text version-clickable' : 'version-text',
                      onClick: () => hasUpdate && handleVersionClick(row)
                    },
                    row.version || '-'
                  )
              }
            )
          }
        },
        {
          label: '框架版本',
          useHeaderSlot: true,
          prop: 'webniu_version',
          formatter: (row: any) => {
            if (!row.webniu_version) {
              return '-'
            }
            return '>=' + row.webniu_version
          }
        },
        {
          label: '安装时间',
          showOverflowTooltip: true,
          prop: 'created_at',
          visible: false,
          formatter: (row: any) => {
            return row.created_at ? new Date(row.created_at).toLocaleString() : '未安装'
          }
        },
        {
          label: '授权站点',
          prop: 'license_site_title',
          width: 150,
          showOverflowTooltip: true,
          formatter: (row: any) => {
            if (row.license_free) return '免费不限站点'
            if (row.license_bound) return '当前站点'
            if (row.license_other) return row.license_site_title || row.license_site_domain || '其他站点'
            return row.installedtype === 'waitapps' ? '未授权' : '-'
          }
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          align: 'right',
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h(ArtButtonTable, {
                title: '安装',
                type: 'add',
                vAuth: 'update',
                icon: 'ri:install-line',
                hidden: row.installed == 1 || row.license_other == 1,
                onClick: () => installed(row)
              }),
              h(ArtButtonTable, {
                title: '解绑',
                type: 'delete',
                vAuth: 'update',
                icon: 'ri:link-unlink',
                hidden: row.installedtype !== 'waitapps' || row.license_other != 1,
                onClick: () => unbindLicense(row)
              }),
              h(ArtButtonTable, {
                title: '配置',
                type: 'edit',
                vAuth: 'update',
                class: row.installed !== 1 || row.identifier == 'webniu' ? '!mr-0' : 'mr-0',
                hidden: row.installed !== 1,
                icon: 'ri:settings-4-line',
                onClick: () => configFun(row)
              }),
              h(ArtButtonTable, {
                title: '卸载',
                type: 'delete',
                vAuth: 'delete',
                class: '!mr-0',
                icon: 'ri:delete-bin-5-line',
                hidden: row.installed !== 1 || row.identifier == 'webniu',
                onClick: () => deleteFun(row)
              })
            ])
        }
      ]
    },
    hooks: {
      onError: (data: any) => {
        if (data.details.code == 407) {
          webniuYunInfo(true)
        }
      },
      // 数据加载成功后，触发异步更新检查
      onSuccess: () => {
        if (installedtype.value == 'installed') {
          checkPluginUpdate()
        }
      }
    }
  })

  /**
   * 异步检查插件更新状态
   * 数据加载完成后，再次请求接口查询更新状态，并修改列表项
   */
  const checkPluginUpdate = async () => {
    const records = data.value
    if (!records || records.length === 0) return

    const list = data.value.map((item: any) => [item.identifier, item.version])
    try {
      const res = await post(UPDATE_CHECK_API, { data: list })
      if (res && Array.isArray(res)) {
        // 以 identifier 为 key 建立映射，快速查找
        const resMap = new Map(res.map((item: any) => [item.identifier, item]))
        // 遍历列表，合并匹配项的所有字段
        records.forEach((record: any) => {
          const remote = resMap.get(record.identifier)
          if (remote) {
            Object.assign(record, {
              yundata: remote
            })
          }
        })
      }
    } catch (error) {
      console.log('检查更新失败:', error)
    }
  }

  /**
   * 点击版本号 - 有新版本时触发
   * @param row 当前行数据
   */
  // 更新弹窗
  const updateDialogVisible = ref(false)
  const updateRow = ref<any>(null)
  const updateLoading = ref(false)

  // ============ 安装/升级进度弹窗 ============
  const progressVisible = ref(false)
  const progressPercent = ref(0)
  const progressText = ref('')
  const progressTitle = ref('正在安装插件')
  const progressName = ref('')
  let progressTimer: ReturnType<typeof setInterval> | null = null
  let progressStepTimer: ReturnType<typeof setInterval> | null = null

  const PROGRESS_STEPS: Record<'install' | 'update', string[]> = {
    install: ['正在下载安装包…', '正在解压文件…', '正在执行安装脚本…', '正在写入菜单与权限…'],
    update: ['正在下载更新包…', '正在校验版本…', '正在执行升级脚本…', '正在更新菜单与权限…']
  }

  const stopProgress = () => {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    if (progressStepTimer) {
      clearInterval(progressStepTimer)
      progressStepTimer = null
    }
  }

  /**
   * 开启进度弹窗
   * 安装接口是单次请求，拿不到真实进度，这里用缓动动画模拟
   */
  const startProgress = (type: 'install' | 'update', name = '') => {
    stopProgress()
    progressTitle.value = type === 'install' ? '正在安装插件' : '正在升级插件'
    progressName.value = name
    progressPercent.value = 0
    const steps = PROGRESS_STEPS[type]
    let stepIndex = 0
    progressText.value = steps[0]
    progressVisible.value = true

    // 阶段文案轮换
    progressStepTimer = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex += 1
        progressText.value = steps[stepIndex]
      }
    }, 1800)

    // 百分比缓动上涨，最多到 90%，等待接口返回
    progressTimer = setInterval(() => {
      const remain = 90 - progressPercent.value
      if (remain <= 0) return
      progressPercent.value = Math.min(90, progressPercent.value + Math.max(0.6, remain * 0.08))
    }, 200)
  }

  /**
   * 完成进度并刷新页面
   */
  const finishProgress = async (text: string) => {
    stopProgress()
    progressPercent.value = 100
    progressText.value = text
    await new Promise((resolve) => setTimeout(resolve, 900))
    progressVisible.value = false
    location.reload()
  }

  /**
   * 失败时关闭进度弹窗
   */
  const failProgress = () => {
    stopProgress()
    progressVisible.value = false
  }

  const handleVersionClick = (row: any) => {
    if (row.yundata.islogin == 0) {
      webniuYunInfo(true)
      return
    }
    isauthority.value = row.yundata.authority == 0
    authority_name.value = isauthority.value ? '暂无权限' : '更新插件'
    updateRow.value = row
    updateDialogVisible.value = true
  }

  // 确认更新
  const handleConfirmUpdate = async () => {
    if (!updateRow.value) return
    const row = updateRow.value
    updateDialogVisible.value = false
    startProgress('update', row.name)
    try {
      await post(INSTALL_API, row.yundata)
      ElMessage.success('更新成功')
      refreshUpdate()
      refreshMenus()
      await finishProgress('升级完成，正在刷新页面…')
    } catch (error: any) {
      failProgress()
      return error
    } finally {
      updateLoading.value = false
    }
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
        label: 'globalplugin',
        value: { ...data }
      })
      ElMessage.success('全局配置更新成功')
    } catch (error) {
      ElMessage.error('全局配置更新失败')
      return console.error(error)
    }
  }

  // 打开弹窗添加or编辑
  const configFun = (row?: any): void => {
    editData.value = row || {}
    dialogVisible.value = true
  }

  // 网牛云信息
  const webniuYunInfo = async (login: boolean = false) => {
    if (login) {
      LoginDialogVisible.value = true
      return
    }
    userInfoLoading.value = true
    try {
      userInfo.value = await get(WNYUN_API, {})
      userDialogVisible.value = true
      userInfoLoading.value = false
    } catch (error: any) {
      // 407 未授权 -> 弹出登录窗
      userInfoLoading.value = false
      if (error.code === 407) {
        LoginDialogVisible.value = true
        userDialogVisible.value = false
        return
      }
      if (error.message) {
        ElMessage.error(error.message)
      }
    }
  }

  // 退出登录
  const handleLogout = async () => {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await get(OUT_API, {})
      // TODO: 调用退出登录接口
      userDialogVisible.value = false
      userInfo.value = null
      // 清除本地登录状态
      localStorage.removeItem('sys-webniu-token')
      ElMessage.success('已退出登录')
      // 刷新页面数据
      refreshMenus()
      getData()
    } catch (error) {
      // 用户取消退出登录
      return error
    }
  }

  // 安装插件
  const installed = (row: any) => {
    ElMessageBox.confirm(`确定要安装插件${row.name}吗？`, '安装确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        startProgress('install', row.name)
        try {
          await post(INSTALL_API, row)
          refreshUpdate()
          ElMessage.success('安装成功')
          refreshMenus()
          await finishProgress('安装完成，正在刷新页面…')
        } catch (error) {
          failProgress()
          return error
        }
      })
      .catch(() => {
        return
      })
  }
  // 解绑应用授权（付费应用换站点安装前使用）
  const unbindLicense = (row: any) => {
    const site = row.license_site_title || row.license_site_domain || '其他站点'
    ElMessageBox.confirm(
      `该应用已授权给「${site}」，解绑后可在当前站点重新安装，确定解绑吗？`,
      '解绑确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        NProgress.start()
        try {
          await post(url + '/unbindlicense', { app_id: row.license_app_id })
          ElMessage.success('解绑成功，可在当前站点重新安装')
          refreshData()
        } catch (error: any) {
          ElMessage.error(error?.message || '解绑失败')
        } finally {
          NProgress.done()
        }
      })
      .catch(() => {
        return
      })
  }
  // 删除单条数据
  const deleteFun = async (row: any) => {
    ElMessageBox.confirm(`确定要卸载插件${row.name}吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        // 启动进度条
        NProgress.start()
        try {
          await del(DELETE_API, { id: row.id })
          ElMessage.success('卸载成功')
          refreshUpdate()
          refreshMenus()
          NProgress.done()
        } catch (error) {
          ElMessage.error('卸载失败')
          NProgress.done()
          console.error(error)
        }
      })
      .catch(() => {
        return
      })
  }

  // 类型切换
  const typeChange = () => {
    // 更新 API URL
    if (installedtype.value === 'installed') {
      SELECT_API.value = url + '/select'
      webniuyunstatus.value = true
      setpustatus.value = true
    }
    if (installedtype.value == 'waitapps') {
      SELECT_API.value = url + '/waitapps'
      webniuyunstatus.value = true
      setpustatus.value = false
    }
    if (installedtype.value == 'localapps') {
      SELECT_API.value = url + '/localapps'
      webniuyunstatus.value = false
      setpustatus.value = true
    }
    // 重新加载数据
    getData()
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
    await post(UPDATE_API, data)
    dialogVisible.value = false
    editData.value = {}
    ElMessage.success('更新成功')
    refreshUpdate()
  }
  // 初始化默认选中第一个分组
  onMounted(async () => {
    try {
      loadings.value = true
      const configData = await fetchGetConfig()
      config.value = configData.config || {}
      typeOptions.value = configData.plugin.type || []
      classOptions.value = configData.plugin.class || []
      globalplugin.value = configData.globalplugin || {}

      layout.value = config.value.layout || ''
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

  // ============ 登录/注册弹窗相关方法 ============

  // 刷新验证码
  const refreshCaptcha = () => {
    captchaKey.value = Date.now() + Math.random().toString(36).substring(2)
    captchaUrl.value = `/app/webniu/admin/plugin/captcha?key=${captchaKey.value}`
  }

  // 切换到注册
  const switchToRegister = () => {
    loginMode.value = 'register'
    refreshCaptcha()
    // 重置注册表单
    Promise.resolve(registerFormRef.value?.resetFields()).catch(() => {})
  }

  // 切换到登录
  const switchToLogin = () => {
    loginMode.value = 'login'
    refreshCaptcha()
    // 重置登录表单
    Promise.resolve(loginFormRef.value?.resetFields()).catch(() => {})
  }

  // 取消/关闭弹窗
  const handleCancel = () => {
    LoginDialogVisible.value = false
  }

  // 弹窗关闭时重置
  const handleDialogClose = () => {
    loginMode.value = 'login'
    Promise.resolve(loginFormRef.value?.resetFields()).catch(() => {})
    Promise.resolve(registerFormRef.value?.resetFields()).catch(() => {})
    showLoginPassword.value = false
    showRegisterPassword.value = false
    showRegisterConfirmPassword.value = false
  }

  // 登录提交
  const handleLogin = async () => {
    if (!loginFormRef.value) return
    try {
      await loginFormRef.value.validate()
      loginLoading.value = true
      await post(url + '/login', {
        username: loginForm.value.username,
        password: loginForm.value.password,
        captcha: loginForm.value.captcha,
        captcha_key: captchaKey.value
      })
      ElMessage.success('登录成功')
      LoginDialogVisible.value = false
      refreshCaptcha()
      // 刷新页面数据
      refreshMenus()
      getData()
    } catch (error: any) {
      if (error?.message) {
        console.error(error.message)
      }
      refreshCaptcha()
    } finally {
      loginLoading.value = false
    }
  }

  // 注册提交
  const handleRegister = async () => {
    if (!registerFormRef.value) return
    try {
      await registerFormRef.value.validate()
      registerLoading.value = true
      await post(url + '/register', {
        username: registerForm.value.username,
        password: registerForm.value.password,
        confirmpassword: registerForm.value.confirmPassword,
        nickname: registerForm.value.nickname,
        captcha: registerForm.value.captcha,
        captcha_key: captchaKey.value
      })
      ElMessage.success('注册成功，请登录')
      // 切换回登录模式，自动填充账户
      loginMode.value = 'login'
      loginForm.value.username = registerForm.value.username
      loginForm.value.password = ''
      loginForm.value.captcha = ''
      Promise.resolve(registerFormRef.value?.resetFields()).catch(() => {})
      refreshCaptcha()
    } catch (error: any) {
      if (error?.message) {
        console.error(error.message)
      }
      refreshCaptcha()
    } finally {
      registerLoading.value = false
    }
  }

  // 监听弹窗打开，加载验证码
  watch(LoginDialogVisible, (visible) => {
    if (visible) {
      refreshCaptcha()
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
  /* 自定义 radio-group 尺寸 */
  .custom-radio-group :deep(.el-radio-button) {
    height: 32px;
    font-size: 12px;
    border-radius: 8px;
  }
  .custom-radio-group :deep(.el-radio-button__inner) {
    height: 32px;
    line-height: 13px;
    font-size: 12px;
  }
  /* 验证码容器 */
  .captcha-box {
    width: 100px;
    height: 40px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
  }
  .captcha-box:hover {
    border-color: #409eff;
  }
  .captcha-box img {
    display: block;
  }
  /* 弹窗底部样式 */
  .dialog-footer {
    width: 100%;
  }
  /* 会员须知内容样式 */
  .agreement-content {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
    line-height: 1.8;
    color: #606266;
    font-size: 14px;
  }
  .agreement-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
  .agreement-content p {
    margin-bottom: 10px;
  }
  .agreement-content ol {
    padding-left: 20px;
    margin-bottom: 10px;
  }
  .agreement-content ol li {
    margin-bottom: 8px;
    list-style: decimal;
  }
  .agreement-content ol li strong {
    color: #303133;
    font-weight: 600;
  }
  /* 更新确认弹窗样式 */
  .update-info {
    text-align: center;
    padding: 8px 0;
  }
  .update-icon-wrap {
    margin-bottom: 12px;
  }
  .update-icon-wrap svg {
    color: var(--el-color-primary);
  }
  .update-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
  .update-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 6px;
    text-align: left;
  }
  .update-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
  }
  .update-label {
    color: #909399;
  }
  .update-value {
    color: #303133;
  }
  /* 版本号红点样式 */
  .version-text {
    display: inline-block;
    line-height: 1;
  }
  .version-clickable {
    color: var(--el-color-primary);
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .version-clickable:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
  :deep(.el-badge__content.is-dot) {
    width: 8px;
    height: 8px;
    right: -4px;
    top: 0;
  }
  /* 用户状态弹窗样式 - 卡片风格 */
  .user-info-panel {
    min-height: 100px;
  }
  .user-info-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  /* 自定义头部 */
  .user-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 12px;
  }
  .user-dialog-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
  .user-dialog-close {
    font-size: 18px;
    color: #909399;
    cursor: pointer;
    transition: color 0.2s;
  }
  .user-dialog-close:hover {
    color: #409eff;
  }
  /* 头像居中 */
  .user-avatar-wrap {
    display: flex;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ebeef5;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    align-content: center;
    align-items: center;
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .user-avatar {
    width: 50px;
    height: 50px;
  }
  .user-avatar-default {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
  }
  /* 昵称和账号 */
  .user-info-detail {
    text-align: center;
  }
  .user-nickname {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  .user-account {
    font-size: 12px;
    color: #909399;
  }
  /* 统计卡片 */
  .user-stats-cards {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 4px;
  }
  .stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 12px 16px;
    background: #f8f9fb;
    border-radius: 10px;
    border: 1px solid #f0f2f5;
  }
  .stat-card .stat-label {
    font-size: 14px;
    color: #606266;
  }
  .stat-card .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
  :deep(.plugin-dialog-wnyun-body) {
    padding-top: 10px !important;
    padding-bottom: 0px !important;
  }
  :deep(.plugin-dialog-wnyun-footer) {
    padding-top: 0px !important;
  }
  :global(.plugin-dialog-agreement-body) {
    padding-top: 10px !important;
    padding-bottom: 10px !important;
  }
  :global(.plugin-dialog-user-body) {
    padding-top: 10px !important;
    padding-bottom: 0px !important;
  }
  :deep(.version-badge sup) {
    margin-right: 4px !important;
    margin-top: 2px !important;
  }
  :deep(.version-badge) {
    cursor: pointer;
  }
  :global(.plugin-dialog-update-body) {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
  }
  /* 安装/升级进度弹窗 */
  .plugin-progress {
    padding: 4px 0 0;
  }
  .plugin-progress__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 13px;
  }
  .plugin-progress__name {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .plugin-progress__percent {
    color: var(--el-color-primary);
    font-variant-numeric: tabular-nums;
  }
  .plugin-progress__text {
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
  .plugin-progress__tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
