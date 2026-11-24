<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="general-dialog"
    header-class="general-dialog-header"
    body-class="general-dialog-body"
    @closed="handleClosed"
  >
    <ElScrollbar class="!h-[calc(100vh-130px)]" max-height="calc(100vh-130px)">
      <ArtForm
        ref="formRef"
        v-model="formData"
        :items="formItems"
        :rules="rules"
        label-width="80px"
        :show-reset="false"
        :show-submit="false"
      >
      </ArtForm>
    </ElScrollbar>
    <template #footer>
      <div class="general-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'

  interface Props {
    visible: boolean
    type: string
    title: string
    grouplist?: any[]
    editData?: Partial<any>
    items?: any[]
    data?: any[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = computed(() => {
    if (props.type === 'update') return `编辑${props.title}`
    return `新增${props.title}`
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const memberGroupOptions = computed(() =>
    props.grouplist?.map?.((item: any) => ({
      label: item.name,
      value: item.groupid
    }))
  )

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '会员分组',
      labelWidth: '90px',
      key: 'groupid',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择会员分组',
        options: memberGroupOptions.value || [],
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请选择会员分组',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '用户名',
      labelWidth: '90px',
      key: 'username',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入用户名',
        clearable: true,
        tooltip: true,
        disabled: props.type === 'update'
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
      label: '密码',
      labelWidth: '90px',
      key: 'password',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入密码',
        clearable: true,
        tooltip: true,
        type: 'password',
        showPassword: true
      },
      rules: [
        {
          required: !(props.type === 'update'),
          message: '请输入密码',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '重复密码',
      labelWidth: '90px',
      key: 're_password',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入重复密码',
        clearable: true,
        tooltip: true,
        type: 'password',
        showPassword: true
      },
      rules: [
        {
          required: !(props.type === 'update'),
          message: '密码与重复密码不一致',
          trigger: 'blur'
        },
        {
          validator: (rule: any, value: any, callback: any) => {
            if (value !== formData.value.password) {
              callback(new Error('密码与重复密码不一致'))
            } else {
              callback()
            }
          },
          trigger: ['blur', 'change']
        }
      ]
    },
    {
      label: '昵称',
      labelWidth: '90px',
      key: 'nickname',
      type: 'input',
      span: 24,
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
      label: '性别',
      labelWidth: '90px',
      key: 'sex',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择性别',
        tooltip: true,
        options: [
          {
            label: '男',
            value: '1'
          },
          {
            label: '女',
            value: '0'
          }
        ]
      },
      rules: [
        {
          required: true,
          message: '请输入性别',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '头像',
      labelWidth: '90px',
      key: 'avatar',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请输入头像',
        tooltip: true,
        multiple: false,
        uploadlist: true
      },
      rules: [
        {
          required: false,
          message: '请输入头像',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '邮箱',
      labelWidth: '90px',
      key: 'email',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入邮箱',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: false,
          message: '请输入邮箱',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '手机',
      labelWidth: '90px',
      key: 'mobile',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入手机',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: false,
          message: '请输入手机',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '生日',
      labelWidth: '90px',
      key: 'birthday',
      type: 'datetime',
      span: 24,
      props: {
        clearable: true,
        tooltip: true,
        style: { width: '100%' },
        placeholder: '请选择日期时间',
        type: 'date',
        valueFormat: 'YYYY-MM-DD'
      },
      rules: [
        {
          required: false,
          message: '请输入生日',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '等级',
      labelWidth: '90px',
      key: 'level',
      type: 'number',
      span: 24,
      props: {
        placeholder: '请输入等级',
        clearable: true,
        tooltip: true,
        min: 0,
        max: 100,
        step: 1
      },
      rules: [
        {
          required: false,
          message: '请输入等级',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '状态',
      labelWidth: '90px',
      key: 'status',
      type: 'switch',
      span: 12,
      props: {
        placeholder: '状态',
        tooltip: true,
        activeValue: 1,
        inactiveValue: 0
      },
      rules: [
        {
          required: true,
          message: '请选择状态',
          trigger: 'change'
        }
      ]
    }
  ])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})
  // 表单验证规则
  const rules = {}

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formData.value = {}
    Object.assign(formData.value, {
      ...row,
      sex: String(row.sex) || '1'
    })
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
        nextTick(() => {})
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    emit('submit', formData.value)
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
      // 阻止默认行为
      event.preventDefault()
      // 触发表单提交
      handleSubmit()
    }
  }
</script>
<style scoped>
  :global(.general-dialog .general-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.general-dialog .general-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .general-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .general-dialog .options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.w-e-text-placeholder) {
    top: 0px !important;
  }
  :global(.w-e-text-container p) {
    margin: 5px 0px !important;
  }
</style>
