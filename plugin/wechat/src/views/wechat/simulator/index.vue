<template>
  <div class="simulator">
    <!-- 左侧：粉丝搜索与选择 -->
    <ElCard class="sim-fans" shadow="never">
      <div class="fans-title">选择模拟用户</div>
      <ElInput
        v-model="fanKeyword"
        placeholder="搜索昵称 / openid"
        clearable
        :prefix-icon="SearchIcon"
        @input="onFanKeywordInput"
        @clear="onFanClear"
      />
      <div v-loading="fanLoading" class="fans-list">
        <template v-if="fanList.length">
          <div
            v-for="f in fanList"
            :key="f.fanid"
            class="fan-item"
            :class="{ active: currentFan && Number(currentFan.fanid) === Number(f.fanid) }"
            @click="selectFan(f)"
          >
            <ElAvatar :src="f.headimgurl" :size="36" />
            <div class="fan-item-meta">
              <div class="fan-item-nick">
                {{ f.nickname || '未命名' }}
                <ElTag v-if="Number(f.subscribe) === 1" type="success" size="small" effect="plain">已关注</ElTag>
              </div>
              <div class="fan-item-openid">{{ f.openid }}</div>
            </div>
          </div>
        </template>
        <div v-else class="fans-empty">
          {{ fanSearched ? '无匹配粉丝' : '输入昵称 / openid 搜索粉丝' }}
        </div>
      </div>
      <div v-if="currentFan" class="fans-current">
        <div class="fans-current-info">
          <ElAvatar :src="currentFan.headimgurl" :size="28" />
          <span class="fans-current-nick">{{ currentFan.nickname || currentFan.openid }}</span>
        </div>
        <ElButton size="small" text type="danger" @click="handleClearFan">清除身份</ElButton>
      </div>
    </ElCard>

    <!-- 右侧：模拟对话区 -->
    <ElCard class="sim-chat" shadow="never">
      <div class="chat-head">
        <div class="wechat-name">
          <span class="dot" />
          <span>{{ wechatName || '公众号模拟器' }}</span>
        </div>
        <div v-if="currentFan" class="chat-identity">
          模拟身份：<b>{{ currentFan.nickname || currentFan.openid }}</b>
        </div>
        <ElAlert v-else type="warning" :closable="false" show-icon class="fan-alert">
          请先在左侧选择一个模拟用户
        </ElAlert>
      </div>

      <div ref="chatBody" class="chat-body">
        <ElEmpty v-if="messages.length === 0" description="输入关键字或点击底部菜单，测试自动回复" />
        <div v-for="(msg, i) in messages" :key="i" class="msg-row" :class="msg.role">
          <template v-if="msg.role === 'user'">
            <div class="bubble bubble-user">{{ msg.content }}</div>
          </template>
          <template v-else>
            <div class="bubble bubble-system">
              <div class="match-tag">{{ matchLabel(msg.match) }}</div>
              <template v-if="msg.reply?.type === 'text'">
                <div class="text-content">{{ msg.reply?.content || '（空回复）' }}</div>
              </template>
              <template v-else-if="msg.reply?.type === 'news'">
                <a class="news-card" :href="withOpenid(msg.reply?.url)" target="_blank" rel="noopener">
                  <img v-if="msg.reply?.picurl" :src="msg.reply?.picurl" class="news-img" />
                  <div class="news-body">
                    <div class="news-title">{{ msg.reply?.title }}</div>
                    <div v-if="msg.reply?.description" class="news-desc">{{ msg.reply?.description }}</div>
                    <div class="news-hint">点击在新标签页打开（已注入登录身份）</div>
                  </div>
                </a>
              </template>
              <template v-else>
                <div class="media-placeholder">
                  [{{ mediaLabel(msg.reply?.type) }}消息] media_id：{{ msg.reply?.mediaId || '-' }}
                  <span class="muted">（模拟器仅文本/图文可预览）</span>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <div v-if="menuList.length" class="menu-bar">
        <div v-for="(menu, mi) in menuList" :key="mi" class="menu-group">
          <template v-for="(btn, bi) in menu.button" :key="bi">
            <div v-if="hasSub(btn)" class="menu-item has-sub">
              <span>{{ btn.name }}</span>
              <div class="sub-menu">
                <div
                  v-for="(sub, si) in btn.sub_button"
                  :key="si"
                  class="sub-item"
                  @click="handleMenuClick(sub)"
                >{{ sub.name }}</div>
              </div>
            </div>
            <div v-else class="menu-item" @click="handleMenuClick(btn)">{{ btn.name }}</div>
          </template>
        </div>
      </div>

      <div class="input-bar">
        <ElInput
          v-model="keyword"
          placeholder="输入关键字，回车发送"
          :disabled="sending"
          clearable
          @keyup.enter="handleSend"
        />
        <ElButton type="primary" :loading="sending" @click="handleSend">发送</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toAdminApiUrl } from '@admin/core/utils/controller'
import { get, post } from '@admin/core/request'
import { ElMessage } from 'element-plus'
import { Search as SearchIcon } from '@element-plus/icons-vue'

defineOptions({ name: 'WechatSimulator' })

const route = useRoute()
const url = toAdminApiUrl(route.meta.key as string)

interface Fan {
  fanid: number
  openid: string
  nickname: string
  headimgurl: string
  subscribe?: number
}
interface Reply {
  type: string
  content?: string
  title?: string
  description?: string
  picurl?: string
  url?: string
  mediaId?: string
}
interface Message {
  role: 'user' | 'system'
  match?: string
  content?: string
  reply?: Reply
}

const wechatName = ref('')
const currentFan = ref<Fan | null>(null)
const fanKeyword = ref('')
const fanList = ref<Fan[]>([])
const fanLoading = ref(false)
const fanSearched = ref(false)
const messages = ref<Message[]>([])
const keyword = ref('')
const sending = ref(false)
const menuList = ref<any[]>([])
const chatBody = ref<HTMLElement>()

const matchLabel = (m?: string) =>
  ({ exact: '精确匹配', like: '包含匹配', default: '默认回复', none: '未匹配', error: '请求出错' }[m || 'none'] || m)
const mediaLabel = (t?: string) => ({ image: '图片', voice: '语音', video: '视频' }[t || ''] || t || '未知')
const hasSub = (btn: any) => Array.isArray(btn?.sub_button) && btn.sub_button.length > 0

const scrollBottom = () =>
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  })

const loadFans = async (kw: string) => {
  fanLoading.value = true
  try {
    const res: any = await get(url + '/fans', { keyword: kw, page: 1, limit: 50 })
    fanList.value = res?.records || []
    fanSearched.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '粉丝加载失败')
  } finally {
    fanLoading.value = false
  }
}

let fanTimer: ReturnType<typeof setTimeout> | null = null
const onFanKeywordInput = () => {
  if (fanTimer) clearTimeout(fanTimer)
  const kw = fanKeyword.value.trim()
  if (!kw) {
    onFanClear()
    return
  }
  fanTimer = setTimeout(() => loadFans(kw), 300)
}

const onFanClear = () => {
  fanList.value = []
  fanSearched.value = false
}

const selectFan = async (f: Fan) => {
  try {
    const res: any = await post(url + '/setFan', { fanid: f.fanid })
    currentFan.value = res?.fan || f
    ElMessage.success(`已切换模拟身份：${f.nickname || f.openid}`)
  } catch (e: any) {
    ElMessage.error(e?.message || '切换失败')
  }
}

const handleClearFan = async () => {
  try {
    await post(url + '/clearFan')
    currentFan.value = null
    ElMessage.success('已清除模拟身份')
  } catch (e: any) {
    ElMessage.error(e?.message || '清除失败')
  }
}

onMounted(async () => {
  try {
    const cfg: any = await get(url + '/index')
    wechatName.value = cfg?.wechat?.name || ''
    const cf: any = await get(url + '/currentFan')
    currentFan.value = cf?.fan || null
    const mn: any = await get(url + '/menus')
    menuList.value = mn?.menus || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  }
})

const pushReply = async (kw: string) => {
  messages.value.push({ role: 'user', content: kw })
  scrollBottom()
  sending.value = true
  try {
    const res: any = await post(url + '/send', { keyword: kw })
    messages.value.push({ role: 'system', match: res?.match, reply: res?.reply })
  } catch (e: any) {
    messages.value.push({
      role: 'system',
      match: 'error',
      reply: { type: 'text', content: e?.message || '请求失败' },
    })
  } finally {
    sending.value = false
    scrollBottom()
  }
}

// 未选择模拟用户时统一拦截提示
const requireFan = (): boolean => {
  if (!currentFan.value) {
    ElMessage.warning('请先在左侧选择一个模拟用户')
    return false
  }
  return true
}

const withOpenid = (u?: string) => {
  const raw = (u || '').trim()
  if (!raw || !currentFan.value?.openid) return raw
  try {
    const url = new URL(raw, location.origin)
    // 只处理站内应用链接（/app/...）或同源链接，外部文章链接不追加
    if (!url.pathname.startsWith('/app/') && url.origin !== location.origin) return raw
    if (!url.searchParams.get('openid')) url.searchParams.set('openid', currentFan.value.openid)
    return url.toString()
  } catch {
    return raw
  }
}

const handleSend = () => {
  if (!requireFan()) return
  const kw = keyword.value.trim()
  if (!kw) return
  keyword.value = ''
  pushReply(kw)
}

const handleMenuClick = (btn: any) => {
  if (!requireFan()) return
  const type = btn?.type
  if (type === 'view' && btn.url) {
    window.open(withOpenid(btn.url), '_blank', 'noopener')
    return
  }
  if (type === 'miniprogram') {
    ElMessage.warning('小程序菜单无法在模拟器中打开')
    return
  }
  if (btn.key) {
    pushReply(btn.key)
  } else {
    ElMessage.info('该菜单未配置关键字')
  }
}
</script>

<style scoped>
.simulator {
  display: flex;
  gap: 12px;
  height: calc(100vh - 130px);
  overflow: hidden;
  align-items: stretch;
}
/* 左侧粉丝栏 */
.sim-fans {
  width: 280px;
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
}
.sim-fans :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 14px;
  min-height: 0;
}
.fans-title {
  font-size: 14px;
  font-weight: 600;
}
.fans-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fans-empty {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.fan-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s, border-color 0.15s;
}
.fan-item:hover {
  background: #f5f7fa;
}
.fan-item.active {
  background: #ecf9f0;
  border-color: #07c160;
}
.fan-item-meta {
  min-width: 0;
  flex: 1;
}
.fan-item-nick {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fan-item-openid {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fans-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}
.fans-current-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fans-current-nick {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧聊天区 */
.sim-chat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.sim-chat :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  min-height: 0;
}
.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.wechat-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #07c160;
}
.chat-identity {
  font-size: 13px;
  color: #606266;
}
.fan-alert {
  padding: 6px 12px;
}
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: #f5f6f7;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 320px;
}
.msg-row {
  display: flex;
}
.msg-row.user {
  justify-content: flex-end;
}
.msg-row.system {
  justify-content: flex-start;
}
.bubble {
  max-width: 70%;
  border-radius: 10px;
  padding: 10px 12px;
  word-break: break-word;
  position: relative;
}
.bubble-user {
  background: #95ec69;
  color: #111;
}
.bubble-system {
  background: #fff;
  border: 1px solid #eee;
}
.match-tag {
  display: inline-block;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
  padding: 1px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}
.text-content {
  white-space: pre-wrap;
  line-height: 1.6;
}
.news-card {
  display: flex;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  max-width: 380px;
}
.news-card:hover {
  opacity: 0.85;
}
.news-img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  flex: 0 0 auto;
}
.news-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.news-title {
  font-weight: 600;
  font-size: 14px;
}
.news-desc {
  font-size: 12px;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-hint {
  font-size: 11px;
  color: #07c160;
}
.media-placeholder {
  font-size: 13px;
  color: #555;
}
.muted {
  color: #999;
  font-size: 12px;
}
.menu-bar {
  display: flex;
  border-top: 1px solid #eee;
  background: #fafafa;
  min-height: 44px;
}
.menu-group {
  flex: 1;
  display: flex;
  border-right: 1px solid #eee;
}
.menu-group:last-child {
  border-right: none;
}
.menu-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  position: relative;
  padding: 0 8px;
  text-align: center;
}
.menu-item:hover {
  background: #eef5ff;
}
.has-sub:hover .sub-menu {
  display: block;
}
.sub-menu {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
}
.sub-item {
  padding: 10px 8px;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.sub-item:hover {
  background: #f5f5f5;
}
.sub-item:last-child {
  border-bottom: none;
}
.input-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}
</style>
