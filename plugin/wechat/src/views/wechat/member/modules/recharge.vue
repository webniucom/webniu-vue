<template>
  <ElDialog
    v-model="visible"
    title="余额/积分充值"
    width="460px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm label-width="90px">
      <ElFormItem label="会员">
        <span class="text-sm">
          #{{ user?.id }} {{ user?.username || '' }}
          <span class="text-gray-400">
            （当前余额 {{ user?.money ?? 0 }} 元 / 积分 {{ user?.score ?? 0 }}）
          </span>
        </span>
      </ElFormItem>
      <ElFormItem label="充值类型">
        <ElRadioGroup v-model="form.type" @change="handleTypeChange">
          <ElRadioButton :label="1">余额</ElRadioButton>
          <ElRadioButton :label="2">积分</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="方向">
        <ElRadioGroup v-model="form.direction">
          <ElRadioButton label="add">增加</ElRadioButton>
          <ElRadioButton label="sub">扣减</ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="form.type === 1 ? '金额(元)' : '积分'">
        <ElInputNumber
          v-model="form.amount"
          :min="form.type === 1 ? 0.01 : 1"
          :precision="form.type === 1 ? 2 : 0"
          :step="form.type === 1 ? 1 : 10"
          controls-position="right"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="2"
          maxlength="100"
          show-word-limit
          placeholder="选填，如：活动奖品发放"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="submit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { post } from '@admin/core/request'
  import { ElMessage } from 'element-plus'

  interface Props {
    visible: boolean
    user?: any
    api: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }>()

  const visible = computed({
    get: () => props.visible,
    set: (val: boolean) => emit('update:visible', val)
  })

  const loading = ref(false)
  const form = ref({
    type: 1,
    direction: 'add',
    amount: 0.01 as number,
    remark: ''
  })

  const handleTypeChange = () => {
    form.value.amount = form.value.type === 1 ? 0.01 : 1
  }

  const handleClosed = () => {
    form.value = { type: 1, direction: 'add', amount: 0.01, remark: '' }
  }

  const submit = async () => {
    if (!props.user?.id) return
    const amount = Number(form.value.amount || 0)
    if (amount <= 0) {
      ElMessage.warning(form.value.type === 1 ? '请输入正确的金额' : '请输入正确的积分')
      return
    }
    const signed = form.value.direction === 'sub' ? -amount : amount
    loading.value = true
    try {
      await post(`${props.api}/recharge`, {
        id: props.user.id,
        type: form.value.type,
        amount: signed,
        remark: form.value.remark
      })
      ElMessage.success('操作成功')
      visible.value = false
      emit('success')
    } catch (error: any) {
      ElMessage.error(error?.message || '操作失败')
    } finally {
      loading.value = false
    }
  }
</script>
