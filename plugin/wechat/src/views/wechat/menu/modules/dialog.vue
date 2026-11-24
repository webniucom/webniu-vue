<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="980"
    class="menu-dialog"
    header-class="menu-dialog-header"
    body-class="menu-dialog-body"
    align-center
    @closed="handleClosed"
  >
    <div class="menu-editor-container">
      <div class="menu-preview">
        <div class="preview-header">预览区</div>
        <div class="phone-simulator">
          <div class="phone-status-bar">
            <div class="phone-time">1:21 AM</div>
            <div class="phone-icons">
              <span>
                <ArtSvgIcon icon="ri:signal-cellular-3-line" class="text-active-color"></ArtSvgIcon>
              </span>
              <span>
                <ArtSvgIcon icon="ri:battery-low-line" class="text-active-color"></ArtSvgIcon>
              </span>
            </div>
          </div>
          <div class="phone-content">
            <div class="phone-nav">
              <span class="nav-back text-sm"></span>
              <span class="nav-title text-sm">计彩</span>
              <span class="nav-avatar text-sm"></span>
            </div>
            <div class="menu-preview-area">
              <div
                v-for="(menu, mIndex) in buttonData.button"
                :key="mIndex"
                class="menu-group"
                :class="{ expanded: expandedMenuIndex === mIndex }"
              >
                <div v-if="expandedMenuIndex === mIndex" class="submenu-popup">
                  <div
                    v-for="(sub, sIndex) in menu.sub_button || []"
                    :key="sIndex"
                    class="submenu-item"
                    :class="{ active: selectedMenuIndex === mIndex && selectedSubIndex === sIndex }"
                    @click="handleSubmenuClick(mIndex, sIndex)"
                  >
                    {{ sub.name }}
                  </div>
                  <div
                    v-if="!menu.sub_button || menu.sub_button.length < 5"
                    class="submenu-item add-submenu"
                    @click.stop="addSubMenu(mIndex)"
                  >
                    <ArtSvgIcon icon="ri:add-line"></ArtSvgIcon>
                    添加菜单
                  </div>
                </div>
                <div
                  class="menu-item-btn"
                  :class="{ active: selectedMenuIndex === mIndex && selectedSubIndex === -1 }"
                  @click="toggleMenu(mIndex)"
                >
                  {{ menu.name }}
                  <span v-if="menu.sub_button && menu.sub_button.length" class="menu-arrow">▼</span>
                </div>
              </div>
              <div v-if="buttonData.button.length < 3" class="menu-group">
                <div class="menu-item-btn add-menu-btn" @click="addMenu">
                  <ArtSvgIcon icon="ri:add-line"></ArtSvgIcon>
                  添加菜单
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="menu-form">
        <div class="form-header">基础信息</div>
        <ElScrollbar class="!h-[calc(100vh-200px)]" max-height="calc(100vh-200px)">
          <ArtForm
            ref="formRef"
            v-model="formData"
            :items="formItems"
            label-width="80px"
            :show-reset="false"
            :show-submit="false"
            class="reply-dialog-form"
          >
            <template #key>
              <div class="flex items-center w-full">
                <ElInput v-model="formData.key" readonly placeholder="请输入关键字">
                  <template #append>
                    <ElButton type="primary" @click="handleSubmitKey">选择关键字</ElButton>
                  </template>
                </ElInput>
                <FieldTooltip content="请选择关键字" />
              </div>
              <Reply v-model:visible="ReplyDialogVisible" @submit="replySubmit"> </Reply>
            </template>
          </ArtForm>
        </ElScrollbar>
      </div>
    </div>
    <template #footer>
      <div class="menu-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import Reply from './reply.vue'

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
  const ReplyDialogVisible = ref(false)

  const title = computed(() => {
    if (props.type === 'update') return `编辑${props.title}`
    return `新增${props.title}`
  })

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  interface MenuItem {
    name: string
    type: string
    key: string
    url?: string
    sub_button?: MenuItem[]
  }

  const menus = ref<MenuItem[]>([])
  const selectedMenuIndex = ref(-1)
  const selectedSubIndex = ref(-1)
  const expandedMenuIndex = ref(-1)

  const toggleMenu = async (index: string | number) => {
    try {
      await formRef.value.validate()
    } catch {
      ElMessage.error('请填写完整表单信息')
      return
    }
    const idx = Number(index)
    if (expandedMenuIndex.value === idx) {
      expandedMenuIndex.value = -1
    } else {
      expandedMenuIndex.value = idx
    }
    selectedMenuIndex.value = idx
    selectedSubIndex.value = -1
    const menu = buttonData.value.button[idx]
    if (menu) {
      addMenuField(menu)
    }
  }

  const addMenuField = (menu: any) => {
    formData.value = {
      ...formData.value,
      name: menu.name,
      type: menu.type,
      key: menu.key,
      url: menu.url || '',
      appid: menu.appid || '',
      pagepath: menu.pagepath || ''
    }
    formData.value.edit = false
  }

  const handleSubmenuClick = async (menuIndex: number, subIndex: string | number) => {
    try {
      await formRef.value.validate()
    } catch {
      ElMessage.error('请填写完整表单信息')
      return
    }
    selectedMenuIndex.value = menuIndex
    selectedSubIndex.value = Number(subIndex)
    const menu = buttonData.value.button[menuIndex].sub_button[Number(subIndex)]
    if (menu) {
      addMenuField(menu)
    }
  }

  const addMenu = async () => {
    try {
      await formRef.value.validate()
    } catch {
      ElMessage.error('请填写完整表单信息')
      return
    }
    const count = buttonData.value.button.length
    if (count >= 3) return
    const newMenu = {
      name: `一级菜单${count + 1}`,
      type: 'click',
      key: ``
    }
    buttonData.value.button.push(newMenu)
    selectedMenuIndex.value = count
    selectedSubIndex.value = -1
    addMenuField(newMenu)
  }

  const addSubMenu = async (menuIndex: number) => {
    try {
      await formRef.value.validate()
    } catch {
      ElMessage.error('请填写完整表单信息')
      return
    }
    const menu = buttonData.value.button[menuIndex]
    if (!menu) return
    if (!menu.sub_button) {
      menu.sub_button = []
    }
    const count = menu.sub_button.length
    if (count >= 5) return
    const newSubMenu = {
      name: `二级菜单${count + 1}`,
      type: 'click',
      key: ``
    }
    menu.sub_button.push(newSubMenu)
    expandedMenuIndex.value = menuIndex
    selectedMenuIndex.value = menuIndex
    selectedSubIndex.value = count
    addMenuField(newSubMenu)
  }

  const buttonData = ref<any>({})

  const formData = ref({
    edit: false,
    id: 0,
    title: '',
    name: '',
    type: 'click',
    key: '',
    appid: '',
    pagepath: '',
    url: '',
    menutype: 0,
    menuid: 0,
    client_platform_type: 0,
    tag_id: 0,
    enable: 0,
    data: '',
    status: 1
  })

  const formItems = computed(() => {
    return [
      {
        label: '基础设置',
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
        label: '菜单标题',
        labelWidth: '120px',
        key: 'title',
        type: 'input',
        span: 24,
        props: {
          placeholder: '请输入菜单标题',
          clearable: true,
          tooltip: true
        },
        rules: [
          {
            required: true,
            message: '请输入菜单标题',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '菜单类型',
        labelWidth: '120px',
        key: 'menutype',
        type: 'radiogroup',
        span: 24,
        props: {
          placeholder: '请选择菜单类型',
          tooltip: true,
          options: [
            {
              label: '普通菜单',
              value: 0
            },
            {
              label: '个性菜单',
              value: 1
            }
          ]
        },
        rules: [
          {
            required: true,
            message: '请输入菜单类型',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '客户端版本',
        labelWidth: '120px',
        key: 'client_platform_type',
        type: 'select',
        hidden: formData.value.menutype === 0,
        span: 24,
        props: {
          placeholder: '请选择客户端版本',
          tooltip: true,
          options: [
            {
              label: '不限制',
              value: 0
            },
            {
              label: 'IOS',
              value: 1
            },
            {
              label: 'Android',
              value: 2
            },
            {
              label: 'Others',
              value: 3
            }
          ]
        },
        rules: [
          {
            required: formData.value.menutype === 1,
            message: '请选择客户端版本',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '用户标签',
        labelWidth: '120px',
        key: 'tag_id',
        type: 'select',
        hidden: formData.value.menutype === 0,
        span: 24,
        props: {
          placeholder: '请选择用户标签',
          tooltip: true,
          options: [
            {
              label: '不限制',
              value: 0
            }
          ]
        },
        rules: [
          {
            required: formData.value.menutype === 1,
            message: '请选择用户标签',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '菜单状态',
        key: 'status',
        type: 'switch',
        labelWidth: '120px',
        span: 24,
        props: {
          placeholder: '禁用后无法正常启动上架',
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
        label: '属性信息',
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
        label: '按钮名称',
        labelWidth: '120px',
        key: 'name',
        type: 'input',
        hidden: formData.value.edit,
        span: 24,
        props: {
          placeholder: '请输入按钮名称',
          clearable: true,
          tooltip: true
        },
        rules: [
          {
            required: true,
            message: '请输入按钮名称',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '按钮类型',
        labelWidth: '120px',
        key: 'type',
        type: 'radiogroup',
        hidden: formData.value.edit,
        span: 24,
        props: {
          placeholder: '请选择按钮类型',
          tooltip: true,
          options: [
            {
              label: '发送消息',
              value: 'click'
            },
            {
              label: '跳转网址',
              value: 'view'
            },
            {
              label: '扫码场景',
              value: 'scancode_push'
            },
            {
              label: '扫码事件',
              value: 'scancode_waitmsg'
            },
            {
              label: '地理位置',
              value: 'location_select'
            },
            {
              label: '拍照发图',
              value: 'pic_sysphoto'
            },
            {
              label: '相册发图',
              value: 'pic_photo_or_album'
            },
            {
              label: '微信相册',
              value: 'pic_weixin'
            },
            {
              label: '小程序',
              value: 'miniprogram'
            }
          ]
        },
        rules: [
          {
            required: true,
            message: '请选择按钮类型',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '触发关键字',
        labelWidth: '120px',
        key: 'key',
        type: 'input',
        span: 24,
        hidden:
          formData.value.type === 'view' ||
          formData.value.type === 'miniprogram' ||
          formData.value.edit,
        props: {
          placeholder: '请输入触发关键字',
          tooltip: true
        },
        rules: [
          {
            required: true,
            message: '请输入触发关键字',
            trigger: 'blur'
          }
        ]
      },
      {
        label: 'APPID',
        labelWidth: '120px',
        key: 'appid',
        type: 'input',
        hidden: formData.value.type !== 'miniprogram',
        span: 24,
        props: {
          placeholder: '请输入APPID',
          tooltip: true
        },
        rules: [
          {
            required: true,
            message: '请输入APPID',
            trigger: 'blur'
          }
        ]
      },
      {
        label: '页面路径',
        labelWidth: '120px',
        key: 'pagepath',
        type: 'input',
        hidden: formData.value.type !== 'miniprogram',
        span: 24,
        props: {
          placeholder: '请输入页面路径',
          tooltip: true
        },
        rules: [
          {
            required: true,
            message: '请输入页面路径',
            trigger: 'blur'
          }
        ]
      },
      {
        label: formData.value.type === 'miniprogram' ? '备用地址' : '跳转地址',
        labelWidth: '120px',
        key: 'url',
        type: 'input',
        hidden: formData.value.type !== 'view' && formData.value.type !== 'miniprogram',
        span: 24,
        props: {
          placeholder: formData.value.type === 'miniprogram' ? '请输入备用地址' : '请输入跳转地址',
          tooltip: true
        },
        rules: [
          {
            required: formData.value.type === 'view' ? true : false,
            message: formData.value.type === 'miniprogram' ? '请输入备用地址' : '请输入跳转地址',
            trigger: 'blur'
          },
          //验证网址格式是否正确
          {
            validator: (rule: any, value: string, callback: any) => {
              //如果是 formData.value.type === 'view'判断内容是否是https 或者 http 开头的
              if (formData.value.type === 'view' && !/^https?:\/\//.test(value)) {
                callback(new Error('请输入正确的网址格式'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    ]
  })

  const formRef = ref<any>()

  const initFormData = () => {
    const row = props.editData || {}
    Object.assign(formData.value, {
      ...row,
      edit: true,
      id: row.id || 0,
      title: row.title || '',
      menutype: row.menutype || 0,
      menuid: row.menuid || 0,
      client_platform_type: row.client_platform_type || 0,
      tag_id: row.tag_id || 0,
      status: row.status === 0 ? 0 : 1
    })
    buttonData.value.button = row.data?.button || []
    menus.value = []
    selectedMenuIndex.value = -1
    selectedSubIndex.value = -1
  }

  const handleClosed = () => {
    initFormData()
    nextTick(() => {})
  }

  const handleSubmitKey = () => {
    ReplyDialogVisible.value = true
  }

  const replySubmit = (data: any) => {
    formData.value.key = data.content
    ReplyDialogVisible.value = false
  }

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

  watch(
    formData,
    (newVal) => {
      if (selectedMenuIndex.value >= 0) {
        const menu = buttonData.value.button[selectedMenuIndex.value]

        if (selectedSubIndex.value >= 0 && menu.sub_button) {
          const subMenu = menu.sub_button[selectedSubIndex.value]
          subMenu.name = newVal.name
          subMenu.type = newVal.type
          subMenu.key = newVal.key
          subMenu.url = newVal.url
          subMenu.appid = newVal.appid
          subMenu.pagepath = newVal.pagepath
        } else {
          menu.name = newVal.name
          menu.type = newVal.type
          menu.key = newVal.key
          menu.url = newVal.url
          menu.appid = newVal.appid
          menu.pagepath = newVal.pagepath
        }
      }
    },
    { deep: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    if (buttonData.value.button.length === 0) {
      ElMessage.error('请添加菜单')
      return
    }
    emit('submit', {
      ...formData.value,
      data: buttonData.value.button
    })
  }
</script>

<style scoped>
  :global(.menu-dialog-header) {
    margin-bottom: 5px;
  }

  .menu-editor-container {
    display: flex;
    gap: 24px;
    height: calc(100vh - 160px);
  }
  .menu-preview {
    width: 320px;
    flex-shrink: 0;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
  }
  .preview-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #e4e7ed;
    background: #f5f7fa;
    border-radius: 8px 8px 0 0;
  }
  .phone-simulator {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  .phone-status-bar {
    width: 280px;
    height: 32px;
    background: #1a1a1a;
    border-radius: 20px 20px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    color: #fff;
    font-size: 12px;
  }
  .phone-icons {
    display: flex;
    gap: 6px;
  }
  .phone-content {
    width: 280px;
    flex: 1;
    background: #f2f2f2;
    border: 2px solid #1a1a1a;
    border-top: none;
    border-radius: 0 0 8px 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .phone-nav {
    background: #fff;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 16px;
    border-bottom: 1px solid #e4e7ed;
  }
  .nav-back {
    color: #333;
  }
  .nav-title {
    font-weight: 500;
  }
  .nav-avatar {
    font-size: 14px;
  }
  .menu-preview-area {
    flex: 1;
    padding: 7px;
    overflow-y: auto;
    position: relative;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    padding-bottom: 10px;
  }
  .menu-form {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    overflow: hidden;
  }
  .form-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #e4e7ed;
    background: #f5f7fa;
    border-radius: 8px 8px 0 0;
  }
  .menu-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .menu-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 86px;
    position: relative;
  }
  .submenu-popup {
    position: absolute;
    bottom: 46px;
    left: 0;
    right: 0;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .submenu-item {
    padding: 10px 12px;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    white-space: nowrap;
    text-align: center;
    transition: background 0.2s;
  }

  .submenu-item.active {
    background: var(--el-color-primary);
    color: #fff;
  }

  .menu-item-btn {
    height: 44px;
    width: 86px;
    line-height: 16px;
    text-align: center;
    font-size: 14px;
    color: #333;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: background 0.2s;
  }
  .menu-item-btn:hover {
    background: #f5f7fa;
  }
  .menu-item-btn.active {
    background: var(--el-color-primary);
    color: #fff;
  }
  .menu-item-btn.active span {
    color: #fff;
  }
  .menu-arrow {
    font-size: 10px;
    color: #909399;
    transition: transform 0.2s;
  }
  .menu-group.expanded .menu-arrow {
    transform: rotate(180deg);
  }
  .add-menu-btn {
    background: #f5f7fa;
    color: #909399;
    border: 1px dashed #d9d9d9;
  }
  .add-menu-btn:hover {
    background: #e8ecf0;
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
  .add-submenu {
    background: #f5f7fa;
    color: #909399;
    border-top: 1px dashed #d9d9d9;
    font-size: 12px;
  }
  .add-submenu:hover {
    background: #e8ecf0;
    color: var(--el-color-primary);
  }
</style>
