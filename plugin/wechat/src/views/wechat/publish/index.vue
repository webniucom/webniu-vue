<template>
  <div class="publish-page art-full-height">
    <ElCard class="art-card-xs wn-config-card art-full-height">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="header-icon">
              <ArtSvgIcon icon="ri:send-plane-line" />
            </div>
            <div class="header-text">
              <div class="header-title">微信公众号接入</div>
              <div class="header-subtitle">4 步完成对接，所有配置均从微信官方获取</div>
            </div>
          </div>
          <div class="header-right" v-if="config.name">
            <ElTag effect="plain" type="success" size="large" round>
              <ArtSvgIcon icon="ri:user-settings-line" class="mr-1" />
              当前公众号：{{ config.name }}
            </ElTag>
          </div>
        </div>
      </template>

      <template #default>
        <ElScrollbar class="art-full-height" max-height="calc(100vh - 290px)">
          <div class="publish-content">
            <div class="pub-layout">
              <!-- 左侧步骤导航 -->
              <aside class="pub-nav">
                <div class="pub-nav__title">接入步骤</div>
                <button
                  v-for="item in sections"
                  :key="item.id"
                  type="button"
                  class="pub-nav__item"
                  :class="{ 'is-active': activeSection === item.id }"
                  @click="scrollToSection(item.id)"
                >
                  <span class="pub-nav__no">{{ item.no }}</span>
                  <span class="pub-nav__text">{{ item.title }}</span>
                </button>
                <div class="pub-nav__tip">
                  <ArtSvgIcon icon="ri:lightbulb-line" />
                  按顺序配置即可完成接入
                </div>
              </aside>

              <div class="pub-main">
            <!-- 步骤 1 -->
            <section id="step-1" class="step-section">
              <div class="step-header">
                <span class="step-no">01</span>
                <div class="step-title-group">
                  <h3 class="step-title">登录微信公众平台</h3>
                  <p class="step-desc">使用公众号管理员账号登录，后续配置需要管理员权限。</p>
                </div>
                <i class="ri:login-circle-line step-icon" />
              </div>
              <ElAlert type="info" :closable="false" show-icon>
                <template #title>登录入口</template>
                请访问
                <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" class="link">
                  https://mp.weixin.qq.com
                </a>
                ，使用公众号的<strong>管理员</strong>微信扫码登录。
              </ElAlert>
            </section>

            <!-- 步骤 2 -->
            <section id="step-2" class="step-section">
              <div class="step-header">
                <span class="step-no">02</span>
                <div class="step-title-group">
                  <h3 class="step-title">获取开发者凭证</h3>
                  <p class="step-desc">在公众平台【设置与开发】-【基本配置】获取 AppID 和 AppSecret。</p>
                </div>
                <i class="ri:key-2-line step-icon" />
              </div>
              <div class="path-steps">
                <ElTag type="info" effect="plain">开发 → 基本配置</ElTag>
                <i class="ri:arrow-right-s-line" />
                <ElTag type="info" effect="plain">开发者 ID(AppID)</ElTag>
                <i class="ri:arrow-right-s-line" />
                <ElTag type="info" effect="plain">开发者密码(AppSecret)</ElTag>
              </div>
              <ElAlert type="warning" :closable="false" show-icon class="mt-4">
                <template #title>安全提示</template>
                AppSecret 只在<strong>首次显示</strong>时完整可见，如已遗忘可重置。重置后请同步更新到网牛【参数配置】。
              </ElAlert>
            </section>

            <!-- 步骤 3 -->
            <section id="step-3" class="step-section">
              <div class="step-header">
                <span class="step-no">03</span>
                <div class="step-title-group">
                  <h3 class="step-title">网牛参数配置 & 服务器配置</h3>
                  <p class="step-desc">在网牛【参数配置】填好 AppID/AppSecret，再将下方参数复制到微信【服务器配置】。</p>
                </div>
                <i class="ri:settings-3-line step-icon" />
              </div>
              <div class="params-grid">
                <div class="param-card" v-for="item in serverParams" :key="item.key">
                  <div class="param-label">
                    <i :class="item.icon" />
                    <span>{{ item.label }}</span>
                    <ElTag size="small" :type="item.tagType" effect="light">{{ item.tag }}</ElTag>
                  </div>
                  <div class="param-row">
                    <div class="param-value">{{ config[item.key] || item.placeholder }}</div>
                    <ElButton
                      v-if="item.copyable"
                      class="param-copy"
                      text
                      type="primary"
                      :disabled="!config[item.key]"
                      title="复制"
                      @click="copy(config[item.key])"
                    >
                      <i class="ri:file-copy-line" />
                    </ElButton>
                    <ElButton v-else class="param-copy" text type="primary" title="前往参数配置" @click="goRemote">
                      <i class="ri:external-link-line" />
                    </ElButton>
                  </div>
                  <div class="param-desc">{{ item.desc }}</div>
                </div>
              </div>
              <ElAlert type="warning" :closable="false" show-icon class="mt-4">
                <template #title>启用流程</template>
                1. 把 URL / Token / EncodingAESKey 填到微信公众平台【服务器配置】<br />
                2. 消息加密方式建议选「<strong>明文模式</strong>」或「<strong>兼容模式</strong>」<br />
                3. 点【启用】后微信会向你的 URL 发起验证请求，确保网牛已启动
              </ElAlert>
            </section>

            <!-- 步骤 4 -->
            <section id="step-4" class="step-section">
              <div class="step-header">
                <span class="step-no">04</span>
                <div class="step-title-group">
                  <h3 class="step-title">域名回调配置</h3>
                  <p class="step-desc">在公众平台【账户设置】-【功能设置】配置 JS 安全域名和网页授权域名。</p>
                </div>
                <i class="ri:global-line step-icon" />
              </div>
              <div class="path-steps">
                <ElTag type="info" effect="plain">账户设置</ElTag>
                <i class="ri:arrow-right-s-line" />
                <ElTag type="info" effect="plain">功能设置</ElTag>
                <i class="ri:arrow-right-s-line" />
                <ElTag type="info" effect="plain">JS接口安全域名 / 网页授权域名</ElTag>
              </div>
              <div class="params-grid mt-4">
                <div class="param-card" v-for="item in domainParams" :key="item.key">
                  <div class="param-label">
                    <i :class="item.icon" />
                    <span>{{ item.label }}</span>
                  </div>
                  <div class="param-row">
                    <div class="param-value">{{ config.domain || '未配置' }}</div>
                    <ElButton
                      class="param-copy"
                      text
                      type="primary"
                      :disabled="!config.domain"
                      title="复制域名"
                      @click="copy(config.domain)"
                    >
                      <i class="ri:file-copy-line" />
                    </ElButton>
                  </div>
                  <div class="param-desc">{{ item.desc }}</div>
                </div>
              </div>
              <ElAlert type="warning" :closable="false" show-icon class="mt-4">
                <template #title>配置注意事项</template>
                · 域名必须<strong>已备案</strong>且<strong>HTTPS</strong><br />
                · 不要带 http:// 或 https:// 前缀，直接填域名本身<br />
                · 按微信要求下载校验文件 MP_verify_xxx.txt 放到域名根目录
              </ElAlert>
            </section>

            <!-- FAQ -->
            <section id="faq" class="faq-section">
              <div class="section-title">
                <i class="ri:question-line" />
                <span>常见问题</span>
              </div>
              <ElCollapse accordion>
                <ElCollapseItem title="启用服务器配置后微信提示「Token 验证失败」怎么办？">
                  1. 检查网牛【参数配置】里的 Token 与微信公众平台填写的是否完全一致<br />
                  2. 检查 URL 是否能从公网访问（本地开发用内网穿透）<br />
                  3. 查看 webman/runtime/logs/ 下日志是否有收到微信的验证请求<br />
                  4. 确认服务器时间正确（误差不能超过 5 分钟）
                </ElCollapseItem>
                <ElCollapseItem title="消息加解密模式选哪个好？">
                  <strong>明文模式</strong>：最简单，无需 EncodingAESKey<br />
                  <strong>兼容模式</strong>：明文+加密混合，网牛已自动适配<br />
                  <strong>安全模式</strong>：全加密，必须填 EncodingAESKey<br />
                  推荐：本地开发用明文模式，生产环境用兼容模式。
                </ElCollapseItem>
                <ElCollapseItem title="配置完后为什么粉丝发消息公众号没回复？">
                  1. 进【自动回复】配置关键词回复规则<br />
                  2. 微信平台【基本配置】下方的「IP 白名单」要把服务器出口 IP 加进去<br />
                  3. 服务器配置【启用】状态必须为绿色已启用
                </ElCollapseItem>
                <ElCollapseItem title="JS-SDK 报「invalid signature」？">
                  1. 确认 JS 接口安全域名已配置并通过校验<br />
                  2. 检查当前页面 URL 与安全域名是否同根<br />
                  3. access_token 和 jsapi_ticket 是否在缓存有效期内（默认 7200 秒）
                </ElCollapseItem>
              </ElCollapse>
            </section>
              </div>
            </div>
          </div>
        </ElScrollbar>
      </template>

      <template #footer>
        <div class="card-footer">
          <span class="update-tip">配置后请前往参数配置页填写 AppID / AppSecret</span>
          <div class="footer-btns">
            <ElButton @click="reload">
              <i class="ri:refresh-line" /> 刷新参数
            </ElButton>
            <ElButton type="primary" @click="goRemote">
              <i class="ri:settings-line" /> 前往参数配置
            </ElButton>
          </div>
        </div>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { get } from '@admin/core/request'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'WechatPublish' })

  const router = useRouter()
  const route = useRoute()
  const url = toAdminApiUrl(route.meta.key as string)

  const SHOW_API = url + '/show'

  interface PublishConfig {
    name: string
    appid: string
    appsecret_mask: string
    url: string
    token: string
    aes_key: string
    domain: string
    callback: string
  }

  const config = ref<PublishConfig>({
    name: '',
    appid: '',
    appsecret_mask: '',
    url: '',
    token: '',
    aes_key: '',
    domain: '',
    callback: ''
  })

  interface ParamItem {
    key: keyof PublishConfig
    label: string
    icon: string
    tag: string
    tagType: 'success' | 'warning' | 'info' | 'danger'
    placeholder: string
    desc: string
    copyable: boolean
  }

  const serverParams: ParamItem[] = [
    { key: 'callback', label: '服务器地址 URL', icon: 'ri:link', tag: '必填', tagType: 'success', placeholder: '未配置', desc: '填到微信公众平台【服务器配置】的 URL 输入框', copyable: true },
    { key: 'token', label: 'Token', icon: 'ri:shield-keyhole-line', tag: '必填', tagType: 'success', placeholder: '未配置', desc: '自定义 Token，需与微信服务器配置中填写的一致', copyable: true },
    { key: 'aes_key', label: 'EncodingAESKey', icon: 'ri:lock-2-line', tag: '可选', tagType: 'warning', placeholder: '未配置（明文模式可留空）', desc: '消息加解密密钥，安全模式下必填', copyable: true },
    { key: 'appid', label: 'AppID', icon: 'ri:building-line', tag: '系统已配置', tagType: 'info', placeholder: '未配置', desc: '公众号唯一标识，由微信分配', copyable: true },
    { key: 'appsecret_mask', label: 'AppSecret', icon: 'ri:key-line', tag: '脱敏显示', tagType: 'info', placeholder: '未配置', desc: '出于安全考虑，此处仅显示前 4 位', copyable: false }
  ]

  const domainParams: Omit<ParamItem, 'tag' | 'tagType' | 'copyable'>[] = [
    { key: 'domain', label: 'JS 接口安全域名', icon: 'ri:shield-check-line', placeholder: '未配置', desc: '用于调用微信 JS-SDK（自定义分享、扫一扫、卡券等）' },
    { key: 'domain', label: '网页授权域名', icon: 'ri:user-received-line', placeholder: '未配置', desc: '用于 OAuth2.0 网页授权获取用户 OpenID / 用户信息' }
  ]

  const loadConfig = async () => {
    try {
      const res: any = await get(SHOW_API)
      config.value = {
        name: res?.name ?? '',
        appid: res?.appid ?? '',
        appsecret_mask: res?.appsecret_mask ?? '',
        url: res?.url ?? '',
        token: res?.token ?? '',
        aes_key: res?.aes_key ?? '',
        domain: res?.domain ?? '',
        callback: res?.callback ?? ''
      }
      // 按已配置情况计算进度
      const filled = [
        config.value.appid,
        config.value.url && config.value.token ? 'ok' : '',
        config.value.domain
      ].filter(Boolean)
      void filled
    } catch (e: any) {
      ElMessage.error(e?.message || '加载公众号参数失败')
    }
  }

  const copy = (text?: string) => {
    if (!text) {
      ElMessage.warning('暂无可复制的内容')
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动选择文本复制')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  const goRemote = () => {
    router.push('/wechat/configmanage/remote')
  }

  const reload = () => {
    loadConfig()
    ElMessage.success('参数已刷新')
  }

  // 左侧步骤导航
  const sections = [
    { id: 'step-1', no: '01', title: '登录公众平台' },
    { id: 'step-2', no: '02', title: '获取开发者凭证' },
    { id: 'step-3', no: '03', title: '服务器配置' },
    { id: 'step-4', no: '04', title: '域名回调配置' },
    { id: 'faq', no: '?', title: '常见问题' }
  ]
  const activeSection = ref('step-1')

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      activeSection.value = id
    }
  }

  let spy: IntersectionObserver | null = null
  const initSpy = () => {
    spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeSection.value = entry.target.id
        })
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    sections.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) spy?.observe(el)
    })
  }

  onMounted(() => {
    loadConfig()
    initSpy()
  })

  onBeforeUnmount(() => {
    spy?.disconnect()
  })
</script>

<style scoped>
  .publish-page {
    padding: 0;
  }

  /* 卡片头/体间距收敛，与 payment 页保持一致 */
  .wn-config-card :deep(.el-card__header) {
    border-bottom: 0 !important;
  }
  .wn-config-card :deep(.el-card__body) {
    padding-top: 0;
  }
  .wn-config-card :deep(.el-scrollbar__view) {
    padding-bottom: 0;
  }

  /* Header */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: var(--el-color-primary, #07c160);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary, #07c160) 18%, transparent),
      color-mix(in srgb, var(--el-color-primary, #07c160) 8%, transparent)
    );
  }
  .header-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary, #303133);
  }
  .header-subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
    margin-top: 2px;
  }
  .header-right :deep(.el-tag) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* 内容区 */
  .publish-content {
    padding: 4px 4px 8px;
  }

  /* 两栏布局 + 左侧步骤导航 */
  .pub-layout {
    display: grid;
    grid-template-columns: 208px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .pub-nav {
    position: sticky;
    top: 8px;
    padding: 14px 12px;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 12px;
    background: var(--el-bg-color, #fff);
  }
  .pub-nav__title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--el-text-color-secondary, #909399);
    padding: 0 8px 10px;
  }
  .pub-nav__item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    margin-bottom: 2px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    color: var(--el-text-color-regular, #606266);
    transition:
      background-color 0.2s,
      color 0.2s;
  }
  .pub-nav__item:hover {
    background: var(--el-fill-color-light, #f5f7fa);
    color: var(--el-color-primary, #07c160);
  }
  .pub-nav__item.is-active {
    background: color-mix(in srgb, var(--el-color-primary, #07c160) 10%, transparent);
    color: var(--el-color-primary, #07c160);
    font-weight: 600;
  }
  .pub-nav__no {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'JetBrains Mono', Consolas, monospace;
    color: var(--el-text-color-secondary, #909399);
    background: var(--el-fill-color-light, #f5f7fa);
  }
  .pub-nav__item.is-active .pub-nav__no {
    color: #fff;
    background: var(--el-color-primary, #07c160);
  }
  .pub-nav__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pub-nav__tip {
    margin-top: 10px;
    padding: 10px 8px 0;
    border-top: 1px dashed var(--el-border-color-lighter, #ebeef5);
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary, #909399);
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .pub-main {
    min-width: 0;
  }

  /* 步骤区块 */
  .step-section {
    background: var(--el-bg-color, #fff);
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    scroll-margin-top: 8px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .step-section:hover {
    border-color: color-mix(in srgb, var(--el-color-primary, #07c160) 35%, transparent);
    box-shadow: 0 4px 16px -8px color-mix(in srgb, var(--el-color-primary, #07c160) 40%, transparent);
  }
  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
  }
  .step-no {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    font-family: 'JetBrains Mono', Consolas, monospace;
    color: var(--el-color-primary, #07c160);
    background: color-mix(in srgb, var(--el-color-primary, #07c160) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--el-color-primary, #07c160) 28%, transparent);
  }
  .step-title-group {
    flex: 1;
    min-width: 0;
  }
  .step-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--el-text-color-primary, #303133);
  }
  .step-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
    margin: 0;
    line-height: 1.5;
  }
  .step-icon {
    flex-shrink: 0;
    font-size: 26px;
    color: var(--el-color-primary, #07c160);
    opacity: 0.45;
  }

  /* 路径步骤 */
  .path-steps {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .path-steps i {
    font-size: 16px;
    color: var(--el-text-color-placeholder, #c0c4cc);
  }

  /* 参数卡片网格 */
  .params-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
    margin-top: 14px;
  }
  .param-card {
    background: var(--el-bg-color, #fff);
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition:
      border-color 0.2s,
      background-color 0.2s;
  }
  .param-card:hover {
    border-color: color-mix(in srgb, var(--el-color-primary, #07c160) 45%, transparent);
    background: color-mix(in srgb, var(--el-color-primary, #07c160) 2%, var(--el-bg-color, #fff));
  }
  .param-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-regular, #606266);
    font-weight: 500;
  }
  .param-label i {
    font-size: 15px;
    color: var(--el-color-primary, #07c160);
  }
  .param-label span {
    flex: 1;
  }
  .param-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .param-value {
    flex: 1;
    min-width: 0;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 13px;
    background: var(--el-fill-color-lighter, #fafafa);
    padding: 8px 10px;
    border-radius: 6px;
    word-break: break-all;
    color: var(--el-text-color-primary, #303133);
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
  }
  .param-copy {
    flex-shrink: 0;
    padding: 4px 6px !important;
    font-size: 16px;
  }
  .param-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
    line-height: 1.5;
  }
  .param-card .el-button {
    padding: 0;
  }

  .mt-4 {
    margin-top: 14px;
  }

  /* FAQ */
  .faq-section {
    background: var(--el-bg-color, #fff);
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 12px;
    padding: 18px 20px;
    scroll-margin-top: 8px;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary, #303133);
  }
  .section-title i {
    font-size: 18px;
    color: var(--el-color-primary, #07c160);
  }

  /* Footer */
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .update-tip {
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
  }
  .footer-btns {
    display: flex;
    gap: 10px;
  }

  /* 链接 */
  .link {
    color: var(--el-color-primary, #07c160);
    text-decoration: none;
    margin: 0 2px;
    border-bottom: 1px dashed var(--el-color-primary, #07c160);
  }
  .link:hover {
    opacity: 0.8;
  }

  @media (max-width: 1199px) {
    .pub-layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .pub-nav {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .step-section,
    .faq-section {
      padding: 14px;
    }
    .step-header {
      flex-wrap: wrap;
    }
    .step-icon {
      display: none;
    }
    .card-footer {
      flex-direction: column;
      align-items: stretch;
    }
    .footer-btns .el-button {
      flex: 1;
    }
  }
</style>
