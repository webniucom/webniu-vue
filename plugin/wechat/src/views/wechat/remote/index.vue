﻿<template>
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
            <div v-if="editableTabsValue === 'interface'">
              <ElAlert
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
                <ElButton size="small" @click="copyToClipboard(formData.serviceurl)">
                  复制
                </ElButton>
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
            <Transition v-else name="tab-content-fade" mode="out-in">
              <ArtForm
                :key="editableTabsValue"
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
                <template #customSlot>
                  <div style="width: 100vh">
                    <ElAlert
                      title="验证文件说明"
                      type="primary"
                      style="width: 100vh"
                      description="需要设置伪静态，否则会导致验证失败，伪静态规则为：rewrite ^/mp/(.*)$ /app/webniu/mp/$1 break;"
                      show-icon
                    />
                  </div>
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
  import { post } from '@admin/core/request'
  import { useSystemStore } from '@stores/modules/system'
  const systemStore = useSystemStore()
  const systemConfig = computed(() => systemStore.systemConfig)

  defineOptions({ name: 'RemoteConfig' })

  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)

  const UPDATE_API = url + '/update'

  const formRef = ref()
  const loading = ref(false)
  // 选项卡
  const editableTabsValue = ref('basicsetup')
  const editableTabs = ref([
    {
      title: '基本配置',
      name: 'basicsetup'
    },
    {
      title: '附加功能',
      name: 'attachment'
    },
    {
      title: '接口配置',
      name: 'interface'
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
  const currentTab = ref('basicsetup')
  // 表单配置
  const formItems = computed(() => [...dynamicFormItems.value])
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
    formData.value = {}
    if (currentTab.value === 'basicsetup') {
      labelPosition.value = 'right'
      dynamicFormItems.value = [
        {
          label: '公众号信息',
          labelWidth: '70px',
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
          label: '平台图标',
          labelWidth: '100px',
          key: 'logo',
          type: 'upload',
          span: 24,
          props: {
            placeholder: '请选择平台图标',
            tooltip: true,
            multiple: false,
            uploadlist: true
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
            uploadlist: true
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
            placeholder: '请输入AppSecret（授权接入可留空）',
            tooltip: true
          },
          rules: [
            {
              // 授权接入（isconnect=1）时可留空，手动接入必填
              validator: (_rule: any, value: any, callback: any) => {
                if (Number(formData.value?.isconnect ?? 0) === 1) return callback()
                if (!value) return callback(new Error('请输入AppSecret'))
                callback()
              },
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
        }
      ]
      Object.assign(formData.value, systemConfig.value.wechat)
    }
    if (currentTab.value === 'attachment') {
      labelPosition.value = 'right'
      dynamicFormItems.value = [
        {
          key: 'customSlot',
          type: 'input' // 这里的type会被插槽覆盖
        },
        {
          label: '验证文件',
          labelWidth: '70px',
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
          label: '上传文件',
          labelWidth: '120px',
          key: 'name',
          type: 'upload',
          span: 24,
          props: {
            placeholder:
              '验证域名、域名回调、jssdk等均需要验证站点，需要上传特定文件，文件提示上传成功即可去验证！',
            clearable: true,
            tooltip: true,
            multiple: false,
            uploadlist: false,
            accept: '.txt,.html,.xml',
            autoUpload: true,
            action: '/app/wechat/account/upload/insert',
            postData: {
              dir: '/mp/',
              filename: true
            }
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
          label: '远程附件',
          labelWidth: '70px',
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
          label: '是否启用',
          labelWidth: '120px',
          key: 'storage_type',
          type: 'select',
          span: 12,
          labelPosition: 'top',
          props: {
            placeholder: '开启独立存储单元',
            clearable: false,
            tooltip: true,
            options: [
              {
                label: '关闭',
                value: 0
              },
              {
                label: 'FTP附件',
                value: 1
              },
              {
                label: '七牛云存储',
                value: 2
              },
              {
                label: '阿里云OSS',
                value: 3
              },
              {
                label: '腾讯云存储',
                value: 4
              }
            ]
          }
        },
        {
          label: 'FTP地址',
          labelWidth: '120px',
          key: 'ftp_ip',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '请输入FTP地址(例如：192.168.1.100)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入FTP地址',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'FTP端口',
          labelWidth: '120px',
          key: 'ftp_port',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '请输入FTP端口(例如：21)。',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入FTP端口',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '被动模式',
          labelWidth: '120px',
          key: 'ftp_pasv',
          type: 'radiogroup',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '上传失败时候尝试关闭被动模式',
            clearable: true,
            tooltip: true,
            options: [
              {
                label: '关闭',
                value: 0
              },
              {
                label: '开启',
                value: 1
              }
            ]
          },
          rules: [
            {
              required: true,
              message: '请输入被动模式',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'FTP用户名',
          labelWidth: '120px',
          key: 'ftp_username',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '请输入FTP用户名',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入FTP用户名',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'FTP密码',
          labelWidth: '120px',
          key: 'ftp_password',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '请输入FTP密码',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入FTP密码',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '远程图片地址',
          labelWidth: '120px',
          key: 'ftp_domain',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 1,
          props: {
            placeholder: '请输入远程图片地址(例如：http://www.example.com)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入远程图片地址',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Accesskey',
          labelWidth: '120px',
          key: 'qiniu_accesskey',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 2,
          props: {
            placeholder: '请输入Accesskey',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Accesskey',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Secretkey',
          labelWidth: '120px',
          key: 'qiniu_secretkey',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 2,
          props: {
            placeholder: '请输入Secretkey',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入Secretkey',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Bucket',
          labelWidth: '120px',
          key: 'qiniu_bucket',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 2,
          props: {
            placeholder: '请输入Bucket(例如：example-bucket)区块。',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Bucket',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Url',
          labelWidth: '120px',
          key: 'qiniu_domain',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 2,
          props: {
            placeholder: '请输入Url(例如：http://www.example.com)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Url',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'KeyID',
          labelWidth: '120px',
          key: 'oss_accesskeyid',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '请输入KeyID',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入KeyID',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'KeySecret',
          labelWidth: '120px',
          key: 'oss_accesskeysecret',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '请输入KeySecret',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入KeySecret',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '内网上传',
          labelWidth: '120px',
          key: 'oss_local',
          type: 'radiogroup',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '是否开启内网上传(默认关闭)。',
            clearable: true,
            tooltip: true,
            options: [
              {
                label: '关闭',
                value: 0
              },
              {
                label: '开启',
                value: 1
              }
            ]
          },
          rules: [
            {
              required: true,
              message: '请输入内网上传',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Bucket',
          labelWidth: '120px',
          key: 'oss_bucket',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '请输入Bucket(例如：example-bucket)区块箱体。',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Bucket',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Endpoint',
          labelWidth: '120px',
          key: 'oss_endpoint',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '请输入Endpoint(例如：oss-cn-beijing.aliyuncs.com)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Endpoint',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '自定义URL',
          labelWidth: '120px',
          key: 'oss_domain',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 3,
          props: {
            placeholder: '请输入自定义URL(例如：http://www.example.com)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入自定义URL',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'SecretID',
          labelWidth: '120px',
          key: 'cos_secretid',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 4,
          props: {
            placeholder: '请输入SecretID',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入SecretID',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'SecretKEY',
          labelWidth: '120px',
          key: 'cos_secretkey',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 4,
          props: {
            placeholder: '请输入SecretKEY',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入SecretKEY',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Bucket',
          labelWidth: '120px',
          key: 'cos_bucket',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 4,
          props: {
            placeholder: '请输入Bucket(例如：example-bucket)区块箱体。',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Bucket',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'REGION',
          labelWidth: '120px',
          key: 'cos_region',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 4,
          props: {
            placeholder: '请输入REGION(例如：cn-beijing)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入REGION',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Url',
          labelWidth: '120px',
          key: 'cos_domain',
          type: 'input',
          span: 24,
          hidden: () => formData.value.storage_type !== 4,
          props: {
            placeholder: '请输入Url(例如：http://www.example.com)',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入Url',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'SSL验证',
          labelWidth: '120px',
          key: 'verify_ssl',
          type: 'radiogroup',
          span: 24,
          hidden: () => formData.value.storage_type === 0,
          props: {
            placeholder: '上传失败时候尝试关闭SSL验证',
            clearable: true,
            tooltip: true,
            options: [
              {
                label: '关闭',
                value: 0
              },
              {
                label: '开启',
                value: 1
              }
            ]
          },
          rules: [
            {
              required: false,
              message: '请输入SSL 验证',
              trigger: 'blur'
            }
          ]
        }
      ]
      Object.assign(formData.value, {
        storage_type: 0,
        ftp_ip: '',
        ftp_port: '',
        ftp_pasv: 0,
        verify_ssl: 0,
        oss_local: 0,
        oss_endpoint: '',
        oss_bucket: '',
        oss_domain: '',
        cos_secretid: '',
        cos_secretkey: '',
        cos_bucket: '',
        cos_region: '',
        cos_domain: '',
        ...systemConfig.value.options.attachment
      })
    }
    if (currentTab.value === 'interface') {
      dynamicFormItems.value = [
        {
          label: '服务器地址',
          labelWidth: '120px',
          key: 'serviceurl',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入服务器地址',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入服务器地址',
              trigger: 'blur'
            }
          ]
        },
        {
          label: 'Token',
          labelWidth: '120px',
          key: 'token',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入Token',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入FTP地址',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '解密密钥',
          labelWidth: '120px',
          key: 'aes_key',
          type: 'input',
          span: 24,
          props: {
            placeholder: '请输入解密密钥',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入解密密钥',
              trigger: 'blur'
            }
          ]
        }
      ]
      Object.assign(formData.value, systemConfig.value.wechat)
    }
  }

  /**
   * 处理表单提交事件
   */
  const handleSubmit = async (): Promise<any> => {
    if ((formRef.value && currentTab.value === 'basicsetup') || currentTab.value === 'attachment') {
      await formRef.value.validate()
    }
    loading.value = true
    try {
      if (
        currentTab.value === 'basicsetup' ||
        currentTab.value === 'interface' ||
        currentTab.value === 'attachment'
      ) {
        await post(UPDATE_API, {
          ...formData.value,
          currenttab: currentTab.value
        })
        loading.value = false
        if (currentTab.value === 'attachment') {
          let options = {
            options: {
              attachment: {
                ...systemConfig.value.options.attachment,
                ...formData.value
              }
            }
          }
          systemStore.updateSystemConfig(options)
        } else {
          systemStore.updateSystemConfig({
            wechat: formData.value
          })
        }
        ElMessage.success('修改成功')
      }
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

  // 初始化默认选中第一个分组
  onMounted(() => {
    nextTick(() => {
      updateTime.value = systemConfig.value.wechat.updated_at || ''
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

  /* 参数配置区域样式 */
  .params-config {
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
</style>
