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
      description="请将以下配置信息填写到微信开发者平台的基本配置中，确保与系统配置一致。"
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
      <!-- 授权事件URL - 添加复制按钮 -->
      <template #ticketurl>
        <div class="w-full flex items-center gap-2">
          <ElInput
            v-model="formData.ticketurl"
            placeholder="请输入授权事件URL"
            class="flex-1 min-w-0"
            readonly
          />
          <ElButton class="h-8!" @click="copyToClipboard(formData.ticketurl)">复制</ElButton>
        </div>
      </template>

      <!-- 消息事件URL - 添加复制按钮 -->
      <template #apiurl>
        <div class="w-full flex items-center gap-2">
          <ElInput
            v-model="formData.apiurl"
            placeholder="请输入消息事件URL"
            class="flex-1 min-w-0"
            readonly
          />
          <ElButton class="h-8!" @click="copyToClipboard(formData.apiurl)">复制</ElButton>
        </div>
      </template>

      <!-- 校验Token - 添加生成和复制按钮 -->
      <template #apptoken>
        <div class="w-full flex items-center gap-2">
          <ElInput
            v-model="formData.apptoken"
            placeholder="请输入校验Token"
            class="flex-1 min-w-0"
          />
          <ElSpace wrap>
            <ElButton type="primary" class="h-8!" @click="generateAppToken">生成</ElButton>
            <ElButton class="h-8!" @click="copyToClipboard(formData.apptoken)">复制</ElButton>
          </ElSpace>
        </div>
      </template>

      <!-- 加解密Key - 添加生成和复制按钮 -->
      <template #encodingkey>
        <div class="w-full flex items-center gap-2">
          <ElInput
            v-model="formData.encodingkey"
            placeholder="请输入加解密Key"
            class="flex-1 min-w-0"
          />
          <ElSpace wrap>
            <ElButton type="primary" class="h-8!" @click="generateEncodingKey">生成</ElButton>
            <ElButton class="h-8!" @click="copyToClipboard(formData.encodingkey)">复制</ElButton>
          </ElSpace>
        </div>
      </template>
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
  import { ElMessage } from 'element-plus'

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
      label: '基础限制',
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
      label: '创建赠送天数',
      labelWidth: '120px',
      key: 'expire_days',
      type: 'number',
      span: 24,
      props: {
        placeholder: '请输入创建赠送天数（0=不限制）',
        clearable: true,
        tooltip: true,
        min: 0,
        step: 1
      },
      rules: [
        {
          required: true,
          message: '请输入赠送天数',
          trigger: 'change'
        }
      ]
    },
    {
      label: '到期提醒内容',
      labelWidth: '120px',
      key: 'expire_msg',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入到期提醒内容',
        tooltip: true
      }
    },
    {
      label: '微信开放平台配置',
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
      label: '开放平台状态',
      labelWidth: '120px',
      key: 'wechatopentype',
      type: 'switch',
      span: 24,
      props: {
        placeholder: '请选择开放平台状态',
        tooltip: true,
        defaultValue: 1,
        activeValue: 1,
        inactiveValue: 0
      }
    },
    {
      label: 'APPID',
      labelWidth: '120px',
      key: 'app_id',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入APPID',
        tooltip: true
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入APPID',
          trigger: 'change'
        }
      ]
    },
    {
      label: 'AppSecret',
      labelWidth: '120px',
      key: 'secret',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入AppSecret',
        tooltip: true,
        type: 'password'
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入AppSecret',
          trigger: 'change'
        }
      ]
    },
    {
      label: '接入配置项',
      labelWidth: '70px',
      key: 'divider',
      type: 'divider',
      span: 12,
      hidden: false,
      props: {
        placeholder: false,
        clearable: true
      }
    },
    {
      label: '授权事件URL',
      labelWidth: '120px',
      key: 'ticketurl',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入授权事件URL',
        tooltip: true
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入授权事件URL',
          trigger: 'change'
        }
      ]
    },
    {
      label: '消息事件URL',
      labelWidth: '120px',
      key: 'apiurl',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入消息事件URL',
        tooltip: true
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入消息事件URL',
          trigger: 'change'
        }
      ]
    },
    {
      label: '校验Token',
      labelWidth: '120px',
      key: 'apptoken',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入校验Token',
        tooltip: true
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入校验Token',
          trigger: 'change'
        }
      ]
    },
    {
      label: '加解密Key',
      labelWidth: '120px',
      key: 'encodingkey',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入加解密Key',
        tooltip: true
      },
      rules: [
        {
          required: formData.value.wechatopentype === 1,
          message: '请输入加解密Key',
          trigger: 'change'
        }
      ]
    }
  ])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({
    expire_days: 7,
    expire_msg: '您的公众号已过期，请及时联系管理员'
  })
  // 表单验证规则
  const rules = {
    title: [{ required: true, message: '请输入全局配置', trigger: ['blur'] }]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    Object.assign(formData.value, props.formdata || {})
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

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('复制成功')
    } catch (error) {
      ElMessage.error('复制失败')
      return error
    }
  }

  /**
   * 生成校验Token（32位）
   */
  const generateAppToken = () => {
    const token =
      Math.random().toString(36).substring(2, 18) +
      Math.random().toString(36).substring(2, 18) +
      Math.random().toString(36).substring(2, 18)
    formData.value.apptoken = token
    ElMessage.success('校验Token生成成功')
  }

  /**
   * 生成加解密Key（43位）
   */
  const generateEncodingKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 43; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    formData.value.encodingkey = key
    ElMessage.success('加解密Key生成成功')
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
