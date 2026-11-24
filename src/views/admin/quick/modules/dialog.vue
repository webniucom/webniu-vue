<template>
  <ElDrawer
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    :size="700"
    align-center
    class="quick-dialog"
    header-class="quick-dialog-header"
    body-class="quick-dialog-body"
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :rules="rules"
      validate-event="false"
      :span="width > 640 ? 12 : 24"
      :gutter="20"
      label-width="100px"
      :show-reset="false"
      :show-submit="false"
    >
      <template #type>
        <ElRadioGroup v-model="form.type" :disabled="disableType">
          <ElRadioButton :value="1" label="菜单">菜单</ElRadioButton>
          <ElRadioButton :value="3" label="外链">外链</ElRadioButton>
        </ElRadioGroup>
      </template>
      <template #icon>
        <div class="icon-selector-wrapper">
          <div class="icon-selector-icon">
            <ArtSvgIcon :icon="form.icon || 'ri:user-line'" class="icon-selector-svg" />
          </div>
          <div class="icon-selector-input">
            <input
              type="text"
              :value="form.icon"
              @input="(e) => (form.icon = (e.target as HTMLInputElement).value)"
              placeholder="如:ri:user-line"
            />
          </div>
          <ElButton type="primary" class="mr-1" size="small" @click="handleIconSelect">
            选择图标
          </ElButton>
        </div>
      </template>
      <template #icon_color>
        <ElColorPicker v-model="form.icon_color" />
      </template>
    </ArtForm>

    <template #footer>
      <span class="menu-dialog-footer">
        <ElButton @click="handleCancel">取 消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确 定</ElButton>
      </span>
    </template>
  </ElDrawer>
  <WnIconSelector v-model:visible="iconVisible" @select-icon="handleSelectIcon" />
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  import type { FormRules } from 'element-plus'
  import { ElIcon, ElTooltip } from 'element-plus'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import type { FormItem } from '@admin/forms/art-form/index.vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import { useWindowSize } from '@vueuse/core'
  import type { MenuDialogProps, MenuDialogEmits } from './types'
  import WnIconSelector from '@admin/forms/wn-icon-selector/index.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { get } from '@/api/common-request'
  import { useUserStore } from '@/store/modules/user'

  const { width } = useWindowSize()

  /**
   * 创建带 tooltip 的表单标签
   * @param label 标签文本
   * @param tooltip 提示文本
   * @returns 渲染函数
   */
  const createLabelTooltip = (label: string, tooltip: string) => {
    return () =>
      h('span', { class: 'flex items-center' }, [
        h('span', label),
        h(
          ElTooltip,
          {
            content: tooltip,
            placement: 'top'
          },
          () => h(ElIcon, { class: 'ml-0.5 cursor-help' }, () => h(QuestionFilled))
        )
      ])
  }

  const props = withDefaults(defineProps<MenuDialogProps>(), {
    visible: false,
    type: 1,
    pid: 0,
    lockType: false,
    data: () => []
  })

  const emit = defineEmits<MenuDialogEmits>()

  //管理信息
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  //表单引用
  const formRef = ref()
  const isEdit = ref(false)
  const iconVisible = ref(false)
  const RULES_URL = '/webniu/admin/quick/rules'
  const ruleList = ref([])
  const rulesLoaded = ref(false)

  const form = reactive<any>({
    id: 0,
    pid: 0,
    type: 1,
    title: '',
    description: '',
    path: '',
    icon: 'ri:function-ai-line',
    icon_color: '',
    is_blank: false,
    is_enable: true,
    link: '',
    is_login_jump: false,
    sort: 0,
    created_at: '',
    updated_at: ''
  })

  const rules = reactive<FormRules>({
    title: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    description: [{ required: true, message: '请输入菜单描述', trigger: 'blur' }],
    path: [
      { required: true, message: '请输入路由地址', trigger: 'blur' },
      {
        validator: (rule: any, value: string, callback: any) => {
          // 如果为空则通过（有 required 规则处理空值）
          if (!value) {
            callback()
            return
          }
          // 检查路径是否以 / 开头
          if (!value.startsWith('/')) {
            callback(new Error('路由地址必须以 / 开头'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    pid: [{ required: true, message: '请选择上级菜单', trigger: 'change' }],
    type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
    authMark: [{ required: true, message: '请输入权限标识', trigger: 'blur' }],
    link: [
      {
        required: true,
        message: '请输入外部链接',
        trigger: 'blur'
      },
      {
        validator: (rule: any, value: string, callback: any) => {
          // 如果为空则通过（有 required 规则处理空值）
          if (!value) {
            callback()
            return
          }
          //这个链接要支持端口，例如：http://localhost:8080
          const urlPattern =
            /^((https?:\/\/)[a-zA-Z0-9-]+(:\d+)?(\.[a-zA-Z0-9-]+)*|\/)[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*\/?$/
          // 检查链接是否符合模式
          if (!urlPattern.test(value)) {
            callback(new Error('请输入正确的网址格式'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  })

  /**
   * 处理菜单数据，提取 meta.title 为 label，并筛选掉按钮类型
   * @param data 原始菜单数据
   * @returns 处理后的菜单数据（包含一级菜单选项）
   */
  const processedMenuList = computed(() => {
    const processMenu = (menu: any) => {
      // 过滤掉 type === 2 的权限数据
      if (menu.meta?.type === 2) {
        return null
      }
      const processedMenu = {
        id: menu.id,
        label: menu.meta?.title || menu.name,
        value: menu.id,
        path: menu.path || '',
        meta: menu.meta,
        children: menu.children?.map((child: any) => processMenu(child)).filter(Boolean)
      }
      return processedMenu
    }

    // 处理菜单数据
    const processedMenus =
      ruleList.value?.map((menu: any) => processMenu(menu)).filter(Boolean) || []
    // 添加顶级菜单选项
    const topLevelMenu = {
      id: 0,
      label: '一级菜单',
      value: 0,
      children: processedMenus
    }
    return [topLevelMenu]
  })

  /**
   * 表单项配置
   */
  const formItems = computed<FormItem[]>(() => {
    const switchSpan = width.value < 640 ? 12 : 6
    if (form.type === 3) {
      return [
        { label: '菜单类型', key: 'type', span: 24 },
        {
          label: '菜单名称',
          key: 'title',
          type: 'input',
          span: 24,
          props: { placeholder: '菜单名称' }
        },
        {
          label: '菜单描述',
          key: 'description',
          type: 'input',
          span: 24,
          props: {
            placeholder: '菜单描述',
            type: 'textarea',
            rows: 2
          }
        },
        {
          label: '外部链接',
          key: 'link',
          type: 'input',
          span: 24,
          props: { placeholder: '如:https://www.webniu.com' }
        },
        {
          label: '菜单图标',
          key: 'icon',
          type: 'input',
          span: 12
        },
        {
          label: '图标颜色',
          labelWidth: 70,
          key: 'icon_color',
          type: 'input',
          span: 5,
          props: {
            placeholder: '图标颜色'
          }
        },
        {
          label: '菜单排序',
          labelWidth: 70,
          key: 'sort',
          type: 'number',
          span: 7,
          props: {
            min: 0,
            controlsPosition: 'right',
            style: { width: '100%' }
          }
        },
        { label: '是否启用', key: 'is_enable', type: 'switch', span: switchSpan },
        { label: '新窗口', key: 'is_blank', type: 'switch', span: switchSpan },
        { label: '登录跳转', key: 'is_login_jump', type: 'switch', span: switchSpan }
      ]
    } else {
      return [
        { label: '菜单类型', key: 'type', span: 24 },
        {
          label: '选择菜单',
          key: 'pid',
          span: 24,
          type: 'treeselect',
          props: {
            placeholder: '请选择选择菜单',
            data: processedMenuList.value,
            clearable: false,
            checkStrictly: false,
            showCheckbox: false,
            props: {
              label: 'label', // 使用处理后的数据中的 label 字段
              value: 'value', // 使用处理后的数据中的 value 字段
              children: 'children'
            },
            disabled: form.type === 2 ? true : false,
            default: form.pid || 0
          }
        },
        {
          label: '菜单名称',
          key: 'title',
          type: 'input',
          span: 24,
          props: { placeholder: '菜单名称' }
        },
        {
          label: '菜单描述',
          key: 'description',
          type: 'input',
          span: 24,
          props: {
            placeholder: '菜单描述',
            type: 'textarea',
            rows: 2
          }
        },
        {
          label: createLabelTooltip('路由地址', '如:dashboard 或 console'),
          key: 'path',
          type: 'input',
          span: 24,
          props: { placeholder: '如:dashboard' }
        },
        {
          label: '菜单图标',
          key: 'icon',
          type: 'input',
          span: 12
        },
        {
          label: '图标颜色',
          labelWidth: 70,
          key: 'icon_color',
          type: 'input',
          span: 5,
          props: {
            placeholder: '图标颜色'
          }
        },
        {
          label: '菜单排序',
          labelWidth: 70,
          key: 'sort',
          type: 'number',
          span: 7,
          props: {
            min: 0,
            controlsPosition: 'right',
            style: { width: '100%' }
          }
        },
        {
          label: '外部链接',
          key: 'link',
          type: 'input',
          span: 24,
          hidden: form.isIframe !== true,
          props: { placeholder: '如:https://www.webniu.com' }
        },
        { label: '是否启用', key: 'is_enable', type: 'switch', span: switchSpan },
        { label: '登录跳转', key: 'is_login_jump', type: 'switch', span: switchSpan }
      ]
    }
  })

  const dialogTitle = computed(() => {
    const type =
      form.type === 1 ? '菜单' : form.type === 2 ? '按钮' : form.type === 3 ? '外链' : '目录'
    return isEdit.value ? `编辑${type}` : `新建${type}`
  })

  /**
   * 根据 ID 查找菜单节点完整数据
   * @param id 菜单 ID
   * @param menuList 菜单列表
   * @returns 菜单节点完整数据
   */
  const findMenuNode = (id: number, menuList: any[] = processedMenuList.value): any => {
    for (const menu of menuList) {
      if (menu.id === id) {
        return menu
      }
      if (menu.children?.length) {
        const found = findMenuNode(id, menu.children)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 获取选中菜单的完整路径（从根到当前节点，使用 path 字段拼接）
   * @param id 菜单 ID
   * @returns 完整路径字符串
   */
  const getMenuFullPath = (id: number): string => {
    const pathList: string[] = []
    const findPath = (targetId: number, menuList: any[], currentPath: string[]): boolean => {
      for (const menu of menuList) {
        const newPath = menu.path ? [...currentPath, menu.path] : currentPath
        if (menu.id === targetId) {
          pathList.push(...newPath)
          return true
        }
        if (menu.children?.length) {
          if (findPath(targetId, menu.children, newPath)) {
            return true
          }
        }
      }
      return false
    }
    findPath(id, processedMenuList.value, [])
    return '/' + pathList.join('/')
  }

  // 监听选择菜单的变化
  watch(
    () => form.pid,
    (newVal, oldVal) => {
      console.log(newVal, oldVal, isEdit.value)
      if (newVal !== oldVal && !isEdit.value) {
        const selectedNode = findMenuNode(newVal)
        form.title = selectedNode?.meta?.title || ''
        form.description = selectedNode?.meta?.title || ''
        form.path = getMenuFullPath(newVal) || ''
        form.icon = selectedNode?.meta?.icon || ''
        form.link = selectedNode?.meta?.link || ''
        form.is_enable = selectedNode?.meta?.isEnable === 1 ? true : false
        form.is_blank = selectedNode?.meta?.isBlank === 1 ? true : false
        form.is_login_jump = false
      }
    }
  )

  /**
   * 是否禁用菜单类型切换
   */
  const disableType = computed(() => {
    if (form.id) return true
    return false
  })

  /**
   * 图标选择器
   */
  const handleIconSelect = () => {
    iconVisible.value = true
  }

  /**
   * 重置表单数据
   */
  const resetForm = (): void => {
    formRef.value?.reset()
    form.type = 1
  }

  /**
   * 加载表单数据（编辑模式）
   */
  const loadFormData = (): void => {
    if (!props.editData) return
    isEdit.value = true
    const row = props.editData
    form.id = row.id || 0
    form.type = row.type || 1
    form.pid = row.pid || 0
    form.title = row.title || ''
    form.description = row.description || ''
    form.path = row.path || ''
    form.icon = row.icon || ''
    form.icon_color = row.icon_color || ''
    form.sort = row.sort || 0
    form.is_enable = row.is_enable === 1 ? true : false
    form.is_login_jump = row.is_login_jump === 1 ? true : false
    form.link = row.link || ''
    form.is_blank = row.is_blank === 1 ? true : false
  }

  /**
   * 提交表单
   */
  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      if (!form.showBadge) {
        form.showTextBadge = ''
      }
      if (!form.component) {
        form.component = ''
      }
      emit('submit', { ...form })
    } catch {
      ElMessage.error('表单校验失败，请检查输入')
    }
  }

  /**
   * 取消操作
   */
  const handleCancel = (): void => {
    emit('update:visible', false)
  }

  /**
   * 对话框关闭后的回调
   */
  const handleClosed = (): void => {
    resetForm()
    isEdit.value = false
  }

  const handleSelectIcon = (data: string | undefined) => {
    if (!data) return
    form.icon = data
  }

  //加载数据列表
  const loadRules = async (params: any) => {
    const res = await get(RULES_URL, params)
    ruleList.value = res || []
    return res
  }

  /**
   * 监听对话框显示状态
   */
  watch(
    () => props.visible,
    async (newVal) => {
      if (newVal) {
        // 只在首次打开时加载规则数据
        if (!rulesLoaded.value) {
          let roles = userInfo.value?.roles?.join(',')
          await loadRules({ id: roles })
          rulesLoaded.value = true
        }
        form.type = props.type
        nextTick(() => {
          if (props.editData) {
            loadFormData()
          }
        })
      }
    }
  )
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
  :global(.quick-dialog .quick-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.quick-dialog .quick-dialog-body) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  .icon-selector-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid var(--default-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .icon-selector-icon {
    padding: 0px 12px 2px 12px;
    border-right: 1px solid var(--default-border);
    background-color: #f9f9f9;
  }

  .icon-selector-svg {
    font-size: 18px;
    color: #909399;
  }

  .icon-selector-input {
    flex: 1;
    padding: 0 12px;
  }

  .icon-selector-input input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 14px;
    color: #606266;
  }
</style>
