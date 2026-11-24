<template>
  <ElConfigProvider
    size="default"
    :locale="locales[language]"
    :z-index="3000"
    :card="{
      shadow: 'never'
    }"
  >
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { useUserStore } from './store/modules/user'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'
  import { WN_EL_LOCALE_KEY } from '@admin/core/context'
  import { systemUpgrade } from './utils/sys'
  import { toggleTransition } from './utils/ui/animation'
  import { checkStorageCompatibility } from './utils/storage'
  import { initializeTheme } from './hooks/core/useTheme'

  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)

  const locales = {
    zh: zh,
    en: en
  }

  // 把 EP locale 通过字符串注入 key 传给共享包：子应用打包的 element-plus 副本
  // inject 不到本组件 ElConfigProvider 的 provide（不同副本 Symbol 不同），
  // 共享 ArtTable 用该 key 接收后在自己副本的 ElConfigProvider 上下发，分页等文案才能跟随基座语言
  provide(WN_EL_LOCALE_KEY, computed(() => locales[language.value]))

  onBeforeMount(() => {
    toggleTransition(true)
    initializeTheme()
  })

  onMounted(() => {
    checkStorageCompatibility()
    toggleTransition(false)
    systemUpgrade()
  })
</script>
