<template>
  <div>
    <ElCard class="art-card-xs wn-config-card art-full-height">
      <template #header>
        <el-tabs
          v-model="editableTabsValue"
          class="wn-class-tabs"
          @tab-click="handleTabClick"
          type="card"
        >
          <el-tab-pane
            v-for="item in editableTabs"
            :key="item.name"
            :label="item.title"
            :name="item.name"
            class="wn-class-tabs-pane"
          >
          </el-tab-pane>
        </el-tabs>
      </template>
      <template #default>
        <div class="form-container">
          <ElScrollbar class="h-[calc(100vh-290px)]" max-height="calc(100vh - 290px)">
            <Transition name="tab-content-fade" mode="out-in">
              <ArtForm
                :key="editableTabsValue"
                ref="formRef"
                v-model="formData"
                :items="formItems"
                :rules="formRules"
                :defaultExpanded="true"
                :labelWidth="labelWidth"
                :labelPosition="labelPosition"
                :span="span"
                :gutter="gutter"
                :show-reset="false"
                :show-submit="false"
                v-loading="loading"
                style="max-width: 605px"
              >
                <template #systemThemeColor="{ item }">
                  <div class="flex items-center w-full">
                    <el-select v-model="formData.systemThemeColor">
                      <template #label="{ label, value }">
                        <el-tag :color="value" style="margin-right: 8px" size="small" />
                        <span>{{ label }}</span>
                      </template>
                      <el-option
                        v-for="i in item?.props?.options || []"
                        :key="i.value"
                        :label="i.label"
                        :value="i.value"
                      >
                        <div class="flex items-center">
                          <el-tag :color="i.value" style="margin-right: 8px" size="small" />
                          <span :style="{ color: i.value }">{{ i.label }}</span>
                        </div>
                      </el-option>
                    </el-select>
                    <FieldTooltip v-if="item?.props?.tooltip" content="请选择系统主题颜色" />
                  </div>
                </template>
                <template #pic_thumb_color>
                  <ElColorPickerPanel v-model="formData.pic_thumb_color" />
                </template>
              </ArtForm>
            </Transition>
          </ElScrollbar>
        </div>
      </template>
      <!-- 在外部添加自定义按钮 -->
      <template #footer>
        <div class="flex justify-between items-center portrait">
          <div class="text-sm text-g-600">
            最近更新： <span class="font-medium text-g-900">{{ admin }}</span>
            <span class="mx-2 text-g-400">·</span>
            <span>{{ updateTime }}</span>
          </div>
          <ElButton type="primary" @click="handleSubmit">保存并发布配置</ElButton>
        </div>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { get, post } from '@/api/common-request'
  import FieldTooltip from '@admin/forms/wn-form-tooltip/field-tooltip.vue'
  import { useSystemStore } from '@/store/modules/system'
  import { ElColorPickerPanel } from 'element-plus'
  const systemStore = useSystemStore()
  defineOptions({ name: 'SysConfigIndex' })

  const formRef = ref()
  const loading = ref(false)
  // 选项卡
  const editableTabsValue = ref('systemInfo')
  const editableTabs = ref([
    {
      title: '基本设置',
      name: 'systemInfo'
    },
    {
      title: '账户设置',
      name: 'systemSetting'
    },
    {
      title: '附件设置',
      name: 'attachMent'
    },
    {
      title: '图片水印',
      name: 'waterMark'
    },
    {
      title: '全局样式',
      name: 'systemTheme'
    },
    {
      title: '接口设置',
      name: 'interfaceConfig'
    }
  ])
  /**
   * 表单数据
   */
  const formData = ref<any>({})
  const admin = ref('system')
  const updateTime = ref('')
  /**
   * 表单校验规则
   */
  const formRules = ref<Record<string, any[]>>({
    title: [{ required: true, message: '请输入站点标题', trigger: 'blur' }],
    name: [{ required: true, message: '请输入站点名称', trigger: 'change' }],
    siteurl: [{ required: true, message: '请输入站点URL', trigger: 'blur' }],
    logo: [{ required: true, message: '请上传logo', trigger: 'blur' }]
  })

  const addFormRule = (field: string, rules: any[], replace: boolean = false) => {
    if (replace) {
      formRules.value[field] = rules
    } else {
      if (!formRules.value[field]) {
        formRules.value[field] = []
      }
      formRules.value[field] = [...formRules.value[field], ...rules]
    }
  }

  const addFormRules = (rulesObj: Record<string, any[]>, replace: boolean = false) => {
    Object.entries(rulesObj).forEach(([field, rules]) => {
      addFormRule(field, rules, replace)
    })
  }

  const dynamicFormItems = ref<any[]>([])
  const labelWidth = ref(100)
  const labelPosition = ref<'right' | 'left' | 'top'>('top')
  const span = ref(24)
  const gutter = ref(0)
  const currentTab = ref('systemInfo')
  const GET_CONFIG_API = '/webniu/admin/config/getconfig'
  const SET_CONFIG_API = '/webniu/admin/config/setconfig'
  // 表单配置
  const formItems = computed(() => [...dynamicFormItems.value])
  // 处理选项卡点击事件
  const handleTabClick = (tab: any) => {
    if (tab.props.name === currentTab.value) {
      return
    }
    dynamicFormItems.value = []
    currentTab.value = tab.props.name
    if (currentTab.value === 'systemInfo') {
      labelPosition.value = 'top'
    }
    if (currentTab.value === 'systemSetting') {
      labelPosition.value = 'right'
      addFormRules({
        background_image: [{ required: true, message: '请上传背景图片', trigger: 'blur' }]
      })
    }
    if (currentTab.value === 'attachMent') {
      labelPosition.value = 'right'
      addFormRules({
        dirname: [{ required: true, message: '请输入附件目录', trigger: 'blur' }],
        path_style: [{ required: true, message: '请输入附件路径样式', trigger: 'blur' }],
        include: [{ required: true, message: '请输入附件包含文件类型', trigger: 'blur' }],
        exclude: [{ required: true, message: '请输入附件排除文件类型', trigger: 'blur' }],
        single_limit: [{ required: true, message: '请输入单个文件大小限制', trigger: 'blur' }],
        total_limit: [{ required: true, message: '请输入总文件大小限制', trigger: 'blur' }],
        nums: [{ required: true, message: '请输入最大上传文件数量', trigger: 'blur' }]
      })
    }
    if (currentTab.value === 'waterMark') {
      labelPosition.value = 'right'
    }
    if (currentTab.value === 'systemTheme') {
      labelPosition.value = 'right'
    }
    if (currentTab.value === 'interfaceConfig') {
      labelPosition.value = 'right'
    }
    getConfigList()
  }
  const getConfigList = async () => {
    loading.value = true
    const res = await get<any>(GET_CONFIG_API, {
      model: 'system',
      name: currentTab.value
    })
    loading.value = false
    dynamicFormItems.value = []
    const newItem = res?.form || []
    admin.value = res?.username || 'system'
    updateTime.value = res?.updated_at || ''
    dynamicFormItems.value.push(...newItem)
    formData.value = {}
    Object.assign(formData.value, res.data || {})
  }

  /**
   * 处理表单提交事件
   */
  const handleSubmit = async (): Promise<void> => {
    await formRef.value.validate()
    if (currentTab.value === 'systemInfo') {
      systemStore.updateSystemConfig({
        systemInfo: formData.value
      })
    }

    await post<any>(SET_CONFIG_API, {
      model: 'system',
      label: currentTab.value,
      value: formData.value
    })
    ElMessage.success('保存成功')
  }
  const storageConfig = {
    1: {
      fields: [
        'ftp_ip',
        'ftp_port',
        'ftp_pasv',
        'verify_ssl',
        'ftp_username',
        'ftp_password',
        'ftp_domain'
      ],
      rules: {
        ftp_ip: [{ required: true, message: '请输入FTP IP', trigger: 'blur' }],
        ftp_port: [{ required: true, message: '请输入FTP端口', trigger: 'blur' }],
        ftp_pasv: [{ required: true, message: '请输入FTP PASV', trigger: 'blur' }],
        ftp_username: [{ required: true, message: '请输入FTP用户名', trigger: 'blur' }],
        ftp_password: [{ required: true, message: '请输入FTP密码', trigger: 'blur' }],
        ftp_domain: [{ required: true, message: '请输入FTP域名', trigger: 'blur' }]
      }
    },
    2: {
      fields: ['qiniu_accesskey', 'qiniu_secretkey', 'verify_ssl', 'qiniu_bucket', 'qiniu_domain'],
      rules: {
        qiniu_accesskey: [{ required: true, message: '请输入七牛云AccessKey', trigger: 'blur' }],
        qiniu_secretkey: [{ required: true, message: '请输入七牛云SecretKey', trigger: 'blur' }],
        qiniu_bucket: [{ required: true, message: '请输入七牛云Bucket', trigger: 'blur' }],
        qiniu_domain: [{ required: true, message: '请输入七牛云域名', trigger: 'blur' }]
      }
    },
    3: {
      fields: [
        'oss_accesskeyid',
        'oss_accesskeysecret',
        'oss_local',
        'verify_ssl',
        'oss_bucket',
        'oss_endpoint',
        'oss_domain'
      ],
      rules: {
        oss_accesskeyid: [{ required: true, message: '请输入OSS AccessKeyID', trigger: 'blur' }],
        oss_accesskeysecret: [
          { required: true, message: '请输入OSS AccessKeySecret', trigger: 'blur' }
        ],
        oss_local: [{ required: true, message: '请输入OSS Local', trigger: 'blur' }],
        oss_bucket: [{ required: true, message: '请输入OSS Bucket', trigger: 'blur' }],
        oss_endpoint: [{ required: true, message: '请输入OSS Endpoint', trigger: 'blur' }],
        oss_domain: [{ required: true, message: '请输入OSS域名', trigger: 'blur' }]
      }
    },
    4: {
      fields: [
        'cos_secretid',
        'cos_secretkey',
        'verify_ssl',
        'cos_bucket',
        'cos_region',
        'cos_domain'
      ],
      rules: {
        cos_secretid: [{ required: true, message: '请输入COS SecretID', trigger: 'blur' }],
        cos_secretkey: [{ required: true, message: '请输入COS SecretKey', trigger: 'blur' }],
        cos_bucket: [{ required: true, message: '请输入COS Bucket', trigger: 'blur' }],
        cos_region: [{ required: true, message: '请输入COS Region', trigger: 'blur' }],
        cos_domain: [{ required: true, message: '请输入COS域名', trigger: 'blur' }]
      }
    }
  }
  const markstyleConfig = {
    0: {
      fields: ['pic_thumb_text', 'pic_thumb_size', 'pic_thumb_color'],
      rules: {
        pic_thumb_text: [{ required: true, message: '请输入水印文本', trigger: 'blur' }],
        pic_thumb_size: [{ required: true, message: '请输入水印大小', trigger: 'blur' }],
        pic_thumb_color: [{ required: true, message: '请输入水印颜色', trigger: 'blur' }]
      }
    },
    1: {
      fields: ['pic_thumb_img', 'pic_mark_weizhi'],
      rules: {
        pic_thumb_img: [{ required: true, message: '请上传水印图片', trigger: 'blur' }],
        pic_mark_weizhi: [{ required: true, message: '请输入水印位置', trigger: 'blur' }]
      }
    }
  }
  const smtpConfig = {
    1: {
      fields: [
        'smtp_ip',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_secure',
        'smtp_from',
        'smtp_test'
      ],
      rules: {
        smtp_ip: [{ required: true, message: '请输入SMTP IP', trigger: 'blur' }],
        smtp_port: [{ required: true, message: '请输入SMTP端口', trigger: 'blur' }],
        smtp_username: [{ required: true, message: '请输入SMTP用户名', trigger: 'blur' }],
        smtp_password: [{ required: true, message: '请输入SMTP密码', trigger: 'blur' }],
        smtp_secure: [{ required: true, message: '请输入SMTP安全类型', trigger: 'blur' }],
        smtp_from: [{ required: true, message: '请输入SMTP发送者', trigger: 'blur' }]
      }
    }
  }
  const smsConfig = {
    1: {
      fields: ['sms_aliyun_access_key_id', 'sms_aliyun_access_key_secret', 'sms_aliyun_sign_name'],
      rules: {
        sms_aliyun_access_key_id: [
          { required: true, message: '请输入阿里云AccessKeyIdID', trigger: 'blur' }
        ],
        sms_aliyun_access_key_secret: [
          { required: true, message: '请输入阿里云AccessKeySecret', trigger: 'blur' }
        ],
        sms_aliyun_sign_name: [{ required: true, message: '请输入阿里云签名名称', trigger: 'blur' }]
      }
    },
    2: {
      fields: [
        'sms_qcloud_sdk_app_id',
        'sms_qcloud_secret_id',
        'sms_qcloud_secret_key',
        'sms_qcloud_sign_name'
      ],
      rules: {
        sms_qcloud_sdk_app_id: [
          { required: true, message: '请输入腾讯云SDK AppID', trigger: 'blur' }
        ],
        sms_qcloud_secret_id: [
          { required: true, message: '请输入腾讯云Secret ID', trigger: 'blur' }
        ],
        sms_qcloud_secret_key: [
          { required: true, message: '请输入腾讯云Secret Key', trigger: 'blur' }
        ],
        sms_qcloud_sign_name: [{ required: true, message: '请输入腾讯云签名名称', trigger: 'blur' }]
      }
    }
  }
  watch(
    () => formData.value.storage_type,
    (newStorageType, oldStorageType) => {
      showhide(storageConfig, newStorageType, oldStorageType)
    }
  )

  watch(
    () => formData.value.pic_mark_style,
    (newMarkstyleType, oldMarkstyleType) => {
      showhide(markstyleConfig, newMarkstyleType, oldMarkstyleType)
    }
  )

  watch(
    () => formData.value.smtp_type,
    (newSmtpType, oldSmtpType) => {
      showhide(smtpConfig, newSmtpType ? 1 : 0, oldSmtpType ? 1 : 0)
    }
  )

  watch(
    () => formData.value.sms_type,
    (newSmsType, oldSmsType) => {
      showhide(smsConfig, newSmsType, oldSmsType)
    }
  )

  const showhide = (config: any, newType: number, oldType?: number) => {
    // 获取配置
    const newConfig = config[newType as keyof typeof config]
    const oldConfig = oldType !== undefined ? config[oldType as keyof typeof config] : undefined

    // 1. 优先隐藏旧值对应的字段
    if (oldConfig?.fields) {
      oldConfig.fields.forEach((fieldKey: string) => {
        const item = dynamicFormItems.value.find((i: any) => i.key === fieldKey)
        if (item) {
          item.hidden = true
        }
      })
    }

    // 2. 显示新值对应的字段
    if (newConfig?.fields) {
      newConfig.fields.forEach((fieldKey: string) => {
        const item = dynamicFormItems.value.find((i: any) => i.key === fieldKey)
        if (item) {
          item.hidden = false
        }
      })
    }

    // 3. 添加新值的验证规则
    if (newConfig?.rules) {
      addFormRules(newConfig.rules)
    }
  }
  // 初始化默认选中第一个分组
  onMounted(() => {
    nextTick(() => {
      getConfigList()
    })
  })
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
    if (event.key === 'Enter' && !event.shiftKey) {
      // 阻止默认行为
      event.preventDefault()
      // 触发表单提交
      handleSubmit()
    }
  }
</script>

<style scoped>
  .wn-class-tabs :deep(.el-tabs__header) {
    width: auto;
    margin: 0 0 0 0;
  }
  .wn-config-card :deep(.el-card__header) {
    border-bottom: 0px !important;
  }
  .wn-config-card :deep(.el-card__body) {
    padding-top: 0px;
  }
  .form-container {
    max-width: 100%;
    margin: 0 auto 0 0;
  }
  .form-container section {
    padding: 0px;
  }
  @media (max-width: 768px) {
    .form-container {
      max-width: 100%;
      padding: 0 16px;
    }
  }
  .form-container :deep(.el-form-item__label) {
    margin-bottom: 0px;
  }
  .wn-class-tooltip {
    font-size: 12px;
    color: #909399;
    display: inline-block;
    margin-left: 8px;
    vertical-align: middle;
  }
  :deep(.el-tabs__item) {
    color: #909399;
  }
  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
  }
  .wn-config-card {
    background-image: linear-gradient(
      to right top,
      transparent,
      transparent,
      color-mix(in oklab, var(--el-color-primary) 0%, transparent),
      color-mix(in oklab, var(--el-color-primary) 12%, transparent)
    );
  }
  .tab-content-fade-enter-active,
  .tab-content-fade-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }
  .tab-content-fade-enter-from {
    opacity: 0;
    transform: translateX(-10px);
  }
  .tab-content-fade-leave-to {
    opacity: 0;
    transform: translateX(10px);
  }
  .el-tag {
    border: none;
    aspect-ratio: 1;
  }
</style>
