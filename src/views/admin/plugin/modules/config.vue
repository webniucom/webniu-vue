<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="wechat-dialog"
    header-class="wechat-dialog-header"
    body-class="wechat-dialog-body"
    @closed="handleClosed"
  >
    <el-alert
      title="配置说明"
      type="primary"
      description="请将应用安装配置信息填写到应用安装配置中，确保与系统配置一致。"
      show-icon
    />
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

    <template #footer>
      <div class="wechat-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'

  interface Props {
    visible: boolean
    formdata: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }
  // 标签位置
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = '全局配置'

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '限制配置',
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
      label: '删除安装文件',
      labelWidth: '120px',
      key: 'delinstall',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '安装后会删除安装SQL等文件',
        tooltip: true,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
      }
    },
    {
      label: '删除更新文件',
      labelWidth: '120px',
      key: 'delupdate',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '更新后会删除更新SQL等文件',
        tooltip: true,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
      }
    },
    {
      label: '卸载删除安装包',
      labelWidth: '120px',
      key: 'delplugin',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '卸载后会删除整个插件安装包',
        tooltip: true,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
      }
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
    formData.value = props.formdata || {}
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
      // 如果焦点在 textarea 中，不阻止默认行为，允许换行
      const activeElement = document.activeElement
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        return
      }
      // 阻止默认行为
      event.preventDefault()
      // 触发表单提交
      handleSubmit()
    }
  }
</script>
<style scoped>
  :global(.wechat-dialog .wechat-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.wechat-dialog .wechat-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .wechat-dialog .el-drawer__header {
    margin: 0px;
  }
  .wechat-dialog .options-form-item :deep(.el-form-item__content) {
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
