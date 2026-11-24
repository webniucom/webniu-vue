<!-- 图标组件 -->
<template>
  <component
    v-if="icon"
    :is="iconComponent"
    :icon="icon"
    v-bind="bindAttrs"
    class="art-svg-icon inline"
  />
</template>

<script setup lang="ts">
  import { Icon } from '@iconify/vue'
  import { WN_ICON_COMPONENT_KEY } from '../../core/context'

  defineOptions({ name: 'ArtSvgIcon', inheritAttrs: false })

  interface Props {
    /** Iconify icon name */
    icon?: string
  }

  defineProps<Props>()

  // 壳子（基座）已通过 WN_ICON_COMPONENT_KEY 注入带离线图标集的 Icon 组件；
  // 子应用里如果直接用自己打包的 @iconify/vue 副本，图标集数据是空的会渲染空白，
  // 所以优先用注入的实现，独立运行（无注入）时才退回本地 Icon。
  const iconComponent = inject(WN_ICON_COMPONENT_KEY, null) || Icon

  const attrs = useAttrs()

  const bindAttrs = computed<{ class: string; style: string }>(() => ({
    class: (attrs.class as string) || '',
    style: (attrs.style as string) || ''
  }))
</script>
