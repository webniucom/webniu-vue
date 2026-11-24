<template>
  <div class="json-tree-node">
    <template v-for="(value, key) in data" :key="key">
      <div class="flex items-center gap-1 py-1">
        <!-- 展开/折叠图标 -->
        <span
          v-if="isObjectOrArray(value)"
          class="cursor-pointer"
          @click="toggleExpand(key as string)"
        >
          <span v-if="expandedKeys.includes(key as string)">▼</span>
          <span v-else>▶</span>
        </span>
        <span v-else class="w-4"></span>

        <!-- 键名 -->
        <span class="text-blue-600 font-medium">"{{ key }}":</span>

        <!-- 值 -->
        <template v-if="isObjectOrArray(value)">
          <span class="text-gray-500">{{ Array.isArray(value) ? '[' : '{' }}</span>
          <span class="text-gray-400">{{ Array.isArray(value) ? `(${value.length})` : '' }}</span>
        </template>
        <template v-else-if="typeof value === 'string'">
          <span class="text-green-600">"{{ truncate(value, 50) }}"</span>
        </template>
        <template v-else-if="typeof value === 'number'">
          <span class="text-orange-600">{{ value }}</span>
        </template>
        <template v-else-if="typeof value === 'boolean'">
          <span class="text-purple-600">{{ value }}</span>
        </template>
        <template v-else-if="value === null">
          <span class="text-gray-400">null</span>
        </template>

        <!-- 编辑按钮 -->
        <button
          class="ml-auto opacity-0 hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-blue-500"
          @click="startEdit(key as string, value)"
          >编辑</button
        >
      </div>

      <!-- 子节点 -->
      <div
        v-if="isObjectOrArray(value) && expandedKeys.includes(key as string)"
        class="pl-4 border-l-2 border-gray-200 ml-2"
      >
        <JsonTreeNode :data="value" @update="(newVal) => handleUpdate(key as string, newVal)" />
      </div>

      <!-- 编辑输入框 -->
      <div v-if="editingKey === (key as string)" class="pl-8">
        <ElInput
          v-model="editValue"
          size="small"
          @blur="finishEdit"
          @keyup.enter="finishEdit"
          class="w-64"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { ElInput } from 'element-plus'

  const props = defineProps<{
    data: Record<string, any> | any[]
  }>()

  const emit = defineEmits<{
    (e: 'update', value: any): void
  }>()

  const expandedKeys = ref<string[]>([])
  const editingKey = ref<string | null>(null)
  const editValue = ref('')

  const isObjectOrArray = (value: any) => {
    return typeof value === 'object' && value !== null
  }

  const toggleExpand = (key: string) => {
    const index = expandedKeys.value.indexOf(key)
    if (index > -1) {
      expandedKeys.value.splice(index, 1)
    } else {
      expandedKeys.value.push(key)
    }
  }

  const truncate = (str: string, length: number) => {
    return str.length > length ? str.slice(0, length) + '...' : str
  }

  const startEdit = (key: string, value: any) => {
    editingKey.value = key
    editValue.value = typeof value === 'string' ? value : JSON.stringify(value)
  }

  const finishEdit = () => {
    if (!editingKey.value) return

    let newValue: any
    try {
      newValue = JSON.parse(editValue.value)
    } catch {
      newValue = editValue.value
    }

    const newData = Array.isArray(props.data)
      ? props.data.map((item, i) => (i === Number(editingKey.value) ? newValue : item))
      : { ...props.data, [editingKey.value]: newValue }

    emit('update', newData)
    editingKey.value = null
  }

  const handleUpdate = (key: string, value: any) => {
    const newData = Array.isArray(props.data)
      ? props.data.map((item, i) => (i === Number(key) ? value : item))
      : { ...props.data, [key]: value }

    emit('update', newData)
  }
</script>

<style scoped>
  .json-tree-node {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
  }
</style>
