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
    <ArtForm
      ref="formRef"
      v-model="formData"
      :items="formItems"
      label-width="80px"
      :show-reset="false"
      :show-submit="false"
    >
    </ArtForm>
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

  // 表单项配置（自包含，参考 reply/dialog.vue 的分组结构）
  // 验证规则用字段级 item.rules，无需表单级 rules
  const formItems = computed(() => [
    // 基础信息分组
    {
      label: '基础信息',
      key: 'divider',
      type: 'divider',
      span: 24,
      props: { labelPosition: 'top' }
    },
    {
      label: '粉丝昵称',
      key: 'nickname',
      type: 'input',
      span: 12,
      props: { placeholder: '请输入粉丝昵称', clearable: true },
      rules: [{ required: true, message: '请输入粉丝昵称', trigger: 'blur' }]
    },
    {
      label: 'OPENID',
      key: 'openid',
      type: 'input',
      span: 12,
      props: { placeholder: '粉丝openid', clearable: true },
      rules: [{ required: true, message: '请输入粉丝openid', trigger: 'blur' }]
    },
    {
      label: '性别',
      key: 'sex',
      type: 'select',
      span: 12,
      props: {
        placeholder: '请选择性别',
        clearable: true,
        options: [
          { label: '未知', value: 0 },
          { label: '男', value: 1 },
          { label: '女', value: 2 }
        ]
      }
    },
    {
      label: '城市',
      key: 'city',
      type: 'input',
      span: 12,
      props: { placeholder: '城市', clearable: true }
    },
    {
      label: '省份',
      key: 'province',
      type: 'input',
      span: 12,
      props: { placeholder: '省份', clearable: true }
    },
    {
      label: '国家',
      key: 'country',
      type: 'input',
      span: 12,
      props: { placeholder: '国家', clearable: true }
    },
    // 备注信息分组
    {
      label: '备注信息',
      key: 'divider',
      type: 'divider',
      span: 24,
      props: { labelPosition: 'top' }
    },
    {
      label: '备注',
      key: 'remark',
      type: 'input',
      span: 24,
      props: {
        type: 'textarea',
        placeholder: '请输入粉丝备注',
        rows: 3,
        maxlength: 30,
        showWordLimit: true
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'switch',
      span: 12,
      props: {
        activeValue: 1,
        inactiveValue: 0,
        placeholder: '启用/禁用'
      }
    }
  ])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formData.value = {}

    Object.assign(formData.value, {
      ...row
    })

    // 新增模式下，应用默认值
    if (props.type !== 'update' && formItems.value.length > 0) {
      formItems.value.forEach((item: any) => {
        const key = item.key
        const defaultValue = item.props?.defaultValue
        // 如果表单数据中该字段为空且配置了默认值，则应用默认值
        if (key && defaultValue !== undefined && formData.value[key] === undefined) {
          formData.value[key] = defaultValue
        }
      })
    }
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
