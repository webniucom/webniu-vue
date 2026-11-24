<template>
  <div>
    <ElCard class="art-card-xs wn-config-card art-full-height">
      <template #header>
        <el-tabs v-model="currentTab" class="wn-class-tabs" @tab-click="handleTabClick" type="card">
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
                :key="currentTab"
                ref="formRef"
                v-model="formData"
                :items="formItems"
                :defaultExpanded="true"
                :labelWidth="labelWidth"
                :labelPosition="labelPosition"
                :show-reset="false"
                :show-submit="false"
                v-loading="loading"
                style="max-width: 605px"
              >
                <template #pay_dir>
                  <ElInput v-model="formData.pay_dir" readonly placeholder="支付授权目录">
                    <template #append
                      ><el-button type="primary" plain @click="copyToClipboard(formData.pay_dir)"
                        >点击复制</el-button
                      ></template
                    >
                  </ElInput>
                </template>
                <template #native_url>
                  <ElInput v-model="formData.native_url" readonly placeholder="Native支付回调地址">
                    <template #append
                      ><el-button type="primary" plain @click="copyToClipboard(formData.native_url)"
                        >点击复制</el-button
                      ></template
                    >
                  </ElInput>
                </template>
                <template #notify_url>
                  <ElInput v-model="formData.notify_url" readonly placeholder="异步通知地址">
                    <template #append
                      ><el-button type="primary" plain @click="copyToClipboard(formData.notify_url)"
                        >点击复制</el-button
                      ></template
                    >
                  </ElInput>
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
            最近更新：<span>{{ updateTime }}</span>
          </div>
          <ElButton type="primary" @click="handleSubmit">保存并发布配置</ElButton>
        </div>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { post, get } from '@admin/core/request'

  defineOptions({ name: 'UserCenter' })

  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)

  const INDEX_API = url + '/index'
  const UPDATE_API = url + '/update'

  const formRef = ref()
  const loading = ref(false)
  // 选项卡
  const editableTabs = ref([
    {
      title: '微信支付',
      name: 'wechatpay'
    },
    {
      title: '支付宝',
      name: 'alipay'
    }
  ])
  /**
   * 表单数据
   */
  const formData = ref<any>({})
  const updateTime = ref('')

  const dynamicFormItems = ref<any[]>([])
  const labelWidth = ref(100)
  const labelPosition = ref<'right' | 'left' | 'top'>('top')
  const currentTab = ref('wechatpay')
  const fetchGetIndexdata = ref<any>({})
  // 表单配置
  const formItems = computed(() => [...dynamicFormItems.value])
  // 处理选项卡点击事件
  const handleTabClick = (tab: any) => {
    if (tab.props.name === currentTab.value) {
      return
    }
    dynamicFormItems.value = []
    currentTab.value = tab.props.name || currentTab.value
    getConfigList()
  }
  const getConfigList = async () => {
    if (currentTab.value === 'wechatpay') {
      labelPosition.value = 'right'
      formData.value = {
        open: 0,
        version: 0,
        mch_id: '',
        v2_secret_key: '',
        secret_key: '',
        currenttab: currentTab.value
      }
      dynamicFormItems.value = [
        {
          label: '基础配置',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '开启状态',
          labelWidth: '100px',
          key: 'open',
          type: 'switch',
          span: 12,
          props: {
            placeholder: '是否开启',
            tooltip: true,
            activeValue: 1,
            inactiveValue: 0
          },
          rules: [
            {
              required: true,
              message: '请选择是否开启',
              trigger: 'change'
            }
          ]
        },
        {
          label: '版本选择',
          labelWidth: '100px',
          key: 'version',
          type: 'select',
          span: 24,
          search: true,
          props: {
            placeholder: '请选择版本选择',
            clearable: false,
            tooltip: true,
            options: [
              {
                label: 'V2',
                value: 0
              },
              {
                label: 'V3',
                value: 1
              }
            ]
          }
        },
        {
          label: '支付商户号',
          labelWidth: '100px',
          key: 'mch_id',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入支付商户号',
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入支付商户号',
              trigger: 'change'
            }
          ]
        },
        {
          label: 'V2支付密钥',
          labelWidth: '100px',
          key: 'v2_secret_key',
          type: 'input',
          span: 24,
          hidden: () => formData.value.version !== 0,
          props: {
            placeholder: '请输入V2支付密钥',
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入V2支付密钥',
              trigger: 'change'
            }
          ]
        },
        {
          label: 'V3支付密钥',
          labelWidth: '100px',
          key: 'secret_key',
          type: 'input',
          span: 24,
          hidden: () => formData.value.version !== 1,
          props: {
            placeholder: '请输入V3支付密钥',
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入V3支付密钥',
              trigger: 'change'
            }
          ]
        },
        {
          label: 'V3平台证书',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '上传证书',
          labelWidth: '100px',
          key: 'platform_certs',
          type: 'upload',
          span: 24,
          props: {
            placeholder: '上传平台证书文件',
            clearable: true,
            tooltip: true,
            multiple: false,
            uploadlist: false,
            accept: '.pem',
            autoUpload: true,
            action: '/app/wechat/account/upload/file'
          },
          rules: [
            {
              required: false,
              message: '请输入回复名称',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '商户证书',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: 'Key.pem',
          labelWidth: '100px',
          key: 'private_key',
          type: 'upload',
          span: 24,
          props: {
            placeholder: '上传Key.pem文件',
            clearable: true,
            tooltip: true,
            multiple: false,
            uploadlist: false,
            accept: '.pem',
            autoUpload: true,
            action: '/app/wechat/account/upload/file'
          },
          rules: [
            {
              required: false,
              message: '请输入回复名称',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Cert.pem',
          labelWidth: '100px',
          key: 'certificate',
          type: 'upload',
          span: 24,
          props: {
            placeholder: '上传Cert.pem文件',
            clearable: true,
            tooltip: true,
            multiple: false,
            uploadlist: false,
            accept: '.pem',
            autoUpload: true,
            action: '/app/wechat/account/upload/file'
          },
          rules: [
            {
              required: false,
              message: '请输入回复名称',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '回调设置',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '支付授权目录',
          labelWidth: '130px',
          key: 'pay_dir',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入支付授权目录',
            tooltip: true
          },
          rules: [
            {
              required: false,
              message: '请输入支付授权目录',
              trigger: 'change'
            }
          ]
        },
        {
          label: 'Native支付回调',
          labelWidth: '130px',
          key: 'native_url',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入Native支付回调',
            tooltip: true
          },
          rules: [
            {
              required: false,
              message: '请输入Native支付回调',
              trigger: 'change'
            }
          ]
        }
      ]
      updateTime.value = fetchGetIndexdata.value.wechatpay.updated_at || '-'
      Object.assign(formData.value, fetchGetIndexdata.value.wechatpay || {})
    } else if (currentTab.value === 'alipay') {
      labelPosition.value = 'right'
      formData.value = {
        open: 0,
        sandbox: 0,
        app_id: '',
        sign_type: 'RSA2',
        app_secret_private: '',
        alipay_public_key: '',
        currenttab: currentTab.value
      }
      dynamicFormItems.value = [
        {
          label: '基础配置',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '开启状态',
          labelWidth: '100px',
          key: 'open',
          type: 'switch',
          span: 12,
          props: {
            placeholder: '是否开启',
            tooltip: true,
            activeValue: 1,
            inactiveValue: 0
          },
          rules: [
            {
              required: true,
              message: '请选择是否开启',
              trigger: 'change'
            }
          ]
        },
        {
          label: '沙箱模式',
          labelWidth: '100px',
          key: 'sandbox',
          type: 'switch',
          span: 12,
          props: {
            placeholder: '开发联调时启用，生产环境请关闭',
            tooltip: true,
            activeValue: 1,
            inactiveValue: 0
          }
        },
        {
          label: '应用 APPID',
          labelWidth: '100px',
          key: 'app_id',
          type: 'input',
          span: 24,
          props: {
            placeholder: '支付宝开放平台应用 APPID',
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入应用 APPID',
              trigger: 'change'
            }
          ]
        },
        {
          label: '签名类型',
          labelWidth: '100px',
          key: 'sign_type',
          type: 'select',
          span: 24,
          props: {
            placeholder: '请选择签名类型',
            clearable: false,
            tooltip: true,
            options: [
              {
                label: 'RSA2（推荐，2048位）',
                value: 'RSA2'
              },
              {
                label: 'RSA（兼容，1024位）',
                value: 'RSA'
              }
            ]
          }
        },
        {
          label: '密钥配置',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '应用私钥',
          labelWidth: '100px',
          key: 'app_secret_private',
          type: 'textarea',
          span: 24,
          props: {
            placeholder: '请粘贴应用私钥（一行字符串，不含 BEGIN/END 标记）',
            tooltip: true,
            rows: 4
          },
          rules: [
            {
              required: true,
              message: '请输入应用私钥',
              trigger: 'change'
            }
          ]
        },
        {
          label: '支付宝公钥',
          labelWidth: '100px',
          key: 'alipay_public_key',
          type: 'textarea',
          span: 24,
          props: {
            placeholder: '请粘贴支付宝公钥（一行字符串，不含 BEGIN/END 标记）',
            tooltip: true,
            rows: 4
          },
          rules: [
            {
              required: true,
              message: '请输入支付宝公钥',
              trigger: 'change'
            }
          ]
        },
        {
          label: '回调设置',
          labelWidth: '100px',
          key: 'divider',
          type: 'divider',
          span: 12,
          hidden: false,
          labelPosition: 'top',
          props: {
            placeholder: false,
            clearable: true,
            labelPosition: 'top'
          }
        },
        {
          label: '同步返回地址',
          labelWidth: '130px',
          key: 'pay_dir',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入支付授权目录',
            tooltip: true
          },
          rules: [
            {
              required: false,
              message: '请输入支付授权目录',
              trigger: 'change'
            }
          ]
        },
        {
          label: '异步通知地址',
          labelWidth: '130px',
          key: 'notify_url',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入异步通知地址',
            tooltip: true
          },
          rules: [
            {
              required: false,
              message: '请输入异步通知地址',
              trigger: 'change'
            }
          ]
        }
      ]
      updateTime.value = fetchGetIndexdata.value.alipay.updated_at || '-'
      Object.assign(formData.value, fetchGetIndexdata.value.alipay || {})
    }
  }

  //加载数据列表
  const fetchGetIndex = () => {
    return get(INDEX_API)
  }

  /**
   * 处理表单提交事件
   */
  const handleSubmit = async (): Promise<any> => {
    await formRef.value.validate()
    loading.value = true
    try {
      await post(UPDATE_API, formData.value)
      loading.value = false
      ElMessage.success('修改成功')
    } finally {
      loading.value = false
    }
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

  // 初始化默认选中第一个分组
  onMounted(() => {
    nextTick(() => {
      fetchGetIndex().then((res) => {
        fetchGetIndexdata.value = res || {}
        getConfigList()
      })
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
