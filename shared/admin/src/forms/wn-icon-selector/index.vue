<template>
  <elDialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    @close-demo="handleClose"
    align-center
    body-class="wn-icon-selector-body"
  >
    <div class="wn-icon-selector-content flex gap-4 h-full max-md:block max-md:gap-0 max-md:h-auto">
      <div class="flex-shrink-0 h-90 w-40 max-md:w-full max-md:h-auto max-md:mb-1">
        <ElCard shadow="never" class="tree-card art-card-xs flex flex-col h-full mt-0 wn-icon-selector-tree">
          <template #header>
            <div class="flex flex-col gap-2">
              <b>图标分类</b>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">风格：</span>
                <el-radio-group v-model="iconStyle" size="small" @change="handleIconStyleChange">
                  <el-radio-button value="line">Line</el-radio-button>
                  <el-radio-button value="fill">Fill</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <ElScrollbar>
            <ElTree
              :data="treeData"
              node-key="id"
              highlight-current
              :current-node-key="currentNodeKey"
              @node-click="handleNodeClick"
            />
          </ElScrollbar>
        </ElCard>
      </div>
      <div class="flex flex-col h-90 flex-grow min-w-0">
        <ElCard shadow="never" class="flex flex-col h-90 mt-0 wn-icon-selector">
          <div class="flex-grow">
            <ElScrollbar ref="scrollbarRef" height="400px" @scroll="handleScroll">
              <div class="icon-grid">
                <div v-loading="loading" class="icon-grid-container">
                  <div
                    v-for="(icon, index) in displayIcons"
                    :key="index"
                    class="icon-item"
                    @click="selectIcon(`ri:${getIconName(icon)}`)"
                  >
                    <ArtSvgIcon :icon="`ri:${getIconName(icon)}`" class="icon size-6" />
                  </div>
                </div>
                <div v-if="noMore" class="no-more"> 没有更多图标了 </div>
              </div>
            </ElScrollbar>
          </div>
        </ElCard>
      </div>
    </div>
  </elDialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import tagsData from './tags.json'

  // 状态变量
  const currentCategory = ref('all')
  const currentNodeKey = ref(0) // 默认选中"全部"分类
  const allIcons = ref<string[]>([])
  const displayIcons = ref<string[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const pageSize = 50
  const currentPage = ref(1)
  const scrollbarRef = ref() // 滚动条引用
  const iconStyle = ref('line') // 图标风格，默认 line

  // 处理图标风格切换
  const handleIconStyleChange = () => {
    // 重新加载图标
    currentPage.value = 1
    noMore.value = false
    loadIcons()
  }

  // 处理节点点击
  const handleNodeClick = (data: any) => {
    currentNodeKey.value = data.id // 更新当前选中节点

    if (data.id === 0) {
      // 点击"全部"分类
      currentCategory.value = 'all'
    } else {
      // 点击其他分类
      const categoryKey = Object.keys(tagsData).filter((key) => key !== '_comment')[data.id - 1]
      currentCategory.value = categoryKey
    }
    // 重置分页
    currentPage.value = 1
    noMore.value = false
    // 加载图标
    loadIcons()
    // 滚动条复位到顶部
    resetScrollbar()
  }

  // 滚动条复位到顶部
  const resetScrollbar = () => {
    if (scrollbarRef.value) {
      // 访问 ElScrollbar 的内部滚动元素并设置滚动位置
      const scrollElement = scrollbarRef.value.$el.querySelector('.el-scrollbar__wrap')
      if (scrollElement) {
        scrollElement.scrollTop = 0
      }
    }
  }

  // Props
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '图标选择器'
    },
    width: {
      type: String,
      default: '800px'
    }
  })

  // Emits
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'open-demo'): void
    (e: 'close-demo'): void
    (e: 'select-icon', data?: string): void
  }>()

  // 分类中英文映射
  const categoryMap = {
    Arrows: '箭头',
    Buildings: '建筑',
    Business: '商业',
    Communication: '通讯',
    Design: '设计',
    Development: '开发',
    Device: '设备',
    Document: '文档',
    Editor: '编辑器',
    Finance: '财务',
    Food: '食物',
    Game_Sports: '游戏运动',
    Health_Medical: '健康医疗',
    Logos: '标志',
    Map: '地图',
    Media: '媒体',
    System: '系统',
    User_Faces: '用户人脸',
    Weather: '天气',
    Others: '其他'
  }

  // 从 tags.json 生成一级分类树数据（中文显示）
  const treeData = ref([
    {
      id: 0,
      label: '全部'
    },
    ...Object.keys(tagsData)
      .filter((key) => key !== '_comment')
      .map((category, index) => ({
        id: index + 1,
        label: categoryMap[category as keyof typeof categoryMap] || category
      }))
  ])

  // 初始化数据
  const initData = () => {
    // 加载全部图标
    loadAllIcons()
  }

  // 加载所有图标
  const loadAllIcons = () => {
    const icons: string[] = []
    Object.entries(tagsData).forEach(([key, category]) => {
      if (key !== '_comment' && typeof category === 'object' && category !== null) {
        Object.keys(category).forEach((iconName) => {
          icons.push(iconName)
        })
      }
    })
    allIcons.value = icons
  }

  // 动态检测并添加图标后缀
  const getIconName = (name: string) => {
    if (name.includes('-line') || name.includes('-fill')) {
      return name
    }
    // 检查当前分类是否为 Editor
    if (currentCategory.value === 'Editor') {
      return `${name}`
    }
    return `${name}-${iconStyle.value}`
  }

  // 加载图标
  const loadIcons = () => {
    loading.value = true
    setTimeout(() => {
      let iconsToLoad: string[] = []

      if (currentCategory.value === 'all') {
        // 加载全部图标
        iconsToLoad = allIcons.value
      } else {
        // 加载指定分类的图标
        const categoryData = tagsData[currentCategory.value as keyof typeof tagsData]
        if (categoryData && typeof categoryData === 'object') {
          iconsToLoad = Object.keys(categoryData)
        }
      }

      // 分页加载
      const start = (currentPage.value - 1) * pageSize
      const end = start + pageSize
      const newIcons = iconsToLoad.slice(start, end)

      if (currentPage.value === 1) {
        displayIcons.value = newIcons
      } else {
        displayIcons.value = [...displayIcons.value, ...newIcons]
      }

      // 检查是否还有更多
      noMore.value = end >= iconsToLoad.length
      loading.value = false
    }, 500)
  }

  // 加载更多
  const loadMore = () => {
    if (!loading.value && !noMore.value) {
      currentPage.value++
      loadIcons()
    }
  }

  // ElScrollbar @scroll：触底加载（替代已废弃的 v-infinite-scroll 指令）
  const handleScroll = ({ scrollTop }: { scrollTop: number; scrollLeft: number }) => {
    const wrap = scrollbarRef.value?.$el?.querySelector('.el-scrollbar__wrap')
    if (!wrap) return
    if (scrollTop + wrap.clientHeight >= wrap.scrollHeight - 10) {
      loadMore()
    }
  }

  // 选择图标
  const selectIcon = (icon: string) => {
    emit('select-icon', icon)
    handleClose()
  }

  // 对话框可见性
  const dialogVisible = ref(props.visible)

  // 监听 props.visible 变化
  watch(
    () => props.visible,
    (newValue) => {
      dialogVisible.value = newValue
      if (newValue) {
        // 对话框打开时触发回调
        emit('open-demo')
        // 初始化数据
        initData()
        // 加载图标
        loadIcons()
        // 重置选中节点为"全部"
        //currentNodeKey.value = 0
        // 滚动条复位
        resetScrollbar()
      }
    }
  )

  // 监听 dialogVisible 变化
  watch(dialogVisible, (newValue) => {
    emit('update:visible', newValue)
  })

  // 处理关闭
  const handleClose = () => {
    dialogVisible.value = false
    emit('close-demo')
  }
</script>

<style scoped>
  :global(.wn-icon-selector-body) {
    padding: 0px 0 !important;
  }
  .wn-icon-selector-tree :deep(.el-card__header) {
    padding: 10px !important;
  }
  .wn-icon-selector :deep(.el-card__body) {
    padding: 0px !important;
  }

  .icon-grid {
    padding: 15px;
  }

  .icon-grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 15px;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
  }

  .icon-item:hover {
    background-color: var(--el-fill-color-light);
    border-color: var(--el-color-primary);
  }

  .icon {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .icon-name {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    word-break: break-all;
  }

  .no-more {
    text-align: center;
    padding: 20px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
</style>
