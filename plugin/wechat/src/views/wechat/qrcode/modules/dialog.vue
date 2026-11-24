<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    class="emailtemp-dialog"
    header-class="emailtemp-dialog-header"
    body-class="emailtemp-dialog-body"
    align-center
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="formData"
      :items="formItems"
      label-width="80px"
      :show-reset="false"
      :show-submit="false"
    >
      <template #keyword>
        <div class="flex items-center w-full">
          <ElInput v-model="formData.keyword" readonly placeholder="请输入关键字">
            <template #append>
              <ElButton type="primary" @click="handleSubmitKey">选择关键字</ElButton>
            </template>
          </ElInput>
          <FieldTooltip content="请选择关键字" />
        </div>
        <Reply v-model:visible="ReplyDialogVisible" @submit="replySubmit"> </Reply>
      </template>
    </ArtForm>
    <template #footer>
      <div class="emailtemp-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import Reply from './reply.vue'
  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
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
  const ReplyDialogVisible = ref(false)
  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '基础设置',
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
      label: '标题',
      labelWidth: '120px',
      key: 'title',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入标题',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入标题',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '类型',
      labelWidth: '120px',
      key: 'type',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择类型',
        tooltip: true,
        options: [
          {
            label: '临时二维码',
            value: 0
          },
          {
            label: '永久二维码',
            value: 1
          }
        ]
      },
      rules: [
        {
          required: true,
          message: '请选择类型',
          trigger: 'change'
        }
      ]
    },
    {
      label: '过期时间',
      labelWidth: '120px',
      key: 'expire',
      type: 'datetime',
      span: 24,
      hidden: formData.value.type === 1,
      props: {
        placeholder: '请选择过期时间（最长 30 天）',
        clearable: true,
        tooltip: true,
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        // 禁选今天之前（不含今天）和 30 天以后的日期，时间级校验由 validateExpire 负责
        disabledDate: (time: Date) =>
          time.getTime() < Date.now() - 86400000 || time.getTime() > Date.now() + 30 * 86400000
      },
      rules: [
        {
          required: true,
          message: '请选择过期时间',
          trigger: 'blur'
        },
        {
          validator: validateExpire,
          trigger: 'change'
        }
      ]
    },
    {
      label: '场景值',
      labelWidth: '120px',
      key: 'scene_str',
      type: 'input',
      hidden: formData.value.type === 0,
      span: 24,
      props: {
        placeholder: '请输入场景值',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入场景值',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '状态',
      labelWidth: '120px',
      key: 'status',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '禁用后不会在读取时使用',
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
    },
    {
      label: '回复内容',
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
      label: '触发关键字',
      labelWidth: '120px',
      key: 'keyword',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入触发关键字',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入触发关键字',
          trigger: 'blur'
        }
      ]
    }
  ])

  const formRef = ref<any>()
  // 临时二维码过期时间校验：不能选过去时间、最长 30 天（与后端 QrcodeController 校验一致）
  const validateExpire = (_rule: any, value: any, callback: (error?: Error) => void) => {
    if (!value) {
      return callback(new Error('请选择过期时间'))
    }
    // valueFormat 为 'YYYY-MM-DD HH:mm:ss'，Safari 下 new Date 直接解析会 NaN，先转斜杠格式
    const ts = new Date(String(value).replace(/-/g, '/')).getTime()
    if (Number.isNaN(ts)) {
      return callback(new Error('时间格式错误'))
    }
    if (ts <= Date.now()) {
      return callback(new Error('过期时间必须晚于当前时间'))
    }
    if (ts - Date.now() > 30 * 86400 * 1000) {
      return callback(new Error('临时二维码有效期最长 30 天'))
    }
    callback()
  }
  // 表单数据
  const formData = ref<any>({
    title: '',
    type: 0,
    subject: '',
    scene_str: '',
    status: 1,
    keyword: ''
  })

  const handleSubmitKey = () => {
    ReplyDialogVisible.value = true
  }

  const replySubmit = (data: any) => {
    formData.value.keyword = data.content
    ReplyDialogVisible.value = false
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    if (formRef.value) {
      formRef.value.reset()
    }
    Object.assign(formData.value, {
      ...row
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
  :global(.emailtemp-dialog .emailtemp-dialog-header) {
    margin-bottom: 20px !important;
  }
  :global(.emailtemp-dialog .emailtemp-dialog-body) {
    padding: 0px !important;
  }
  :global(.emailtemp-dialog .el-dialog__footer) {
    padding-top: 0px !important;
  }
  .emailtemp-dialog .el-drawer__header {
    margin-bottom: 0px;
  }
  .emailtemp-dialog .options-form-item :deep(.el-form-item__content) {
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
