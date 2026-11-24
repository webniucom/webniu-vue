<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="dict-dialog"
    header-class="dict-dialog-header"
    body-class="dict-dialog-body"
    @closed="handleClosed"
  >
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
      <div class="dict-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import { type FormInstance, type FormRules } from 'element-plus'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import type { FormData } from './dict-types'

  interface Props {
    visible: boolean
    type: string
    editData?: Partial<FormData>
    data?: any[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = computed(() => {
    if (props.type === 'update') return '编辑数据'
    if (props.editData?.pid && props.editData?.pid > 0) return '新增子数据'
    return '新增数据'
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  /**
   * 处理菜单数据，提取 meta.title 为 label，并筛选掉按钮类型
   * @param data 原始菜单数据
   * @returns 处理后的菜单数据（包含一级菜单选项）
   */
  const processedMenuList = computed(() => {
    const processMenu = (menu: any) => {
      const processedMenu = {
        id: menu.id,
        label: menu.label,
        value: menu.id,
        children: menu.children?.map((child: any) => processMenu(child)).filter(Boolean) || []
      }
      return processedMenu
    }
    // 处理菜单数据
    const processedMenus = props.data?.map((menu: any) => processMenu(menu)).filter(Boolean) || []
    // 添加顶级菜单选项
    const topLevelMenu = {
      id: 0,
      label: '一级菜单',
      value: 0,
      children: processedMenus || []
    }
    return [topLevelMenu]
  })

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '上级菜单',
      key: 'pid',
      span: 24,
      type: 'treeselect',
      props: {
        placeholder: '请选择上级菜单',
        data: processedMenuList.value,
        clearable: false,
        checkStrictly: true
      }
    },
    {
      label: '数据名',
      key: 'label',
      span: 24,
      type: 'input',
      props: {
        placeholder: '请输入数据名称'
      }
    },
    {
      label: '数据值',
      key: 'value',
      span: 24,
      type: 'input',
      props: {
        placeholder: '请输入数据值'
      }
    },
    {
      label: '排序',
      key: 'sort',
      span: 24,
      type: 'inputnumber',
      props: {
        placeholder: '请输入排序'
      }
    },
    {
      label: '状态',
      key: 'status',
      span: 24,
      type: 'switch',
      props: {
        activeValue: 1,
        inactiveValue: 0
      }
    }
  ])

  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<FormData>({
    id: '',
    pid: 0,
    group: '',
    label: '',
    value: '',
    sort: 0,
    disabled: 0,
    status: 1
  })

  // 表单验证规则
  const rules: FormRules = {
    label: [
      { required: true, message: '请输入数据名', trigger: 'blur' },
      { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
    ],
    value: [
      { required: true, message: '请输入数据值', trigger: 'blur' },
      { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_]+$/,
        message: '数据值只能包含字母和下划线',
        trigger: 'blur'
      }
    ],
    sort: [
      { required: true, message: '请输入排序', trigger: 'blur' },
      { type: 'number', message: '排序必须是数字', trigger: 'blur' }
    ]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'update' && props.editData
    const row = props.editData
    Object.assign(formData, {
      id: isEdit && row ? row.id || '' : '',
      pid: isEdit && row ? Number(row.pid || 0) : row?.pid || 0,
      group: isEdit && row ? row.group || '' : row?.group || '',
      label: isEdit && row ? row.label || '' : '',
      value: isEdit && row ? row.value || '' : '',
      sort: isEdit && row ? Number(row.sort || 0) : 0,
      disabled: isEdit && row ? Number(row.disabled || 0) : 0,
      status: isEdit && row ? Number(row.status === 0 ? 0 : 1) : 1
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
    await formRef.value.validate((valid) => {
      if (valid) {
        const postData = {
          ...formData
        }
        emit('submit', postData)
      }
    })
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
  :global(.dict-dialog .dict-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.dict-dialog .dict-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .dict-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .dict-options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
</style>
