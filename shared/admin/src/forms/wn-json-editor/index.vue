<template>
  <div class="wn-json-editor">
    <!-- 工具栏 -->
    <div class="flex flex-wrap gap-2 mb-3">
      <ElButtonGroup>
        <ElButton
          size="small"
          :type="mode === 'tree' ? 'primary' : 'default'"
          @click="mode = 'tree'"
          >树形模式</ElButton
        >
        <ElButton
          size="small"
          :type="mode === 'text' ? 'primary' : 'default'"
          @click="mode = 'text'"
          >文本模式</ElButton
        >
        <ElButton
          size="small"
          :type="mode === 'code' ? 'primary' : 'default'"
          @click="mode = 'code'"
          >代码模式</ElButton
        >
      </ElButtonGroup>
      <ElButtonGroup>
        <ElButton size="small" @click="formatJson">格式化</ElButton>
        <ElButton size="small" @click="compactJson">压缩</ElButton>
        <ElButton size="small" @click="clearJson">清空</ElButton>
        <ElButton size="small" type="primary" @click="validateJson">验证JSON</ElButton>
      </ElButtonGroup>
      <span v-if="validStatus === 'valid'" class="text-green-500 text-sm ml-auto">✓ 有效</span>
      <span v-else-if="validStatus === 'invalid'" class="text-red-500 text-sm ml-auto">✗ 无效</span>
    </div>

    <!-- 树形模式 -->
    <div
      v-if="mode === 'tree'"
      class="json-tree-container border rounded-lg p-3 max-h-96 overflow-auto"
    >
      <JsonTreeNode v-if="parsedData" :data="parsedData" @update="handleTreeUpdate" />
      <div v-else class="text-gray-400 text-center py-8">请输入JSON数据</div>
    </div>

    <!-- 文本/代码模式 -->
    <div v-else>
      <ElInput
        v-model="localValue"
        type="textarea"
        :rows="15"
        placeholder="请输入JSON数据..."
        class="font-mono text-sm"
        :class="{ 'border-red-400': validStatus === 'invalid' }"
      />
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="mt-2 text-red-500 text-sm">{{ errorMessage }}</div>

    <!-- JSON输出结果 -->
    <div class="mt-4 art-card p-4 !rounded-lg">
      <h4 class="mb-2 text-sm font-medium">JSON 输出结果</h4>
      <pre
        class="text-sm overflow-auto max-h-40 bg-gray-50 p-2 rounded"
      ><code>{{ localValue }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ElButton, ElButtonGroup, ElInput } from 'element-plus'
  import JsonTreeNode from './JsonTreeNode.vue'

  const props = defineProps<{
    modelValue?: Record<string, any> | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any> | null): void
  }>()

  const mode = ref<'tree' | 'text' | 'code'>('tree')
  const localValue = ref('')
  const errorMessage = ref('')

  const parsedData = computed(() => {
    if (!localValue.value) return null
    try {
      return JSON.parse(localValue.value)
    } catch {
      return null
    }
  })

  const validStatus = computed(() => {
    if (!localValue.value) return 'empty'
    try {
      JSON.parse(localValue.value)
      return 'valid'
    } catch {
      return 'invalid'
    }
  })

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        localValue.value = JSON.stringify(val, null, 2)
      } else {
        localValue.value = ''
      }
    },
    { immediate: true }
  )

  watch(localValue, (val) => {
    errorMessage.value = ''
    if (!val) {
      emit('update:modelValue', null)
      return
    }
    try {
      const parsed = JSON.parse(val)
      emit('update:modelValue', parsed)
    } catch (e: any) {
      errorMessage.value = e.message
    }
  })

  const formatJson = () => {
    if (!localValue.value) {
      errorMessage.value = '请先输入JSON数据'
      return
    }
    try {
      const parsed = JSON.parse(localValue.value)
      localValue.value = JSON.stringify(parsed, null, 2)
      emit('update:modelValue', parsed)
      errorMessage.value = '格式化成功'
    } catch (e: any) {
      errorMessage.value = 'JSON格式错误: ' + e.message
    }
  }

  const compactJson = () => {
    if (!localValue.value) {
      errorMessage.value = '请先输入JSON数据'
      return
    }
    try {
      const parsed = JSON.parse(localValue.value)
      localValue.value = JSON.stringify(parsed)
      emit('update:modelValue', parsed)
      errorMessage.value = '压缩成功'
    } catch (e: any) {
      errorMessage.value = 'JSON格式错误: ' + e.message
    }
  }

  const clearJson = () => {
    localValue.value = ''
    emit('update:modelValue', null)
    errorMessage.value = ''
  }

  const validateJson = () => {
    if (!localValue.value) {
      errorMessage.value = '请输入JSON数据'
      return
    }
    try {
      JSON.parse(localValue.value)
      errorMessage.value = 'JSON格式正确'
    } catch (e: any) {
      errorMessage.value = 'JSON格式错误: ' + e.message
    }
  }

  const handleTreeUpdate = (data: any) => {
    localValue.value = JSON.stringify(data, null, 2)
    emit('update:modelValue', data)
  }
</script>

<style scoped>
  .wn-json-editor :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .json-tree-container {
    background: #fafafa;
  }
</style>
