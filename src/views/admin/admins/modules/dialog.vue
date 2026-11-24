<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="admin-dialog"
    header-class="admin-dialog-header"
    body-class="admin-dialog-body"
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
      <div class="admin-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
    <WnCustomSelect
      v-model:visible="selectVisible"
      type="select"
      title="选择角色"
      :data="props.roles"
      :selected="formData.roles"
      :multiple="true"
      :props="defaultProps"
      :showCheckbox="true"
      :checkStrictly="true"
      @submit="selectSubmit"
    ></WnCustomSelect>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import WnCustomSelect from '@admin/forms/wn-custom-select/index.vue'

  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
    roles?: any[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }
  const isSuperAdmin = computed(() => (formData.value.id === 1 ? true : false))
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const selectVisible = ref(false)
  const title = computed(() => {
    if (props.type === 'update') return `编辑${props.title}`
    return `新增${props.title}`
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  const defaultProps = computed(() => ({
    children: 'children',
    label: 'name',
    value: 'id'
  }))
  // 表单项配置（使用 computed 确保响应式更新，支持异步加载的数据）
  const formItems = computed(() => [
    {
      label: '角色',
      key: 'roles',
      type: 'treeselect',
      span: 24,
      props: {
        placeholder: '请输入角色',
        clearable: true,
        tooltip: true,
        data: props.roles || [],
        showCheckbox: true,
        multiple: true,
        checkStrictly: true,
        disabled: isSuperAdmin.value,
        collapseTags: true,
        props: {
          label: 'name'
        },
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
          message: '请选择角色',
          trigger: 'change'
        }
      ]
    },
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      search: true,
      span: 24,
      props: {
        placeholder: '请输入用户名',
        disabled: props.type === 'update',
        clearable: true,
        tooltip: true,
        options: [],
        dict: ''
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
      key: 'password',
      type: 'input',
      span: 24,
      props: {
        placeholder: '留空表示不修改密码',
        clearable: true,
        tooltip: true,
        type: 'password'
      },
      rules: [
        {
          required: props.type === 'insert',
          message: '请输入密码',
          trigger: 'blur'
        },
        // 密码长度不能小于6位
        {
          min: 6,
          message: '密码长度不能小于6位',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '昵称',
      key: 'nickname',
      type: 'input',
      search: true,
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
      label: '头像',
      key: 'avatar',
      type: 'upload',
      span: 24,
      props: {
        placeholder: '请上传头像',
        multiple: false,
        uploadlist: true,
        tooltip: true
      }
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      search: true,
      span: 24,
      props: {
        placeholder: '请输入邮箱',
        clearable: true,
        tooltip: true
      }
    },
    {
      label: '手机号',
      key: 'mobile',
      type: 'input',
      search: true,
      span: 24,
      props: {
        placeholder: '请输入手机号',
        clearable: true,
        tooltip: true
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
        disabled: isSuperAdmin.value,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
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
    if (formRef.value) {
      formRef.value.reset()
    }
    Object.assign(formData.value, {
      ...row,
      roles: row.roles?.split(',').filter(Boolean).map(Number) || []
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
   * 权限选择器提交时触发
   * 处理选择的权限
   */
  const selectSubmit = (data: any) => {
    if (data) {
      formData.value.roles = data
      selectVisible.value = false
    }
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
  :global(.hidden-dropdown) {
    display: none;
  }
  :global(.admin-dialog .admin-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.admin-dialog .admin-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }
  .admin-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .admin-dialog .options-form-item :deep(.el-form-item__content) {
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
