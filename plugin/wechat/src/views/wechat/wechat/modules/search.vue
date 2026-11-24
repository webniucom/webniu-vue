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
  // 表单配置
  const formItems = computed(() => [
    {
      label: '公众号类型',
      key: 'level',
      type: 'select',
      labelWidth: '100px',
      props: {
        placeholder: '请选择公众号类型',
        options: [
          {
            label: '订阅号',
            value: 1
          },
          {
            label: '服务号',
            value: 2
          }
        ],
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '公众号名称',
      key: 'name',
      type: 'input',
      labelWidth: '100px',
      props: {
        placeholder: '请输入公众号名称',
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
