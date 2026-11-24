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
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  onMounted(async () => {})

  // 表单配置
  const formItems = computed(() => [
    {
      label: '文件名',
      key: 'name',
      type: 'input',
      placeholder: '请输入文件名',
      clearable: true
    },
    {
      label: '类型',
      key: 'ext',
      type: 'input',
      placeholder: '请输入文件类型',
      clearable: true
    },
    {
      label: '日期范围',
      key: 'created_at',
      type: 'datetime',
      props: {
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        rangeSeparator: '至',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间'
      }
    }
  ])

  // 事件
  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: any) {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>
