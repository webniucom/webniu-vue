<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    class="material-dialog"
    header-class="material-dialog-header"
    body-class="material-dialog-body"
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
      <div class="material-dialog-footer">
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

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '标题',
      key: 'name',
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
      label: '描述',
      key: 'description',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入描述',
        clearable: true,
        tooltip: true,
        type: 'textarea',
        rows: 4
      },
      rules: [
        {
          required: true,
          message: '请输入描述',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '题图',
      key: 'cover_url',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请上传题图URL',
        clearable: true,
        tooltip: true,
        multiple: false,
        uploadlist: true
      },
      rules: [
        {
          required: true,
          message: '请上传题图URL',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '链接',
      key: 'diy_url',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入链接',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: false,
          trigger: 'blur',
          validator: (rule: any, value: string, callback: any) => {
            if (!value || value.trim() === '') {
              callback()
            } else if (!/^https?:\/\//.test(value)) {
              callback(new Error('链接必须以 http:// 或 https:// 开头'))
            } else {
              callback()
            }
          }
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
    },
    {
      label: '内容',
      key: 'content',
      type: 'wangeditor',
      span: 24,
      props: {
        placeholder: '请输入内容',
        clearable: true,
        tooltip: false,
        height: '310px',
        toolbarKeys: [
          'code',
          'headerSelect',
          'bold',
          'italic',
          'underline',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'insertLink',
          'insertImage',
          '|',
          'undo',
          'redo'
        ]
      },
      rules: [
        {
          required: true,
          message: '请输入内容',
          trigger: 'blur'
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
  :global(.material-dialog .material-dialog-header) {
    margin-bottom: 20px !important;
  }
  :global(.material-dialog .material-dialog-body) {
    padding: 0px !important;
  }
  :global(.material-dialog .el-dialog__footer) {
    padding-top: 0px !important;
  }
  .material-dialog .el-drawer__header {
    margin-bottom: 0px;
  }
  .material-dialog .options-form-item :deep(.el-form-item__content) {
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
