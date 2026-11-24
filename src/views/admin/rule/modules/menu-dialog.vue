<template>
  <ElDrawer
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    :size="700"
    align-center
    class="menu-dialog"
    header-class="menu-dialog-header"
    body-class="menu-dialog-body"
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
          <ElRadioButton :value="0" label="目录">目录</ElRadioButton>
          <ElRadioButton :value="1" label="菜单">菜单</ElRadioButton>
          <ElRadioButton :value="2" label="按钮" :disabled="true">按钮</ElRadioButton>
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
  import type { MenuFormData, MenuDialogProps, MenuDialogEmits } from './menu-types'
  import WnIconSelector from '@admin/forms/wn-icon-selector/index.vue'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
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
    editData: null,
    type: 0,
    pid: 0,
    lockType: false,
    data: () => []
  })

  const emit = defineEmits<MenuDialogEmits>()

  const formRef = ref()
  const isEdit = ref(false)
  const iconVisible = ref(false)

  const form = reactive<MenuFormData>({
    id: 0,
    model: 'webniu',
    pid: 0,
    type: 0,
    title: '',
    name: '',
    path: '',
    icon: 'ri:function-ai-line',
    key: '',
    href: '',
    isBlank: false,
    component: '',
    authMark: '',
    isEnable: true,
    keepAlive: true,
    isHide: false,
    isHideTab: false,
    isFullPage: false,
    link: '',
    isIframe: false,
    showBadge: false,
    showTextBadge: '',
    fixedTab: false,
    activePath: '',
    sort: 0,
    createdAt: '',
    updatedAt: ''
  })

  const rules = reactive<FormRules>({
    title: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    key: [{ required: true, message: '请输入控制器路径', trigger: 'blur' }],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
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
        children: menu.children?.map((child: any) => processMenu(child)).filter(Boolean)
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
      children: processedMenus
    }
    return [topLevelMenu]
  })

  // 是否为组件目录
  // 一级菜单: true
  // 具体页面: false
  const isComponentDir = computed(() => {
    if (form.type === 1) {
      return true
    } else {
      return form.pid === 0 ? true : false
    }
  })
  /**
   * 表单项配置
   */
  const formItems = computed<FormItem[]>(() => {
    const switchSpan = width.value < 640 ? 12 : 6
    const baseItems: FormItem[] = [
      { label: '菜单类型', key: 'type', span: 24 },
      {
        label: '上级菜单',
        key: 'pid',
        span: 24,
        type: 'treeselect',
        props: {
          placeholder: '请选择上级菜单',
          data: processedMenuList.value,
          clearable: true,
          checkStrictly: true,
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
      }
    ]
    const bottomItems = [
      {
        label: createLabelTooltip('路由地址', '如:dashboard 或 console'),
        key: 'path',
        type: 'input',
        span: 24,
        props: { placeholder: '如:dashboard' }
      },
      {
        label: createLabelTooltip(
          '组件路径',
          '一级菜单:填写 /index/index\n 具体页面:填写组件路径（如 /system/user)\n' +
            (form.type === 0 ? '目录菜单:留空' : '')
        ),
        key: 'component',
        type: 'input',
        span: 24,
        props: { placeholder: '如:/system/user' + (form.type === 0 ? ' 或留空' : '') },
        rules: [
          { required: isComponentDir.value, message: '请输入组件路径', trigger: 'blur' },
          {
            validator: (rule: any, value: string, callback: any) => {
              if (!value && isComponentDir.value) {
                callback(new Error('请输入组件路径'))
              } else if (value && !value.startsWith('/') && isComponentDir.value) {
                callback(new Error('组件路径必须以/开头'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      },
      {
        label: '菜单图标',
        key: 'icon',
        type: 'input',
        span: 12
      },
      {
        label: '菜单排序',
        key: 'sort',
        type: 'number',
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
      {
        label: '文本徽章',
        key: 'showTextBadge',
        type: 'input',
        span: 24,
        hidden: form.showBadge !== true,
        props: { placeholder: '如:New、Hot' }
      },
      { label: '是否启用', key: 'isEnable', type: 'switch', span: switchSpan },
      { label: '页面缓存', key: 'keepAlive', type: 'switch', span: switchSpan },
      { label: '隐藏菜单', key: 'isHide', type: 'switch', span: switchSpan },
      { label: '是否内嵌', key: 'isIframe', type: 'switch', span: switchSpan },
      { label: '显示徽章', key: 'showBadge', type: 'switch', span: switchSpan },
      { label: '固定标签', key: 'fixedTab', type: 'switch', span: switchSpan },
      { label: '标签隐藏', key: 'isHideTab', type: 'switch', span: switchSpan },
      { label: '全屏页面', key: 'isFullPage', type: 'switch', span: switchSpan },
      {
        label: '激活路径',
        key: 'activePath',
        type: 'input',
        span: 24,
        hidden: form.isHide !== true,
        props: {
          placeholder: '隐藏菜单可以填写激活路径，如:/system/user 高亮显示',
          tooltip: true
        }
      }
    ]

    if (form.type === 3) {
      return [
        ...baseItems,
        {
          label: createLabelTooltip('路由地址', '如:dashboard 或 console'),
          key: 'path',
          type: 'input',
          span: 24,
          props: { placeholder: '如:dashboard' }
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
          span: 24
        },
        { label: '是否启用', key: 'isEnable', type: 'switch', span: switchSpan },
        { label: '是否内嵌', key: 'isIframe', type: 'switch', span: switchSpan },
        { label: '新窗口', key: 'isBlank', type: 'switch', span: switchSpan }
      ]
    } else if (form.type === 2) {
      return [
        ...baseItems,
        {
          label: createLabelTooltip(
            '控制器',
            '菜单需要填写完整控制器路径，如:plugin\\webniu\\app\\admin\\controller\\IndexController'
          ),
          key: 'key',
          type: 'input',
          span: 24,
          props: { placeholder: '请填写控制器路径！', disabled: true }
        },
        {
          label: '权限标识',
          key: 'authMark',
          type: 'input',
          span: 24,
          props: { placeholder: '如:insert', disabled: true }
        },
        {
          label: '提示',
          key: 'customComponent',
          render: () =>
            h(
              'div',
              {
                style: 'color: var(--art-gray-600); padding: 0px 0px 0px 0px; border-radius: 6px'
              },
              '按钮菜单为系统自动生成！'
            )
        }
      ]
    } else if (form.type === 1) {
      return [
        ...baseItems,
        {
          label: createLabelTooltip(
            '控制器',
            '菜单需要填写完整控制器路径，如:plugin\\webniu\\app\\admin\\controller\\IndexController'
          ),
          key: 'key',
          type: 'input',
          span: 24,
          props: { placeholder: '请填写控制器路径！' }
        },
        ...bottomItems
      ]
    } else {
      return [
        ...baseItems,
        {
          label: createLabelTooltip('目录名', '请输入目录名,如:admin'),
          key: 'key',
          type: 'input',
          span: 24,
          props: { placeholder: '如:admin' }
        },
        ...bottomItems
      ]
    }
  })

  const dialogTitle = computed(() => {
    const type =
      form.type === 1 ? '菜单' : form.type === 2 ? '按钮' : form.type === 3 ? '外链' : '目录'
    return isEdit.value ? `编辑${type}` : `新建${type}`
  })

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
    form.type = 0
  }

  /**
   * 加载表单数据（编辑模式）
   */
  const loadFormData = (): void => {
    if (!props.editData) return
    isEdit.value = true
    const row = props.editData
    form.id = row.id || 0
    form.model = row.meta?.model || 'webniu'
    form.pid = row.meta?.pid || 0
    form.title = row.meta?.title || ''
    form.path = row.path || ''
    form.key = row.meta?.key || ''
    form.component = row.meta?.component || ''
    form.icon = row.meta?.icon || ''
    form.sort = row.meta?.sort || 0
    form.keepAlive = row.meta?.keepAlive === 1 ? true : false
    form.isHide = row.meta?.isHide === 1 ? true : false
    form.isHideTab = row.meta?.isHideTab === 1 ? true : false
    form.isEnable = row.meta?.isEnable === 1 ? true : false
    form.link = row.meta?.link || ''
    form.href = row.meta?.href || ''
    form.authMark = row.meta?.authMark || ''
    form.isIframe = row.meta?.isIframe === 1 ? true : false
    form.showBadge = row.meta?.showBadge === 1 ? true : false
    form.showTextBadge = row.meta?.showBadge === 1 ? row.meta?.showTextBadge || '' : ''
    form.fixedTab = row.meta?.fixedTab === 1 ? true : false
    form.isFullPage = row.meta?.isFullPage === 1 ? true : false
    form.activePath = row.meta?.activePath || ''
    form.isBlank = row.meta?.isBlank === 1 ? true : false
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

  /**
   * 监听对话框显示状态
   */
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        form.type = props.type
        form.pid = props.pid
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
  :global(.menu-dialog .menu-dialog-header) {
    margin-bottom: 15px;
  }
  :global(.menu-dialog .menu-dialog-body) {
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
