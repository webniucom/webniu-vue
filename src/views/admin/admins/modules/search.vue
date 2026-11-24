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
  const formItems = ref<any>([
    {
      label: '用户名',
      key: 'username',
      type: 'input',
      props: {
        placeholder: '请输入用户名',
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '昵称',
      key: 'nickname',
      type: 'input',
      props: {
        placeholder: '请输入昵称',
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      props: {
        placeholder: '请输入邮箱',
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '手机号',
      key: 'mobile',
      type: 'input',
      props: {
        placeholder: '请输入手机号',
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
