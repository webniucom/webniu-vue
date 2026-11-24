<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: any
  }
  interface Emits {
    (e: 'update:modelValue', value: any): void
    (e: 'search', params: any): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  // 表单数据双向绑定
  const searchBarRef = ref<any>()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }
  // 表单配置
  const formItems = computed(() => [
    {
      label: '日志状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 }
        ],
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    }
  ])
  // 事件
  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: any) {
    try {
      await searchBarRef.value.validate()
      emit('search', params)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }
</script>
