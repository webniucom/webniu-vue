<!-- components/FieldTooltip.vue -->
<template>
  <ElTooltip :content="content || defaultContent" placement="top">
    <ElIcon class="ml-2 cursor-help text-base! text-g-500! hover:text-g-500!">
      <QuestionFilled />
    </ElIcon>
  </ElTooltip>
</template>

<script setup lang="ts">
  import { ElTooltip, ElIcon } from 'element-plus'
  import { QuestionFilled } from '@element-plus/icons-vue'
  interface Props {
    content?: string
  }
  withDefaults(defineProps<Props>(), {
    content: ''
  })
  const defaultContent = '请输入描述'
</script>
