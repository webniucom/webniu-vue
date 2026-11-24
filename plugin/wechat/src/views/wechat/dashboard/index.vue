<!-- 数据面板（当前公众号） -->
<template>
  <div class="wn-dash" v-loading="loading">
    <!-- 到期提醒 -->
    <ElAlert
      v-if="account.is_expired"
      class="dash-expire"
      type="error"
      closable
      show-icon
      :title="`公众号已到期（${account.valid_at}）`"
      description="相关功能已暂停使用，请联系管理员续期。"
    />
    <ElAlert
      v-else-if="expiringSoon"
      class="dash-expire"
      type="warning"
      closable
      show-icon
      :title="`公众号将于 ${account.valid_at} 到期`"
      :description="`仅剩 ${account.remain_days} 天，请及时联系管理员续期。`"
    />
    <!-- 核心指标 -->
    <section class="dash-stats">
      <div v-for="item in statCards" :key="item.key" class="art-card dash-card stat-card">
        <div class="stat-top">
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-icon" :style="{ color: item.color, backgroundColor: item.bg }">
            <ElIcon><component :is="item.icon" /></ElIcon>
          </span>
        </div>
        <div class="stat-value">{{ formatNum(item.value) }}</div>
        <div class="stat-foot">{{ item.foot }}</div>
      </div>
    </section>

    <!-- 趋势 + 素材分布 -->
    <section class="art-card dash-card dash-trend">
      <div class="dash-card-head">
        <div>
          <h4>粉丝增长</h4>
          <p>近 15 天新增与取关</p>
        </div>
        <div class="head-extra">
          <span class="legend-dot" :style="{ backgroundColor: themePrimary }" />新增
          <span class="legend-dot legend-cancel" />取关
          <ElButton class="refresh-btn" size="small" text type="primary" @click="loadData">刷新数据</ElButton>
        </div>
      </div>
      <ArtLineChart
        height="280px"
        :data="trendData"
        :xAxisData="trend.labels"
        :colors="trendColors"
        :showLegend="false"
        :showAreaColor="false"
        :showSplitLine="true"
        :showAxisLine="false"
      />
    </section>

    <section class="art-card dash-card dash-material">
      <div class="dash-card-head">
        <div>
          <h4>素材分布</h4>
          <p>共 {{ formatNum(materialTotal) }} 个素材</p>
        </div>
      </div>
      <div v-if="materialData.length" class="material-body">
        <div class="material-summary">
          <span class="material-total">{{ formatNum(materialTotal) }}</span>
          <span class="material-total-label">素材总数</span>
        </div>
        <div class="material-stack">
          <i
            v-for="item in materialList"
            :key="item.name"
            :style="{ width: `${item.percent}%`, backgroundColor: item.color }"
            :title="`${item.name} ${item.percent}%`"
          />
        </div>
        <ul class="material-legend">
          <li v-for="item in materialList" :key="item.name">
            <span class="material-dot" :style="{ backgroundColor: item.color }" />
            <span class="material-name">{{ item.name }}</span>
            <span class="material-count">{{ formatNum(item.value) }}</span>
            <span class="material-percent">{{ item.percent }}%</span>
          </li>
        </ul>
      </div>
      <ElEmpty v-else description="暂无素材" :image-size="72" />
    </section>

    <!-- 功能概览 -->
    <section class="art-card dash-card dash-feature">
      <div class="dash-card-head">
        <div>
          <h4>功能概览</h4>
        </div>
      </div>
      <div class="feature-grid">
        <div v-for="item in featureList" :key="item.label" class="feature-item" @click="go(item.path)">
          <span class="feature-icon" :style="{ color: item.color, backgroundColor: item.bg }">
            <ElIcon><component :is="item.icon" /></ElIcon>
          </span>
          <div class="feature-info">
            <div class="feature-value">{{ item.value }}</div>
            <div class="feature-label">{{ item.label }}</div>
          </div>
          <span class="feature-arrow"><ElIcon><ArrowRight /></ElIcon></span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import {
    ArrowRight,
    ChatDotRound,
    CircleClose,
    CollectionTag,
    Files,
    Grid,
    Menu as MenuIcon,
    User,
    UserFilled
  } from '@element-plus/icons-vue'
  import { get } from '@admin/core/request'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import ArtLineChart from '@admin/charts/art-line-chart/index.vue'

  defineOptions({ name: 'WechatDashboard' })

  const route = useRoute()
  const router = useRouter()
  const API = toAdminApiUrl(route.meta.key as string) + '/dashboard'

  const loading = ref(false)
  const account = ref<any>({})

  // 跟随系统主题色（--el-color-primary）
  const themePrimary = ref('#07c160')
  const readThemePrimary = () => {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()
    if (val) themePrimary.value = val
  }
  const trendColors = computed(() => [themePrimary.value, '#909399'])

  const fansTotal = ref(0)
  const fansTodayNew = ref(0)
  const fansTodayCancel = ref(0)
  const materialTotal = ref(0)
  const ruleTotal = ref(0)
  const qrcodeTotal = ref(0)
  const tagTotal = ref(0)
  const menuEnabled = ref(0)

  const trend = reactive<{ labels: string[]; new: number[]; cancel: number[] }>({
    labels: [],
    new: [],
    cancel: []
  })

  const materialData = ref<{ name: string; value: number }[]>([])

  // 素材配色：首色跟随主题色
  const materialColors = computed(() => [themePrimary.value, '#409eff', '#e6a23c', '#909399', '#8e44ad'])

  const materialList = computed(() => {
    const total = materialData.value.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1
    return materialData.value.map((item, index) => ({
      ...item,
      color: materialColors.value[index % materialColors.value.length],
      percent: Math.round((Number(item.value || 0) / total) * 100)
    }))
  })

  const formatNum = (val: number) => (val ?? 0).toLocaleString()

  // 即将到期：未到期、设置了有效期、剩余天数 ≤ 7 天
  const expiringSoon = computed(() => {
    const days = account.value?.remain_days
    return (
      !account.value?.is_expired &&
      !!account.value?.valid_at &&
      days !== null &&
      days !== undefined &&
      Number(days) <= 7
    )
  })

  const statCards = computed(() => {
    const color = themePrimary.value
    const bg = `color-mix(in srgb, ${color} 12%, transparent)`
    return [
      {
        key: 'fans',
        label: '总粉丝数',
        value: fansTotal.value,
        icon: User,
        color,
        bg,
        foot: `今日新增 ${formatNum(fansTodayNew.value)}`
      },
      {
        key: 'new',
        label: '今日新增关注',
        value: fansTodayNew.value,
        icon: UserFilled,
        color,
        bg,
        foot: '来自公众号关注'
      },
      {
        key: 'cancel',
        label: '今日取消关注',
        value: fansTodayCancel.value,
        icon: CircleClose,
        color,
        bg,
        foot: '今日取关人数'
      },
      {
        key: 'material',
        label: '素材总数',
        value: materialTotal.value,
        icon: Files,
        color,
        bg,
        foot: '图文 / 图片 / 语音 / 视频'
      }
    ]
  })

  const trendData = computed(() => [
    { name: '新增关注', data: trend.new },
    { name: '取消关注', data: trend.cancel }
  ])

  const featureList = computed(() => [
    {
      label: '关键字规则',
      value: ruleTotal.value,
      icon: ChatDotRound,
      color: '#409eff',
      bg: 'rgba(64, 158, 255, 0.1)',
      path: '/wechat/pertain/reply'
    },
    {
      label: '二维码',
      value: qrcodeTotal.value,
      icon: Grid,
      color: '#07c160',
      bg: 'rgba(7, 193, 96, 0.1)',
      path: '/wechat/pertain/qrcode'
    },
    {
      label: '粉丝标签',
      value: tagTotal.value,
      icon: CollectionTag,
      color: '#e6a23c',
      bg: 'rgba(230, 162, 60, 0.1)',
      path: '/wechat/fansmanage/fans'
    },
    {
      label: '自定义菜单',
      value: menuEnabled.value > 0 ? '已配置' : '未配置',
      icon: MenuIcon,
      color: '#909399',
      bg: 'rgba(144, 147, 153, 0.12)',
      path: '/wechat/pertain/menu'
    }
  ])

  const loadData = async () => {
    loading.value = true
    try {
      const res: any = await get(API)
      account.value = res?.account || {}
      fansTotal.value = Number(res?.fans_total ?? 0)
      fansTodayNew.value = Number(res?.fans_today_new ?? 0)
      fansTodayCancel.value = Number(res?.fans_today_cancel ?? 0)
      materialTotal.value = Number(res?.material_total ?? 0)
      ruleTotal.value = Number(res?.rule_total ?? 0)
      qrcodeTotal.value = Number(res?.qrcode_total ?? 0)
      tagTotal.value = Number(res?.tag_total ?? 0)
      menuEnabled.value = Number(res?.menu_enabled ?? 0)

      trend.labels = res?.trend?.labels ?? []
      trend.new = res?.trend?.new ?? []
      trend.cancel = res?.trend?.cancel ?? []

      materialData.value = res?.material_types ?? []
    } finally {
      loading.value = false
    }
  }

  const go = (path: string) => {
    router.push(path)
  }

  let themeObserver: MutationObserver | null = null

  onMounted(() => {
    readThemePrimary()
    // 主题色变化时同步折线颜色
    themeObserver = new MutationObserver(readThemePrimary)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    loadData()
  })

  onBeforeUnmount(() => {
    themeObserver?.disconnect()
  })
</script>

<style scoped>
  .wn-dash {
    --dash-gap: 16px;
    --dash-pad: 20px;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--dash-gap);
    align-items: stretch;
  }

  .dash-expire {
    grid-column: span 12;
  }

  .dash-card {
    box-sizing: border-box;
    border-radius: 12px;
    padding: var(--dash-pad);
  }

  /* 统一卡片标题 */
  .dash-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .dash-card-head h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: var(--el-text-color-primary, #303133);
  }
  .dash-card-head p {
    margin: 2px 0 0;
    font-size: 12px;
    line-height: 18px;
    color: var(--el-text-color-secondary, #909399);
  }
  .head-extra {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .legend-cancel {
    background: #909399;
    margin-left: 6px;
  }
  .refresh-btn {
    margin-left: 6px;
    padding: 0 4px;
  }

  /* 指标卡片 */
  .dash-stats {
    grid-column: span 12;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--dash-gap);
  }
  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .stat-card:hover {
    border-color: color-mix(in srgb, var(--el-color-primary, #07c160) 35%, transparent);
    box-shadow: 0 6px 18px -12px rgba(0, 0, 0, 0.25);
  }
  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .stat-label {
    font-size: 13px;
    line-height: 18px;
    color: var(--el-text-color-secondary, #909399);
  }
  .stat-icon {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 600;
    line-height: 28px;
    color: var(--el-text-color-primary, #303133);
    font-variant-numeric: tabular-nums;
  }
  .stat-foot {
    font-size: 12px;
    line-height: 16px;
    color: var(--el-text-color-secondary, #909399);
  }

  /* 图表面板 */
  .dash-trend {
    grid-column: span 8;
  }
  .dash-material {
    grid-column: span 4;
    display: flex;
    flex-direction: column;
  }

  /* 素材分布：占比条 + 明细列表 */
  .material-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 200px;
  }
  .material-summary {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
  }
  .material-total {
    font-size: 24px;
    font-weight: 600;
    line-height: 30px;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary, #303133);
  }
  .material-total-label {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
  .material-stack {
    display: flex;
    gap: 2px;
    height: 8px;
    margin-bottom: 6px;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--el-fill-color-light, #f5f7fa);
  }
  .material-stack i {
    display: block;
    height: 100%;
    min-width: 2px;
    transition: width 0.4s ease;
  }
  .material-legend {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
  }
  .material-legend li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    line-height: 18px;
    border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
  }
  .material-legend li:last-child {
    border-bottom: none;
  }
  .material-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .material-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-regular, #606266);
  }
  .material-count {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary, #303133);
  }
  .material-percent {
    width: 38px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary, #909399);
  }

  /* 功能概览 */
  .dash-feature {
    grid-column: span 12;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--dash-gap);
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 10px;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background-color 0.2s;
  }
  .feature-item:hover {
    border-color: color-mix(in srgb, var(--el-color-primary, #07c160) 40%, transparent);
    background: color-mix(in srgb, var(--el-color-primary, #07c160) 3%, transparent);
  }
  .feature-icon {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .feature-info {
    flex: 1;
    min-width: 0;
  }
  .feature-value {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    color: var(--el-text-color-primary, #303133);
  }
  .feature-label {
    margin-top: 2px;
    font-size: 12px;
    line-height: 18px;
    color: var(--el-text-color-secondary, #909399);
  }
  .feature-arrow {
    flex-shrink: 0;
    font-size: 16px;
    color: var(--el-text-color-placeholder, #c0c4cc);
  }

  @media (max-width: 1199px) {
    .dash-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .dash-trend,
    .dash-material {
      grid-column: span 12;
    }
  }

  @media (max-width: 768px) {
    .wn-dash {
      --dash-pad: 16px;
    }
    .feature-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .dash-stats,
    .feature-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
