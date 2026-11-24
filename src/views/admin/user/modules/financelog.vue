<template>
  <ElDrawer v-model="visible" title="余额/积分变动记录" size="760px" @open="loadData">
    <div class="mb-3 flex items-center gap-3">
      <span class="text-sm text-gray-500">
        会员 #{{ uid }}
      </span>
      <ElSelect v-model="type" style="width: 130px" @change="handleSearch">
        <ElOption label="全部类型" :value="0" />
        <ElOption label="余额" :value="1" />
        <ElOption label="积分" :value="2" />
      </ElSelect>
      <ElButton :loading="loading" @click="loadData">刷新</ElButton>
    </div>
    <ElTable v-loading="loading" :data="list" border stripe>
      <ElTableColumn prop="created_at" label="时间" width="160" />
      <ElTableColumn label="类型" width="70" align="center">
        <template #default="{ row }">
          <ElTag :type="row.type === 1 ? 'warning' : 'success'" size="small">
            {{ row.type === 1 ? '余额' : '积分' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="变动" width="100" align="right">
        <template #default="{ row }">
          <span :class="Number(row.change) > 0 ? 'text-green-600' : 'text-red-500'">
            {{ Number(row.change) > 0 ? '+' : '' }}{{ row.change }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="before" label="变动前" width="90" align="right" />
      <ElTableColumn prop="after" label="变动后" width="90" align="right" />
      <ElTableColumn prop="remark" label="备注" min-width="130" show-overflow-tooltip />
      <ElTableColumn label="来源" width="90">
        <template #default="{ row }">
          {{ sourceText(row.source) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="operator_id" label="操作人ID" width="90" align="center" />
    </ElTable>
    <div class="mt-3 flex justify-end">
      <ElPagination
        v-model:current-page="page"
        :page-size="limit"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { get } from '@/api/common-request'

  interface Props {
    visible: boolean
    uid: number
    api: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

  const visible = computed({
    get: () => props.visible,
    set: (val: boolean) => emit('update:visible', val)
  })

  const loading = ref(false)
  const list = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const type = ref(0)

  const sourceText = (source: string) => {
    const map: Record<string, string> = {
      admin: '后台充值',
      lottery: '抽奖中奖',
      system: '系统'
    }
    return map[source] || source || '-'
  }

  const handleSearch = () => {
    page.value = 1
    loadData()
  }

  const loadData = async () => {
    if (!props.uid) return
    loading.value = true
    try {
      const res: any = await get(`${props.api}/rechargelogs`, {
        uid: props.uid,
        type: type.value,
        page: page.value,
        limit: limit.value
      })
      list.value = res?.data || []
      total.value = res?.total || 0
    } catch {
      // 错误提示由 http 拦截器统一处理
    } finally {
      loading.value = false
    }
  }
</script>
