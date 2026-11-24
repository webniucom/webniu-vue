<!-- 工作台页面 -->
<template>
  <div>
    <ElRow :gutter="20" class="flex">
      <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
        <div class="art-card relative flex flex-col justify-center h-30 px-5 mb-5 max-sm:mb-4">
          <span class="text-g-700 text-sm">{{ item.change }}</span>
          <ArtCountTo
            class="text-[26px] font-medium mt-2 mb-2"
            :target="item.num"
            :duration="1300"
          />
          <div class="flex items-center">
            <span class="text-xs font-medium flex items-center">
              <ArtSvgIcon icon="ri:error-warning-line" class="text-xs text-g-600 mr-0.5" />
              {{ item.des }}
            </span>
          </div>
          <div
            class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
          >
            <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
          </div>
        </div>
      </ElCol>
    </ElRow>

    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12" :lg="18">
        <div class="art-card h-105 p-5 mb-5 max-sm:mb-4">
          <div class="art-card-header">
            <div class="title">
              <h4>访问量</h4>
              <p>visits</p>
            </div>
          </div>
          <ArtLineChart
            height="calc(100% - 56px)"
            :data="data"
            :xAxisData="xAxisData"
            :showAreaColor="true"
            :showAxisLine="false"
          />
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="6">
        <div class="art-card h-105 p-4 box-border mb-5 max-sm:mb-4">
          <div class="art-card-header">
            <div class="title">
              <h4>安装应用</h4>
              <p
                >已安装<span class="text-success">{{ pluginNum }}</span></p
              >
            </div>
          </div>
          <ArtRingChart
            :data="pluginData"
            :radius="['50%', '70%']"
            height="20rem"
            :showLegend="true"
            legendPosition="bottom"
            :legendOptions="{
              itemHeight: 12, // 图例项高度（默认12）
              itemWidth: 10, // 图例项宽度（默认12）
              itemGap: 10, // 图例项间距（默认20）
              lineHeight: 12, // 图例文本行高（默认20）
              fontSize: 12 // 图例文本字体大小
            }"
          />
        </div>
      </ElCol>
    </ElRow>
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="18">
        <NewUser />
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="6">
        <div class="art-card h-128 p-5 mb-5 max-sm:mb-4">
          <div class="art-card-header">
            <div class="title">
              <h4>引擎信息</h4>
              <p>engine info</p>
            </div>
          </div>

          <div class="h-[calc(100%-40px)] overflow-auto">
            <ElScrollbar>
              <div
                class="flex-cb h-14.5 border-b border-g-300 text-sm last:border-b-0"
                v-for="(item, index) in list"
                :key="index"
              >
                <div>
                  <p class="text-sm">{{ item.username }}</p>
                </div>
                <div>
                  <p class="text-g-500 mt-1">{{ item.date }}</p>
                </div>
              </div>
            </ElScrollbar>
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import NewUser from './modules/new-user.vue'
  import { get } from '@/api/common-request'
  defineOptions({ name: 'Console' })
  const DASHBOARD_API = '/webniu/admin/index/dashboard'
  //加载数据
  const fetchDashboard = (params: any) => {
    return get(DASHBOARD_API, params)
  }

  const userNum = ref<number>(0)
  const manageNum = ref<number>(0)
  const pageNum = ref<number>(0)
  const pluginNum = ref<number>(0)
  const pluginData = ref<any>([])
  /**
   * 卡片统计数据列表
   * 展示总访问次数、在线访客数、点击量和新用户等核心数据指标
   */
  //计算属性
  const dataList = computed(() => [
    {
      des: '总注册会员用户',
      icon: 'ri:group-line',
      startVal: 0,
      duration: 1000,
      num: userNum.value,
      change: 'User View'
    },
    {
      des: '总注册管理用户',
      icon: 'ri:contacts-line',
      startVal: 0,
      duration: 1000,
      num: manageNum.value,
      change: 'Manage View'
    },
    {
      des: '总后台浏览量',
      icon: 'ri:mac-line',
      startVal: 0,
      duration: 1000,
      num: pageNum.value,
      change: 'Page View'
    },
    {
      des: '已安装应用',
      icon: 'ri:function-line',
      startVal: 0,
      duration: 1000,
      num: pluginNum.value,
      change: 'Plugin View'
    }
  ])

  /**
   * 全年访问量数据
   * 记录每月的访问量统计
   */
  const data = ref<number[]>([])

  /**
   * X 轴月份标签
   */
  const xAxisData = ref<string[]>([])

  /**
   * 待办事项列表
   * 记录每日工作任务及完成状态
   */
  const version = ref<any>({})
  const list = computed(() => [
    {
      username: 'Workerman版本',
      date: version.value?.workerman_version || ''
    },
    {
      username: 'Webman版本',
      date: version.value?.webman_version || ''
    },
    {
      username: 'Webniu版本',
      date: version.value?.admin_version || ''
    },
    {
      username: 'Think-cache版本',
      date: version.value?.think_cache || ''
    },
    {
      username: 'PHP版本',
      date: version.value?.php_version || ''
    },
    {
      username: 'MYSQL版本',
      date: version.value?.mysql_version || ''
    },
    {
      username: '操作系统',
      date: version.value?.os || ''
    }
  ])
  const allocation = async () => {
    await fetchDashboard({})
      .then((res: any) => {
        data.value = res.day15_detail.series || []
        xAxisData.value = res.day15_detail.labels || []
        userNum.value = res.user_num || 0
        manageNum.value = res.manage_num || 0
        pageNum.value = res.page_num || 0
        pluginNum.value = res.plugin_num || 0
        version.value = res.version || {}
        pluginData.value = res.plugin || {}
      })
      .catch((err: any) => {
        console.log(err)
      })
  }
  onMounted(() => {
    allocation()
  })
</script>
