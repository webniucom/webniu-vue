<!-- 顶部快速入口面板 -->
<template>
  <ElPopover
    :disabled="!(enabledApplications.length > 0)"
    ref="popoverRef"
    :width="minWidth"
    :offset="0"
    :show-arrow="false"
    trigger="hover"
    placement="bottom-start"
    popper-class="fast-enter-popover"
    :popper-style="{
      border: '1px solid var(--default-border)',
      borderRadius: 'calc(var(--custom-radius) / 2 + 4px)'
    }"
  >
    <template #reference>
      <div class="flex-c gap-2">
        <slot />
      </div>
    </template>

    <div class="grid grid-cols-1 gap-2">
      <div>
        <div class="grid grid-cols-1 gap-1.5">
          <!-- 应用列表 -->
          <div
            v-for="application in enabledApplications"
            :key="application.name"
            class="c-p flex-c gap-1 rounded-lg p-2 hover:bg-g-200/40 dark:hover:bg-g-200/90"
            @click="handleApplicationClick(application)"
          >
            <div
              class="mr-2 app-icon size-12 flex-cc rounded-lg bg-[var(--el-color-primary)]/10 dark:bg-g-300/30"
            >
              <ArtSvgIcon
                class="text-xl"
                :icon="application.icon"
                :style="
                  application.iconColor
                    ? { color: application.iconColor }
                    : { color: 'var(--el-color-primary)' }
                "
              />
            </div>
            <div>
              <h3 class="m-0 text-sm font-medium text-g-800">{{ application.name }}</h3>
              <p class="mt-1 text-xs text-g-600">{{ application.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import { useFastEnter } from '@/hooks/core/useFastEnter'
  import type { FastEnterApplication } from '@/types/config'

  defineOptions({ name: 'ArtFastEnter' })

  const router = useRouter()
  const popoverRef = ref()

  // 使用快速入口配置
  const { enabledApplications, minWidth } = useFastEnter()

  /**
   * 处理导航跳转
   * @param routeName 路由名称
   * @param link 外部链接
   */
  const handleNavigate = (routeName?: string, link?: string, target?: boolean): void => {
    const targetPath = routeName || link

    if (!targetPath) {
      console.warn('导航配置无效：缺少路由名称或链接')
      return
    }

    if (targetPath.startsWith('http')) {
      if (target === true) {
        window.open(targetPath, '_blank')
      } else {
        window.location.href = targetPath
      }
    } else {
      // 检查路由是否存在
      const route = router.resolve(targetPath)
      if (route.path === targetPath) {
        router.push(targetPath)
      } else {
        console.warn(`路由 "${targetPath}" 不存在，请检查路由配置`)
      }
    }

    popoverRef.value?.hide()
  }
  /**
   * 处理应用项点击
   * @param application 应用配置对象
   */
  const handleApplicationClick = (application: FastEnterApplication): void => {
    handleNavigate(application.routeName, application.link, application.target)
  }
</script>
