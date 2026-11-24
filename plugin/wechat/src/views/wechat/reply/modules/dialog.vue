<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    class="reply-dialog"
    header-class="reply-dialog-header"
    body-class="reply-dialog-body"
    align-center
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="formData"
      :items="formItems"
      label-width="80px"
      :show-reset="false"
      :show-submit="false"
      class="reply-dialog-form"
    >
      <template #type>
        <div class="reply-type-buttons">
          <div
            v-for="item in props.replyTypes"
            :key="item.value"
            class="reply-type-btn"
            :class="{ active: formData.type === item.id }"
            @click="selectReplyType(item)"
          >
            <ArtSvgIcon :icon="item.icon" class="reply-type-icon" />
            <span>{{ item.label }}</span>
          </div>
        </div>
      </template>
      <template #module>
        <div class="reply-module">
          <!-- 未选择类型 -->
          <div v-if="!formData.module" class="reply-module-empty">
            <el-empty class="reply-empty-div" description="请选择回复类型" />
          </div>

          <!-- 文本消息 -->
          <div v-else-if="formData.module === 'text'" class="reply-module-text">
            <div class="text-content-box">
              {{ formData.reply?.text_content || '暂无文本内容' }}
            </div>
          </div>

          <!-- 图文消息 -->
          <div v-else-if="formData.module === 'news'" class="reply-module-news">
            <div class="news-card">
              <div class="news-info">
                <template v-if="formData.reply?.url">
                  <a
                    :href="formData.reply.url"
                    target="_blank"
                    class="news-link !no-underline flex flex-col gap-2"
                  >
                    <div class="news-title">{{ formData.reply?.title || '图文标题' }}</div>
                    <div class="news-desc">{{ formData.reply?.description || '图文描述' }}</div>
                  </a>
                </template>
                <template v-else>
                  <div class="news-title">{{ formData.reply?.title || '图文标题' }}</div>
                  <div class="news-desc">{{ formData.reply?.description || '图文描述' }}</div>
                </template>
              </div>
              <el-image
                v-if="formData.reply?.picurl"
                :src="wxImgUrl(formData.reply.picurl)"
                fit="cover"
                class="news-cover"
              />
            </div>
          </div>

          <!-- 图片 -->
          <div v-else-if="formData.module === 'image'" class="reply-module-media">
            <div class="media-preview image-preview">
              <el-image
                :src="wxImgUrl(formData.reply?.picurl || formData.reply?.url)"
                fit="scale-down"
                class="media-image"
                :preview-src-list="[wxImgUrl(formData.reply?.picurl || formData.reply?.url)]"
                show-progress
              />
            </div>
          </div>

          <!-- 语音 -->
          <div v-else-if="formData.module === 'voice'" class="reply-module-media">
            <div class="media-preview audio-preview"> 音频文件，微信中预览！ </div>
          </div>

          <!-- 视频 -->
          <div v-else-if="formData.module === 'video'" class="reply-module-media">
            <div class="media-preview video-preview"> 视频文件，微信中预览！ </div>
          </div>

          <!-- 其他 -->
          <div v-else class="reply-module-empty">
            <el-empty :description="`暂未支持的类型：${formData.module}`" />
          </div>
        </div>
      </template>
    </ArtForm>
    <template #footer>
      <div class="reply-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
    <Message v-model:visible="TextDialogVisible" :editData="formData.reply" @submit="messageSubmit">
    </Message>
    <Material
      v-model:visible="MaterialDialogVisible"
      :editData="formData.reply"
      @submit="materialSubmit"
    >
    </Material>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref, onMounted, onUnmounted } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import Message from './message.vue'
  import Material from './material.vue'
  import { wxImgUrl } from '@/utils/wximg'

  interface Props {
    visible: boolean
    type: string
    title: string
    editData?: Partial<any>
    replyTypes?: { id: number; label: string; value: string; icon: string }[]
    data?: any[]
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

  const TextDialogVisible = ref(false)
  const AppsDialogVisible = ref(false)

  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = computed(() => [
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
      label: '回复名称',
      labelWidth: '120px',
      key: 'name',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入回复名称',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入回复名称',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '关键词',
      labelWidth: '120px',
      key: 'content',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入关键词',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入关键词',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '高级设置',
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
      label: '默认回复',
      labelWidth: '120px',
      key: 'default',
      type: 'switch',
      span: 12,
      props: {
        placeholder: '是否默认回复',
        tooltip: true,
        activeValue: 1,
        inactiveValue: 0
      },
      rules: [
        {
          required: true,
          message: '请选择是否默认回复',
          trigger: 'change'
        }
      ]
    },
    {
      label: '回复优先级',
      labelWidth: '120px',
      key: 'displayorder',
      type: 'number',
      span: 12,
      props: {
        placeholder: '请输入回复优先级',
        clearable: true,
        tooltip: true,
        min: 0,
        step: 1
      },
      rules: [
        {
          required: true,
          message: '请输入回复优先级',
          trigger: 'change'
        }
      ]
    },
    {
      label: '关注回复',
      labelWidth: '120px',
      key: 'subscribe',
      type: 'switch',
      span: 12,
      props: {
        placeholder: '是否关注回复',
        tooltip: true,
        activeValue: 1,
        inactiveValue: 0
      },
      rules: [
        {
          required: true,
          message: '请选择是否关注回复',
          trigger: 'change'
        }
      ]
    },
    {
      label: '回复状态',
      labelWidth: '120px',
      key: 'status',
      type: 'switch',
      span: 12,
      props: {
        placeholder: '回复状态',
        tooltip: true,
        activeValue: 1,
        inactiveValue: 0
      },
      rules: [
        {
          required: true,
          message: '请选择回复状态',
          trigger: 'change'
        }
      ]
    },
    {
      label: '回复内容',
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
      label: h('div', { class: 'custom-label-type' }, '回复类型'),
      labelWidth: '120px',
      key: 'type',
      type: 'input',
      span: 24,
      props: {
        placeholder: '回复类型',
        tooltip: true
      },
      rules: [
        {
          required: false,
          message: '请选择回复类型',
          trigger: 'change'
        },
        {
          validator: (rule: any, value: any, callback: any) => {
            if (value === undefined || value === '') {
              callback(new Error('请选择回复类型'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    },
    {
      label: '回复模型',
      labelWidth: '120px',
      key: 'module',
      type: 'input',
      span: 24,
      props: {
        placeholder: '回复模型',
        tooltip: true
      }
    }
  ])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})
  // 材料弹窗
  const MaterialDialogVisible = ref<boolean>(false)
  // 材料提交
  const materialSubmit = (data: any) => {
    formData.value.reply = {
      media_id: data.media_id,
      title: data.name,
      description: data.description,
      picurl: data.cover_url,
      url: data.url,
      text_content: ''
    }
    formData.value.module = data.type
    formData.value.type = props?.replyTypes?.find((item: any) => item.value === data.type)?.id
    MaterialDialogVisible.value = false
    if (formRef.value) {
      formRef.value.validate()
    }
  }
  // 选择回复类型
  const selectReplyType = (item: any) => {
    formData.value.reply.module = item.value
    if (item.value === 'text') {
      TextDialogVisible.value = true
    } else if (item.value === 'apps') {
      AppsDialogVisible.value = true
      //提示应用入口需要配置应用ID
      ElMessage({
        message: '应用入口需要配置应用ID',
        type: 'warning'
      })
    } else {
      MaterialDialogVisible.value = true
    }
  }
  // 文本消息提交
  const messageSubmit = (data: any) => {
    formData.value.reply = data
    TextDialogVisible.value = false
    formData.value.module = data.module
    formData.value.type = props?.replyTypes?.find((item: any) => item.value === data.module)?.id
    if (formRef.value) {
      formRef.value.validate()
    }
  }
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
      ...row
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
    // 只在弹窗可见且按下 Enter 时处理
    if (!props.visible || event.key !== 'Enter' || event.shiftKey) return

    // 如果焦点在 textarea 或多行文本输入框中，执行默认换行行为，不提交
    const target = event.target as HTMLElement
    if (
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'textbox'
    ) {
      return
    }

    // 阻止默认行为并触发表单提交
    event.preventDefault()
    handleSubmit()
  }
</script>
<style scoped>
  :global(.reply-dialog .reply-dialog-header) {
    margin-bottom: 20px !important;
  }
  :global(.reply-dialog .reply-dialog-body) {
    padding: 0px !important;
  }
  .reply-dialog-body .reply-dialog-form {
    padding-top: 0px;
  }
  :global(.reply-dialog .el-dialog__footer) {
    padding-top: 0px !important;
  }
  .reply-dialog .el-drawer__header {
    margin-bottom: 0px;
  }
  .reply-dialog .options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.w-e-text-placeholder) {
    top: 0px !important;
  }
  :global(.w-e-text-container p) {
    margin: 5px 0px !important;
  }
  .reply-type-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 0px;
  }
  .reply-type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 75px;
    height: 75px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    span {
      margin-top: 6px;
      font-size: 11px;
      color: #606266;
      height: 20px;
      line-height: initial;
    }
    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      span {
        color: var(--el-color-primary);
      }
      .reply-type-icon {
        color: var(--el-color-primary);
      }
    }
    &.active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary);
      span {
        color: #fff;
      }
      .reply-type-icon {
        color: #fff;
      }
    }
  }
  .reply-type-icon {
    margin-top: 2px;
    font-size: 20px;
    color: #909399;
    transition: color 0.2s ease;
  }
  .custom-label-type {
    height: 75px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .reply-module {
    padding: 10px;
    background: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
  }
  .module-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 10px;
  }
  .reply-module-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
  }
  .text-content-box {
    padding: 10px;
    background: #fff;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    min-width: 300px;
    min-height: 120px;
    line-height: 1.6;
    color: #606266;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .news-card {
    width: 300px;
    display: flex;
    gap: 12px;
    padding: 10px;
    background: #fff;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }
  .news-cover {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .news-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .news-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .news-desc {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .news-link {
    color: var(--el-color-primary);
    font-size: 13px;
    text-decoration: none;
  }
  .news-link:hover {
    text-decoration: underline;
  }
  .media-preview {
    background: #fff;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .media-image {
    max-width: 140px;
    max-height: 140px;
    height: -webkit-fill-available;
  }
  .media-audio {
    width: 100%;
  }
  .media-video {
    width: 100%;
    max-height: 300px;
    border-radius: 4px;
  }
  .reply-empty-div {
    width: 120px;
    height: 120px;
  }
  :deep(.reply-empty-div .el-empty__image) {
    width: 80px !important;
    height: 80px !important;
  }

  :deep(.reply-empty-div .el-empty__description) {
    margin-top: 0px;
  }
</style>
