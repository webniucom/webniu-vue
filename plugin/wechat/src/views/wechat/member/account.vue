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
                :defaultExpanded="true"
                :labelWidth="labelWidth"
                :labelPosition="labelPosition"
                :show-reset="false"
                :show-submit="false"
                v-loading="loading"
                style="max-width: 605px"
              >
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
  import { useUserStore } from '@stores/modules/user'
  import { post } from '@admin/core/request'

  defineOptions({ name: 'UserCenter' })
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)
  const formRef = ref()
  const loading = ref(false)
  // 选项卡
  const editableTabsValue = ref('basicsetup')
  const editableTabs = ref([
    {
      title: '基本资料',
      name: 'basicsetup'
    },
    {
      title: '修改密码',
      name: 'changepassword'
    }
  ])
  /**
   * 表单数据
   */
  const formData = ref<any>({})
  const updateTime = ref(userInfo.value?.info?.updated_at || '')

  const dynamicFormItems = ref<any[]>([])
  const labelWidth = ref(100)
  const labelPosition = ref<'right' | 'left' | 'top'>('top')
  const currentTab = ref('basicsetup')
  const UPDATE_API = '/webniu/admin/account/update'
  const PASSWORD_API = '/webniu/admin/account/password'
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
    formData.value = {}
    if (currentTab.value === 'basicsetup') {
      labelPosition.value = 'top'
      dynamicFormItems.value = [
        {
          label: '用户名',
          key: 'username',
          type: 'input',
          span: 24,
          search: true,
          disabled: true,
          props: {
            placeholder: '请输入用户名',
            clearable: true,
            tooltip: true,
            disabled: true
          },
          rules: [
            {
              required: true,
              message: '请输入用户名',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '昵称',
          key: 'nickname',
          type: 'input',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入昵称',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入昵称',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '头像',
          key: 'avatar',
          type: 'upload',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入头像',
            clearable: true,
            tooltip: true,
            multiple: false,
            uploadlist: true
          },
          rules: [
            {
              required: true,
              message: '请输入头像',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '邮箱',
          key: 'email',
          type: 'input',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入邮箱',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入邮箱',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '手机',
          key: 'mobile',
          type: 'input',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入手机',
            clearable: true,
            tooltip: true
          },
          rules: [
            {
              required: true,
              message: '请输入手机',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '性别',
          key: 'gender',
          type: 'select',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入性别',
            clearable: false,
            tooltip: true,
            options: [
              {
                label: '未设置',
                value: 0
              },
              {
                label: '男',
                value: 1
              },
              {
                label: '女',
                value: 2
              }
            ]
          }
        },
        {
          label: '个人介绍',
          key: 'introduction',
          type: 'input',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入个人介绍',
            clearable: false,
            tooltip: true,
            type: 'textarea',
            maxlength: 200,
            showWordlimit: true,
            rows: 3
          }
        }
      ]
      Object.assign(formData.value, userInfo.value.info)
    }
    if (currentTab.value === 'changepassword') {
      labelPosition.value = 'top'
      dynamicFormItems.value = [
        {
          label: '旧密码',
          key: 'old_password',
          type: 'password',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入旧密码',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入旧密码',
              trigger: 'blur'
            }
          ]
        },
        {
          label: '新密码',
          key: 'password',
          type: 'password',
          span: 24,
          search: true,
          props: {
            placeholder: '请输入新密码',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请输入新密码',
              trigger: 'blur'
            },
            {
              validator: (rule: any, value: any, callback: any) => {
                if (value.length < 6) {
                  callback(new Error('密码长度不能小于6位'))
                } else {
                  callback()
                }
              },
              trigger: ['blur', 'change']
            }
          ]
        },
        {
          label: '确认密码',
          key: 'password_confirm',
          type: 'password',
          span: 24,
          search: true,
          props: {
            placeholder: '请确认新密码',
            clearable: true,
            tooltip: true,
            type: 'password'
          },
          rules: [
            {
              required: true,
              message: '请确认新密码',
              trigger: 'blur'
            },
            {
              validator: (rule: any, value: any, callback: any) => {
                if (value !== formData.value.password) {
                  callback(new Error('两次输入密码不一致'))
                } else {
                  callback()
                }
              },
              trigger: ['blur', 'change']
            }
          ]
        }
      ]
    }
  }

  /**
   * 处理表单提交事件
   */
  const handleSubmit = async (): Promise<any> => {
    await formRef.value.validate()
    loading.value = true
    try {
      if (currentTab.value === 'basicsetup') {
        await post(UPDATE_API, formData.value)
        //更新用户信息
        Object.assign(userInfo.value.info, formData.value)
        loading.value = false
        ElMessage.success('修改成功')
      } else {
        await post(PASSWORD_API, formData.value)
        //重新登录
        ElMessage.success('密码修改成功')
        setTimeout(() => {
          userStore.logOut()
        }, 1000)
      }
    } finally {
      loading.value = false
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
