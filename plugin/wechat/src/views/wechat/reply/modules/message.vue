<template>
  <ElDialog
    :title="title"
    v-model="dialogVisible"
    :width="width"
    class="message-dialog"
    header-class="message-dialog-header"
    body-class="message-dialog-body"
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
      class="message-dialog-form"
    >
      <template #text_content>
        <div class="message-dialog-text-content">
          <el-input
            ref="textareaRef"
            v-model="formData.text_content"
            style="width: 100%"
            :rows="7"
            type="textarea"
            placeholder="请输入回复内容"
            @click="saveCursorPosition"
            @keyup="saveCursorPosition"
          />
        </div>
      </template>
    </ArtForm>
    <template #footer>
      <div class="message-dialog-footer">
        <el-button-group direction="horizontal" size="small">
          <el-button type="primary" @click="handleBiaoQingClick">选择表情</el-button>
          <el-button type="primary" @click="handleEmojiClick">选择Emoji</el-button>
          <el-button type="primary" @click="handleLinkClick">插入连接</el-button>
        </el-button-group>
        <div>
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">提交</ElButton>
        </div>
      </div>
    </template>
    <ElDialog
      :title="emojiTitle"
      v-model="xiaoVisible"
      :width="xiaoWidth"
      body-class="message-dialog-body"
      align-center
      @closed="xiaoHandleClosed"
    >
      <el-scrollbar v-if="activeEmojiTab !== 'link'" :height="xiaoHeight">
        <div v-if="activeEmojiTab === 'qq'" class="emoji-container qq-emoji">
          <div
            v-for="(emoji, index) in qqEmojis"
            :key="'qq-' + index"
            class="eItem"
            :style="{ backgroundPosition: emoji.position }"
            @click="insertEmoji('/' + emoji.code)"
            :title="emoji.title"
          ></div>
        </div>
        <div v-else class="emoji-container unicode-emoji">
          <a
            v-for="(emoji, index) in unicodeEmojis"
            :key="'uni-' + index"
            href="javascript:;"
            :title="emoji.title"
            @click="insertEmoji('[U+' + emoji.code + ']')"
          >
            <span class="emoji-char">{{ emoji.char }}</span>
          </a>
        </div>
      </el-scrollbar>
      <el-form
        v-else
        ref="linkFormRef"
        :model="linkForm"
        :rules="linkRules"
        label-width="80px"
        class="link-form"
      >
        <el-form-item label="链接名称" prop="name">
          <el-input v-model="linkName" placeholder="请输入链接名称" />
        </el-form-item>
        <el-form-item label="链接地址" prop="url">
          <el-input v-model="linkUrl" placeholder="请输入 http/https 链接" />
        </el-form-item>
        <el-form-item class="link-form-footer">
          <el-button type="primary" @click="insertLink">插入链接</el-button>
          <el-button @click="xiaoVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </ElDialog>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref, onMounted } from 'vue'
  import ArtForm from '@admin/forms/art-form/index.vue'
  import templates from './js/emoji'

  interface Props {
    visible: boolean
    editData?: Partial<any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = ref('文本消息')
  const width = ref('500')
  const xiaoVisible = ref(false)
  const emojiTitle = ref('选择表情')
  const activeEmojiTab = ref('qq')
  const textareaRef = ref<any>()
  const cursorPosition = ref(0)
  const xiaoHeight = ref('400px')
  const xiaoWidth = ref('480px')
  const linkFormRef = ref<any>()
  const linkName = ref('')
  const linkUrl = ref('')
  const linkForm = computed(() => ({
    name: linkName.value,
    url: linkUrl.value
  }))
  const linkRules = {
    name: [{ required: true, message: '请输入链接名称', trigger: 'blur' }],
    url: [
      { required: true, message: '请输入链接地址', trigger: 'blur' },
      {
        validator: (rule: any, value: string, callback: any) => {
          if (value && !/^https?:\/\//.test(value)) {
            callback(new Error('链接地址必须以 http:// 或 https:// 开头'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
  // QQ 表情数据
  interface QQEmoji {
    title: string
    code: string
    position: string
    gifurl: string
  }
  // Unicode emoji 数据
  interface UnicodeEmoji {
    title: string
    code: string
    char: string
  }
  const qqEmojis = ref<QQEmoji[]>([])
  const unicodeEmojis = ref<UnicodeEmoji[]>([])

  // 解析 emoji.ts 中的 templates 字符串，提取表情数据
  const parseTemplates = () => {
    // 解析 QQ 表情模板
    const qqTpl = templates['emoji-content-qq.tpl']
    if (qqTpl) {
      const doc = new DOMParser().parseFromString(qqTpl, 'text/html')
      const items = doc.querySelectorAll('.eItem')
      const list: QQEmoji[] = []
      items.forEach((item) => {
        const el = item as HTMLElement
        const title = el.getAttribute('data-title') || ''
        const code = el.getAttribute('data-code') || ''
        const gifurl = el.getAttribute('data-gifurl') || ''
        const position = el.style.backgroundPosition || ''
        list.push({ title, code, gifurl, position })
      })
      qqEmojis.value = list
    }
    // 解析 Unicode emoji 模板
    const emojiTpl = templates['emoji-content-emoji.tpl']
    if (emojiTpl) {
      const doc = new DOMParser().parseFromString(emojiTpl, 'text/html')
      const anchors = doc.querySelectorAll('a[title]')
      const list: UnicodeEmoji[] = []
      anchors.forEach((a) => {
        const title = a.getAttribute('title') || ''
        const codeText = a.querySelectorAll('span')[1]?.textContent || ''
        // 将 hex code 转为实际 Unicode 字符
        const codePoint = parseInt(codeText, 16)
        const char = isNaN(codePoint) ? '' : String.fromCodePoint(codePoint)
        list.push({ title, code: codeText, char })
      })
      unicodeEmojis.value = list
    }
  }

  onMounted(() => {
    parseTemplates()
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  const formText = [
    {
      label: false,
      labelWidth: '120px',
      key: 'text_content',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入回复名称',
        clearable: false,
        type: 'textarea'
      },
      rules: [
        {
          required: true,
          message: '请输入回复名称',
          trigger: 'blur'
        }
      ]
    }
  ]
  // 表单项配置（使用 computed 确保响应式更新）
  const formItems = ref<any>([])

  const formRef = ref<any>()
  // 表单数据
  const formData = ref<any>({})

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const row = props.editData || {}
    formItems.value = []
    if (row.module === 'text') {
      width.value = '500'
      formItems.value = formText
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
  // 选择表情
  const handleBiaoQingClick = () => {
    emojiTitle.value = '选择QQ表情'
    activeEmojiTab.value = 'qq'
    xiaoVisible.value = true
    xiaoHeight.value = '200px'
    xiaoWidth.value = '415px'
  }
  // 选择Emoji
  const handleEmojiClick = () => {
    emojiTitle.value = '选择Emoji'
    activeEmojiTab.value = 'emoji'
    xiaoVisible.value = true
    xiaoHeight.value = '400px'
    xiaoWidth.value = '480px'
  }
  // 插入连接
  const handleLinkClick = () => {
    emojiTitle.value = '插入链接'
    activeEmojiTab.value = 'link'
    xiaoVisible.value = true
    xiaoHeight.value = 'auto'
    xiaoWidth.value = '400px'
    linkName.value = ''
    linkUrl.value = ''
  }
  // 保存光标位置
  const saveCursorPosition = () => {
    nextTick(() => {
      const textarea = textareaRef.value?.$el?.querySelector('textarea')
      if (textarea) {
        cursorPosition.value = textarea.selectionStart
      }
    })
  }
  // 在光标位置插入表情
  const insertEmoji = (emoji: string) => {
    const text = formData.value.text_content || ''
    const position = cursorPosition.value
    xiaoVisible.value = false
    formData.value.text_content = text.substring(0, position) + emoji + text.substring(position)
    cursorPosition.value = position + emoji.length
    nextTick(() => {
      const textarea = textareaRef.value?.$el?.querySelector('textarea')
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(cursorPosition.value, cursorPosition.value)
      }
    })
  }
  // 在光标位置插入链接
  const insertLink = async () => {
    if (!linkFormRef.value) return
    await linkFormRef.value.validate((valid: boolean) => {
      if (valid) {
        const text = formData.value.text_content || ''
        const position = cursorPosition.value
        const linkHtml = `<a href="${linkUrl.value}" >${linkName.value}</a>`
        formData.value.text_content =
          text.substring(0, position) + linkHtml + text.substring(position)
        cursorPosition.value = position + linkHtml.length
        xiaoVisible.value = false
        nextTick(() => {
          const textarea = textareaRef.value?.$el?.querySelector('textarea')
          if (textarea) {
            textarea.focus()
            textarea.setSelectionRange(cursorPosition.value, cursorPosition.value)
          }
        })
      }
    })
  }
  // 小对话框关闭
  const xiaoHandleClosed = () => {
    nextTick(() => {
      const textarea = textareaRef.value?.$el?.querySelector('textarea')
      if (textarea) {
        textarea.focus()
      }
    })
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
</script>
<style scoped>
  :global(.message-dialog-form) {
    padding: 5px 0px 0px 0px !important;
  }
  :global(.message-dialog-form .el-form-item--default) {
    margin-bottom: 5px !important;
  }
  :global(.message-dialog-body) {
    padding: 0px !important;
  }
  .message-dialog-text-content {
    width: 100%;
  }
  .message-dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .emoji-container {
    padding: 4px;
  }
  /* QQ 表情：复用 emotions.css 中的 .emotions td div 样式 */
  .qq-emoji {
    display: grid;
    grid-template-columns: repeat(15, 24px);
    gap: 1px;
    background-color: #f6f6f6;
  }
  .qq-emoji .eItem {
    width: 24px;
    height: 24px;
    cursor: pointer;
    border: 1px solid #dfe6f6;
    background-image: url('./img/default.gif');
    background-repeat: no-repeat;
  }
  .qq-emoji .eItem:hover {
    border: 1px solid #00f;
  }
  /* Unicode emoji 网格 */
  .unicode-emoji {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .unicode-emoji a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #eee;
    cursor: pointer;
    text-decoration: none;
  }
  .unicode-emoji a:hover {
    border-color: #428bca;
  }
  .emoji-char {
    font-size: 20px;
    line-height: 1;
  }
  .link-form {
    padding: 10px;
  }
  .link-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }
</style>
