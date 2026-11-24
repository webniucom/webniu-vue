<!-- 系统logo -->
<template>
  <div class="flex-cc">
    <img :style="logoStyle" :src="systemConfig.systemInfo.logo" alt="logo" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
  import { useSystemStore } from '@/store/modules/system'
  const systemStore = useSystemStore()
  const systemConfig = computed(() => systemStore.systemConfig)
  defineOptions({ name: 'ArtLogo' })

  interface Props {
    /** logo 大小 */
    size?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 36
  })

  const logoStyle = computed(() => ({ width: `${props.size}px` }))
</script>
