<template>
  <ElDialog
    :title="title"
    v-model="dialogVisible"
    :size="700"
    class="smstemp-dialog"
    header-class="smstemp-dialog-header"
    body-class="smstemp-dialog-body"
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
    </ArtForm>
    <template #footer>
      <div class="smstemp-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
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

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '名称',
      key: 'name',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入名称',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入名称',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '模板ID',
      key: 'template_id',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入模板ID',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入模板ID',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '签名',
      key: 'sign',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入签名',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入签名',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '状态',
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
  :global(.smstemp-dialog .smstemp-dialog-header) {
    margin-bottom: 0px;
  }
  :global(.smstemp-dialog .smstemp-dialog-body) {
    padding: 0px !important;
  }
  :global(.smstemp-dialog .el-dialog__footer) {
    padding-top: 0px !important;
  }
  .smstemp-dialog .el-drawer__header {
    margin-bottom: 0px;
  }
  .smstemp-dialog .options-form-item :deep(.el-form-item__content) {
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
