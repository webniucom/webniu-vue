<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'groupinsert' ? '添加分组' : '编辑分组'"
    width="30%"
    align-center
    class="wn-dialog"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="分组名称" prop="label">
        <ElInput v-model="formData.label" placeholder="请输入分组名称" />
      </ElFormItem>
      <ElFormItem label="分组标识" prop="value">
        <ElInput v-model="formData.value" placeholder="请输入分组标识" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { GroupItem } from './dict-types'

  interface Props {
    visible: boolean
    type: string
    editData?: Partial<GroupItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: GroupItem): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<GroupItem>({
    id: 0,
    value: '',
    label: ''
  })

  // 表单验证规则
  const rules: FormRules = {
    label: [
      { required: true, message: '请输入分组名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    value: [
      { required: true, message: '请输入分组标识', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
        message: '分组标识必须是英文开头或者是下划线',
        trigger: 'blur'
      }
    ]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.editData !== undefined
    const row = props.editData
    Object.assign(formData, {
      id: isEdit && row ? row.id || '' : '',
      value: isEdit && row ? row.value || '' : '',
      label: isEdit && row ? row.label || '' : ''
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.editData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        dialogVisible.value = false
        emit('submit', formData)
      }
    })
  }
</script>
<style scoped>
  :global(.wn-dialog .el-dialog__body) {
    padding: 10px 10px 10px 0px !important;
  }
</style>
