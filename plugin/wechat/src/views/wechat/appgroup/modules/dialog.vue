<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="500"
    align-center
    class="general-dialog"
    header-class="general-dialog-header"
    body-class="general-dialog-body"
    @closed="handleClosed"
  >
    <ElScrollbar class="!h-[calc(100vh-130px)]" max-height="calc(100vh-130px)">
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
    </ElScrollbar>
    <template #footer>
      <div class="general-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import { useRoute } from 'vue-router'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { get } from '@admin/core/request'
  import { useUserStore } from '@stores/modules/user'
  import { ElMessage } from 'element-plus'

  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)
  const userStore = useUserStore()
  // 公共分组仅超管可设置
  const isSuper = computed(() => !!userStore?.getUserInfo?.isSuperAdmin)

  // 可用应用（type=wechat 的已安装应用）
  const appOptions = ref<any[]>([])
  const loadAppOptions = async () => {
    try {
      const params: Record<string, any> = {}
      // 编辑已有分组时，传入分组归属人与是否公共分组，
      // 应用列表按与后端保存一致的规则过滤，避免选出保存不住的应用
      if (props.type === 'update') {
        if (props.editData?.admin_id) params.admin_id = props.editData.admin_id
        if (props.editData?.is_public != null) params.is_public = props.editData.is_public
      }
      const res: any = await get(url + '/appoptions', params)
      appOptions.value = (Array.isArray(res) ? res : []).map((item: any) => ({
        label: item.name,
        value: item.identifier
      }))
      // 过滤掉分组中已不在可选范围内的应用（脏数据），避免提交后被后端静默丢弃
      if (Array.isArray(formData.value.apps)) {
        const validValues = new Set(appOptions.value.map((o: any) => o.value))
        formData.value.apps = formData.value.apps.filter((v: any) => validValues.has(v))
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '加载应用列表失败')
    }
  }

  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
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

  // 表单项配置
  const formItems = computed(() => {
    const items: any[] = [
    {
      label: '分组名称',
      labelWidth: '90px',
      key: 'name',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入分组名称',
        clearable: true,
        tooltip: true,
        maxlength: 50,
        showWordLimit: true
      },
      rules: [
        {
          required: true,
          message: '请输入分组名称',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '可用应用',
      labelWidth: '90px',
      key: 'apps',
      type: 'select',
      span: 24,
      props: {
        placeholder: '请选择可用应用（微信公众号类型的应用）',
        tooltip: true,
        multiple: true,
        collapseTags: true,
        collapseTagsTooltip: true,
        clearable: true,
        options: appOptions.value
      },
      rules: [
        {
          required: false,
          type: 'array',
          message: '请选择可用应用',
          trigger: 'change'
        }
      ]
    },
    {
      label: '排序',
      labelWidth: '90px',
      key: 'sort',
      type: 'number',
      span: 24,
      props: {
        placeholder: '请输入排序',
        tooltip: true,
        min: 0,
        max: 9999,
        step: 1,
        controlsPosition: 'right',
        style: { width: '100%' }
      },
      rules: [
        {
          required: false,
          message: '请输入排序',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '状态',
      labelWidth: '90px',
      key: 'status',
      type: 'switch',
      span: 12,
      props: {
        placeholder: '状态',
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
  ]

    // 公共分组：所有账户可见并绑定，仅超管可设置
    if (isSuper.value) {
      items.push({
        label: '公共分组',
        labelWidth: '90px',
        key: 'is_public',
        type: 'switch',
        span: 24,
        props: {
          placeholder: '开启后所有账户都可绑定该分组',
          tooltip: true,
          activeValue: 1,
          inactiveValue: 0
        }
      })
    }

    return items
  })

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})
  // 表单验证规则
  const rules = {}

  /**
   * 拆分 apps 字段（后端存储为逗号分隔字符串）
   */
  const splitApps = (apps: any): string[] => {
    if (Array.isArray(apps)) return apps
    if (!apps) return []
    return String(apps)
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formData.value = {}
    Object.assign(formData.value, {
      ...row,
      apps: splitApps(row.apps),
      sort: Number(row.sort) || 0,
      status: row.status === 0 ? 0 : 1,
      is_public: row.is_public === 1 ? 1 : 0
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
        loadAppOptions()
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
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    const payload: any = { ...formData.value }
    // 非超管不允许设置公共分组
    if (!isSuper.value) delete payload.is_public
    emit('submit', payload)
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
</style>
