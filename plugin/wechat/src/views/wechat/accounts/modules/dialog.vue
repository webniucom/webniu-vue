<template>
  <ElDrawer v-model="dialogVisible" header-class="wn_wechat_accounts_dialog_header" :title="dialogTitle" :size="560" align-center @closed="handleClosed">
    <ElAlert
      v-if="!isUpdate && isSuper && !roleLoading && roleOptions.length === 0"
      type="warning"
      :closable="false"
      show-icon
      title="暂无可分配的权限分组"
      description="请先到 基座 → 系统管理 → 角色管理 创建权限分组（非超管角色）后再创建账户。"
      class="mb-4"
    />
    <ArtForm
      ref="formRef"
      v-model="formData"
      :items="formItems"
      label-width="90px"
      :show-reset="false"
      :show-submit="false"
    >
    </ArtForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" :disabled="!isUpdate && isSuper && !roleLoading && roleOptions.length === 0" @click="handleSubmit">
        {{ isUpdate ? '保存' : '创建' }}
      </ElButton>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { get, post } from '@admin/core/request'
  import { useUserStore } from '@stores/modules/user'
  import { ElMessage } from 'element-plus'

  interface Props {
    visible: boolean
    type?: 'insert' | 'update'
    editData?: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const route = useRoute()
  const userStore = useUserStore()
  const url = toAdminApiUrl(route.meta.key as string)

  const formRef = ref<any>()
  const formData = ref<any>({})
  const roleOptions = ref<any[]>([])
  const appOptions = ref<any[]>([])
  const roleLoading = ref(false)
  const submitting = ref(false)
  // 当前登录人是否超管：超管必须分配一个非超管角色，非超管沿用自身权限
  const isSuper = ref(false)

  const isUpdate = computed(() => props.type === 'update')
  const dialogTitle = computed(() => (isUpdate.value ? '编辑账户' : '创建账户'))
  const currentAdminId = computed(() => Number(userStore.getUserInfo?.info?.id || 0))
  const isSelf = computed(
    () => isUpdate.value && Number(props.editData?.id || 0) === currentAdminId.value
  )
  const isSuperTarget = computed(() => isUpdate.value && !!props.editData?.is_super)
  // 权限分组：仅超管可改，且不能改自己或超管账户的分组
  const canEditRoles = computed(() => isSuper.value && !isSelf.value && !isSuperTarget.value)
  // 可用应用：仅超管可分配，且不调整自己/超管账户（他们保底拥有全部应用）
  const canEditApps = computed(() => isSuper.value && !isSelf.value && !isSuperTarget.value)

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formItems = computed(() => {
    const items: any[] = [
      {
        label: isUpdate.value ? '账号' : '账号',
        key: 'username',
        type: 'input',
        span: 24,
        props: {
          placeholder: '请输入登录账号',
          clearable: true,
          tooltip: true,
          disabled: isUpdate.value
        },
        rules: [{ required: true, message: '请输入登录账号', trigger: 'blur' }]
      },
      {
        label: '密码',
        key: 'password',
        type: 'input',
        span: 24,
        props: {
          placeholder: isUpdate.value ? '不修改密码请留空' : '请输入登录密码',
          clearable: true,
          tooltip: true,
          type: 'password',
          showPassword: true
        },
        rules: isUpdate.value
          ? []
          : [{ required: true, message: '请输入登录密码', trigger: 'blur' }]
      },
      {
        label: '昵称',
        key: 'nickname',
        type: 'input',
        span: 24,
        props: { placeholder: '请输入昵称', clearable: true, tooltip: true },
        rules: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
      },
      {
        label: '手机',
        key: 'mobile',
        type: 'input',
        span: 24,
        props: { placeholder: '请输入手机号（选填）', clearable: true, tooltip: true }
      },
      {
        label: '邮箱',
        key: 'email',
        type: 'input',
        span: 24,
        props: { placeholder: '请输入邮箱（选填）', clearable: true, tooltip: true }
      }
    ]

    // 超管创建/编辑他人账户时可分配权限分组
    if (canEditRoles.value) {
      items.push({
        label: '权限分组',
        key: 'roles',
        type: 'select',
        span: 24,
        props: {
          placeholder: '请选择权限分组',
          multiple: true,
          filterable: true,
          collapseTags: true,
          collapseTagsTooltip: true,
          options: roleOptions.value.map((item) => ({ label: item.name, value: item.id }))
        },
        rules: [{ required: true, message: '请选择权限分组', trigger: 'change' }]
      })
    }

    // 超管分配可用应用（子账户创建分组/公众号时的应用上限）
    if (canEditApps.value) {
      items.push({
        label: '可用应用',
        key: 'appset',
        type: 'select',
        span: 24,
        props: {
          placeholder: '请选择可用应用（不选=该账户不可使用任何应用）',
          multiple: true,
          filterable: true,
          collapseTags: true,
          collapseTagsTooltip: true,
          options: appOptions.value.map((item) => ({ label: item.name, value: item.identifier }))
        }
      })
    }

    items.push({
      label: '状态',
      key: 'status',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '启用后可正常登录',
        tooltip: true,
        activeValue: 1,
        inactiveValue: 0,
        disabled: isSelf.value
      }
    })

    return items
  })

  /**
   * 加载权限分组信息
   */
  const loadRoleOptions = async () => {
    roleLoading.value = true
    try {
      const res: any = await get(url + '/roleoptions')
      isSuper.value = !!res?.is_super
      roleOptions.value = Array.isArray(res?.roles) ? res.roles : []
      // 只有一个可选项时默认选中（编辑时沿用已有分组，不覆盖）
      if (!isUpdate.value && roleOptions.value.length === 1) {
        formData.value.roles = [roleOptions.value[0].id]
      }
    } catch (error: any) {
      isSuper.value = false
      roleOptions.value = []
      ElMessage.error(error?.message || '加载权限分组失败')
    } finally {
      roleLoading.value = false
    }
  }

  /**
   * 加载已安装的公众号应用
   */
  const loadAppOptions = async () => {
    try {
      const res: any = await get(url + '/appoptions')
      appOptions.value = Array.isArray(res) ? res : []
      // 新建时默认全选，超管可自行取消
      if (!isUpdate.value && canEditApps.value && formData.value.appset?.length === 0) {
        formData.value.appset = appOptions.value.map((item) => item.identifier)
      }
    } catch {
      appOptions.value = []
    }
  }

  const initFormData = () => {
    if (isUpdate.value && props.editData) {
      formData.value = {
        username: props.editData.username || '',
        password: '',
        nickname: props.editData.nickname || '',
        mobile: props.editData.mobile || '',
        email: props.editData.email || '',
        status: props.editData.status ?? 1,
        roles: Array.isArray(props.editData.roles) ? [...props.editData.roles] : [],
        appset: (props.editData.appset || '')
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean)
      }
      return
    }
    formData.value = {
      username: '',
      password: '',
      nickname: '',
      mobile: '',
      email: '',
      status: 1,
      roles: [],
      appset: []
    }
  }

  const handleClosed = () => {
    initFormData()
    formRef.value?.reset?.()
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        initFormData()
        loadRoleOptions()
        loadAppOptions()
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!isUpdate.value && isSuper.value && roleOptions.value.length === 0) {
      ElMessage.warning('请先到基座「角色管理」创建权限分组')
      return
    }
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    if (isUpdate.value && canEditRoles.value && !formData.value.roles?.length) {
      ElMessage.warning('请选择权限分组')
      return
    }
    submitting.value = true
    const payload: any = { ...formData.value }
    if (isUpdate.value) {
      payload.id = props.editData.id
      // 账号不可修改
      delete payload.username
      // 无权限修改分组时不提交 roles
      if (!canEditRoles.value) {
        delete payload.roles
      }
      // 无权限调整可用应用时不提交 appset
      if (!canEditApps.value) {
        delete payload.appset
      }
    } else if (!isSuper.value) {
      // 非超管：后端自动沿用当前账户的权限分组与可用应用
      delete payload.roles
      delete payload.appset
    }
    try {
      await post(url + (isUpdate.value ? '/update' : '/insert'), payload)
      ElMessage.success(isUpdate.value ? '账户更新成功' : '账户创建成功')
      emit('success')
      dialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error?.message || (isUpdate.value ? '更新失败' : '创建失败'))
    } finally {
      submitting.value = false
    }
  }
</script>
<style scoped>
  :global(.wn_wechat_accounts_dialog_header) {
    margin-bottom: 0px !important;
  }
</style>
