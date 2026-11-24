<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="role-dialog"
    header-class="role-dialog-header"
    body-class="role-dialog-body"
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
      <div class="role-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
    <WnCustomSelect
      v-model:visible="selectVisible"
      type="select"
      title="选择权限"
      :data="ruleList"
      :screen="true"
      :selected="formData.rules"
      :multiple="true"
      :showCheckbox="true"
      :checkStrictly="false"
      @submit="selectSubmit"
    ></WnCustomSelect>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import WnCustomSelect from '@admin/forms/wn-custom-select/index.vue'
  import { get } from '@/api/common-request'
  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
    items?: any[]
    data?: any[]
    userInfo?: any
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
  // 自定义选择框显示控制
  const selectVisible = ref(false)
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
        label: menu.name,
        value: menu.id,
        children: menu.children?.map((child: any) => processMenu(child)).filter(Boolean) || []
      }
      return processedMenu
    }
    // 处理菜单数据
    const processedMenus = props.data?.map((menu: any) => processMenu(menu)).filter(Boolean) || []
    return processedMenus
  })
  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
    {
      label: '父级',
      key: 'pid',
      span: 24,
      type: 'treeselect',
      hidden: props.editData?.id === 1,
      props: {
        placeholder: '请选择父级',
        data: processedMenuList.value,
        clearable: false,
        checkStrictly: true,
        tooltip: true
      }
    },
    {
      label: '组名称',
      key: 'name',
      type: 'input',
      span: 24,
      search: true,
      props: {
        placeholder: '请输入组名称',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入组名称',
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
        tooltip: true
      }
    },
    {
      label: '权限',
      key: 'rules',
      type: 'treeselect',
      span: 24,
      hidden: props.editData?.id === 1,
      props: {
        placeholder: '请选择权限',
        data: ruleList.value,
        clearable: true,
        tooltip: true,
        showCheckbox: true,
        multiple: true,
        checkStrictly: true,
        collapseTags: true,
        nodeKey: 'id',
        popperClass: 'hidden-dropdown',
        onVisibleChange: (visible: boolean) => {
          if (visible) {
            selectVisible.value = visible
          }
        }
      },
      rules: [
        {
          required: true,
          message: '请选择权限',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '限制',
      key: 'nums',
      type: 'number',
      span: 24,
      props: {
        placeholder: '可根据应用需求设置数量限制',
        clearable: true,
        tooltip: true,
        min: 0,
        step: 1
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '请选择状态',
        clearable: true,
        tooltip: true,
        disabled: props.editData?.id === 1,
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
  const rules = {
    pid: [{ required: true, message: '请选择父级', trigger: ['blur'] }],
    description: [{ required: true, message: '请输入描述', trigger: ['blur'] }],
    status: [{ required: true, message: '请选择状态', trigger: ['blur'] }],
    nums: [{ required: true, message: '请输入数量限制', trigger: ['blur'] }]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formData.value = {}
    formRef.value?.reset()
    Object.assign(formData.value, {
      ...row,
      pid: props.userInfo.roles[0] || 1,
      //字符串转换为数组并且过滤掉空值和字符串转数字
      rules: row.rules !== '*' ? row.rules?.split(',').filter(Boolean).map(Number) || [] : []
    })
  }
  const ruleList = ref<any>([])
  // 缓存标志：标记权限列表是否已加载

  /**
   * 从后端获取权限列表并填充到选择选择器
   * 使用缓存机制，只在第一次打开对话框时加载
   */
  const initRules = async () => {
    // 如果已经加载过，直接返回
    try {
      const res = await get('/webniu/admin/role/rules', {
        id: props.type === 'insert' ? props.userInfo.roles.join(',') : props.editData?.pid || 1
      })
      if (res.length) {
        ruleList.value = res || []
      }
    } catch (error) {
      return error
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
        initRules()
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

  /**
   * 权限选择器提交时触发
   * 处理选择的权限
   */
  const selectSubmit = (data: any) => {
    if (data) {
      formData.value.rules = data
      selectVisible.value = false
    }
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
  :global(.hidden-dropdown) {
    display: none;
  }
  :global(.role-dialog .role-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.role-dialog .role-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .role-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .role-dialog .options-form-item :deep(.el-form-item__content) {
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
