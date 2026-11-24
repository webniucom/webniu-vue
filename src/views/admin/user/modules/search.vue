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
      label: '会员ID',
      key: 'id',
      type: 'input',
      props: {
        placeholder: '请输入会员ID',
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
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
    },
    {
      label: '等级',
      key: 'level',
      type: 'input',
      props: {
        placeholder: '请输入等级',
        clearable: true,
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '注册时间',
      key: 'join_time',
      type: 'datetime',
      props: {
        placeholder: '请选择注册时间',
        clearable: true,
        type: 'datetimerange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        rangeSeparator: '至',
        startPlaceholder: '开始日期时间',
        endPlaceholder: '结束日期时间',
        onClear: () => {
          handleSearch(formData.value)
        }
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          {
            label: '启用',
            value: 1
          },
          {
            label: '禁用',
            value: 0
          }
        ],
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
