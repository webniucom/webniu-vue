<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    class="plugin-dialog"
    header-class="plugin-dialog-header"
    body-class="plugin-dialog-body"
    align-center
    @closed="handleClosed"
  >
    <template #header>
      <div class="my-header">
        <el-radio-group v-model="activeName" @change="handleClick">
          <el-radio-button value="config">应用配置</el-radio-button>
          <el-radio-button value="route">路由配置</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <div v-if="activeName === 'route'" class="route-config">
      <el-alert
        title="需严格遵守路由规则，否则会导致路由冲突，系统可能会崩溃。"
        type="primary"
        description="请查看路由规则说明"
        show-icon
      />
      <!-- 标题行 -->
      <div class="route-header-row mb-2 flex items-center mt-2">
        <div class="w-[220px] font-medium text-gray-700">路径规则</div>
        <div class="w-[220px] font-medium text-gray-700">控制器</div>
        <div class="w-[150px] font-medium text-gray-700">方法名</div>
        <div class="w-[32px]"></div>
        <div class="w-[60px]"></div>
      </div>
      <VueDraggable
        v-model="formData.rewrite"
        class="route-list"
        handle=".drag-handle"
        :animation="200"
      >
        <div
          v-for="(item, index) in formData.rewrite || []"
          :key="index"
          class="route-item mb-2 flex items-center"
        >
          <ElInput v-model="item.value" placeholder="路径规则" class="mr-2" style="width: 200px" />
          <ElInput v-model="item.name" placeholder="控制器" class="mr-2" style="width: 200px" />
          <ElInput v-model="item.action" placeholder="方法名" class="mr-2" style="width: 150px" />
          <div class="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600">
            <ArtSvgIcon icon="ri:draggable" />
          </div>
          <ElButton type="danger" size="small" @click="removeRoute(index as number)" plain>
            <ArtSvgIcon icon="ri:delete-bin-5-line" />
          </ElButton>
        </div>
      </VueDraggable>
      <div class="mt-1 mb-2">
        <ElButton type="primary" size="small" @click="addRoute" plain>
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          添加路由
        </ElButton>
      </div>
    </div>
    <ArtForm
      v-else
      ref="formRef"
      v-model="formData"
      :items="formItems"
      label-width="80px"
      :show-reset="false"
      :show-submit="false"
    >
    </ArtForm>

    <template #footer>
      <div class="plugin-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import { VueDraggable } from 'vue-draggable-plus'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { ElButton, ElInput } from 'element-plus'

  interface Props {
    visible: boolean
    title: string
    editData?: Partial<any>
    data?: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = ref(props.title)
  const activeName = ref('config')

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '类型',
      key: 'type',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择类型',
        tooltip: true,
        options: props.data?.type || []
      },
      rules: [
        {
          required: true,
          message: '请选择类型',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '分类',
      key: 'class',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择分类',
        tooltip: true,
        options: props.data?.class || []
      },
      rules: [
        {
          required: true,
          message: '请选择分类',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '标识',
      key: 'identifier',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入标识',
        clearable: true,
        tooltip: true,
        disabled: true
      },
      rules: [
        {
          required: true,
          message: '请输入标识',
          trigger: 'blur'
        }
      ]
    },
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
      label: '描述',
      key: 'desc',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入描述',
        clearable: true,
        tooltip: true,
        type: 'textarea',
        rows: 3
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
      label: '图标',
      key: 'logo',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请选择图标',
        tooltip: true,
        multiple: false,
        uploadlist: true
      },
      rules: [
        {
          required: true,
          message: '请选择图标',
          trigger: 'change'
        }
      ]
    },
    {
      label: '作者',
      key: 'author',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请选择作者',
        tooltip: true,
        disabled: true
      },
      rules: [
        {
          required: true,
          message: '请选择作者',
          trigger: 'change'
        }
      ]
    },
    {
      label: '版本',
      key: 'version',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请选择版本',
        tooltip: true,
        disabled: true
      },
      rules: [
        {
          required: true,
          message: '请选择版本',
          trigger: 'change'
        }
      ]
    },
    {
      label: '网牛版本',
      key: 'webniu_version',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请选择网牛版本',
        clearable: true,
        tooltip: true,
        disabled: true
      },
      rules: [
        {
          required: true,
          message: '请输入网牛版本',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '默认入口',
      key: 'href',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请选择默认入口',
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请选择默认入口',
          trigger: 'change'
        }
      ]
    },
    {
      label: '打开方式',
      key: 'open',
      type: 'radiogroup',
      span: 24,
      props: {
        placeholder: '请选择打开方式',
        tooltip: true,
        disabled: formData.value.identifier === 'webniu',
        options: [
          {
            label: '主入口',
            value: '0'
          },
          {
            label: '独立入口',
            value: '1'
          }
        ]
      },
      rules: [
        {
          required: true,
          message: '请选择打开方式',
          trigger: 'change'
        }
      ]
    }
  ])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})
  // 点击tab切换
  const handleClick = () => {}
  // 添加路由
  const addRoute = () => {
    if (!formData.value.rewrite) {
      formData.value.rewrite = []
    }
    formData.value.rewrite.push({
      value: '',
      name: '',
      action: ''
    })
  }
  // 删除路由
  const removeRoute = (index: number) => {
    if (formData.value.rewrite && formData.value.rewrite.length > 0) {
      formData.value.rewrite.splice(index, 1)
    }
  }
  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formData.value = {}
    activeName.value = 'config'
    if (formRef.value) {
      formRef.value.reset()
    }
    Object.assign(formData.value, {
      ...row,
      class: String(row.class) || '0',
      rewrite: row.rewrite || [],
      laytab: activeName.value
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
    // 如果是路由配置tab，直接提交
    if (activeName.value === 'route') {
      formData.value.laytab = activeName.value
      emit('submit', formData.value)
      return
    }
    // 如果是应用配置tab，需要表单验证
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
  :global(.plugin-dialog .plugin-dialog-header) {
    margin-bottom: 20px !important;
  }
  :global(.plugin-dialog .plugin-dialog-body) {
    padding: 0px !important;
  }
  :global(.plugin-dialog .el-dialog__footer) {
    padding-top: 0px !important;
  }
  .plugin-dialog .el-drawer__header {
    margin-bottom: 0px;
  }
  .plugin-dialog .options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.w-e-text-placeholder) {
    top: 0px !important;
  }
  :global(.w-e-text-container p) {
    margin: 5px 0px !important;
  }
  .my-header {
    height: 33px;
  }
  /* 自定义 radio-group 尺寸 */
  .my-header :deep(.el-radio-button) {
    height: 32px;
    font-size: 12px;
    border-radius: 8px;
  }
  .my-header :deep(.el-radio-button__inner) {
    height: 32px;
    line-height: 13px;
    font-size: 12px;
  }
  /* 路由配置区域样式 */
  .route-config {
    padding: 0px 20px 20px 20px;
    border-radius: 8px;
  }
  .route-list {
    min-height: 40px;
  }
  .route-item {
    padding: 8px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .route-item:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary), 0.1);
  }
  .drag-handle {
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .drag-handle:hover {
    background: #f0f0f0;
  }
</style>
