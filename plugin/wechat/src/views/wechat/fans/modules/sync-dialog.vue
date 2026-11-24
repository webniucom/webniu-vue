<template>
  <ElDialog
    v-model="visible"
    title="同步粉丝"
    width="460px"
    align-center
    :show-close="!syncing"
    :close-on-click-modal="false"
    :close-on-press-escape="!syncing"
    body-class="sync-dialog-body"
    @closed="handleClosed"
  >
    <div class="sync-wrap">
      <div class="sync-row">
        <span class="sync-label">每页同步</span>
        <ElInputNumber
          v-model="batchSize"
          :min="1"
          :max="1000"
          :step="10"
          :disabled="syncing"
          controls-position="right"
          class="sync-input"
        />
        <span class="sync-unit">条</span>
      </div>

      <ElProgress
        :percentage="percentage"
        :indeterminate="indeterminate"
        :status="progressStatus"
        :stroke-width="14"
      />

      <div class="sync-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <template #footer>
      <ElButton v-if="syncing" type="danger" @click="stopSync">停止</ElButton>
      <template v-else>
        <ElButton @click="visible = false">关闭</ElButton>
        <ElButton type="primary" @click="startSync">
          {{ finished ? '重新同步' : stopped ? '继续同步' : '开始同步' }}
        </ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { get } from '@admin/core/request'

  interface Props {
    visible: boolean
    apiUrl: string
  }
  interface Emits {
    (e: 'update:visible', v: boolean): void
    (e: 'refresh'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const batchSize = ref(20) // 默认每页 20 条，后期可调大到 100+
  const syncing = ref(false)
  const finished = ref(false)
  const stopped = ref(false)
  const inserted = ref(0)
  const updated = ref(0)
  const syncedCount = ref(0)
  const total = ref(0) // 粉丝总数（微信接口返回）
  const processed = ref(0) // 总已处理数（含断点续传的累计，用于进度条）

  // 有 total 用精确百分比（processed 是总进度，含续传），无 total 用 indeterminate
  const percentage = computed(() => {
    if (finished.value) return 100
    if (total.value > 0) {
      return Math.min(99, Math.round((processed.value / total.value) * 100))
    }
    return 0
  })
  // 只有 total=0（真实模式未知总数）才用 indeterminate 动画
  const indeterminate = computed(() => syncing.value && total.value === 0)
  const progressStatus = computed(() => (finished.value ? 'success' : ''))

  const statusText = computed(() => {
    const stat = `已同步 ${syncedCount.value} 条（新增 ${inserted.value}，更新 ${updated.value}）`
    if (syncing.value) return `同步中... ${stat}`
    if (finished.value) return `同步完成，${stat}`
    if (stopped.value) return `已停止，${stat}，可点击继续`
    return '点击开始同步粉丝'
  })
  const statusClass = computed(() => ({
    'is-syncing': syncing.value,
    'is-done': finished.value,
    'is-stopped': stopped.value
  }))

  /**
   * 开始/继续同步
   * - 首次请求不传 cursor/skip，后端从 options 读断点续传（无断点则从头）
   * - 后续请求把上批返回的 cursor/skip 带回
   */
  const startSync = async () => {
    if (syncing.value) return
    // 重新同步清零；继续同步（stopped）保留本次会话累计
    if (!stopped.value) {
      inserted.value = 0
      updated.value = 0
      syncedCount.value = 0
      total.value = 0
      processed.value = 0
    }
    finished.value = false
    stopped.value = false
    syncing.value = true

    let cursor = ''
    let skip = 0

    try {
      while (syncing.value) {
        const res: any = await get(props.apiUrl, {
          batch_size: batchSize.value,
          cursor,
          skip
        })
        // 停止后不再累加，等退出循环
        if (!syncing.value) break

        inserted.value += Number(res.inserted) || 0
        updated.value += Number(res.updated) || 0
        syncedCount.value += Number(res.batch_total) || 0
        if (res.total) total.value = Number(res.total)
        if (res.processed !== undefined) processed.value = Number(res.processed)
        cursor = res.cursor || ''
        skip = Number(res.skip) || 0

        if (!res.has_more) {
          finished.value = true
          syncing.value = false
          ElMessage.success(`同步完成，共 ${syncedCount.value} 条`)
          emit('refresh')
          break
        }
      }
    } catch (e) {
      syncing.value = false
      stopped.value = true
      ElMessage.error('同步失败，可点击继续从断点重试')
      console.error(e)
    }
  }

  /**
   * 停止同步
   * 断点在后端 options，下次点继续可接着同步
   */
  const stopSync = () => {
    syncing.value = false
    stopped.value = true
    ElMessage.info('已停止，进度已保存，可稍后继续')
  }

  /**
   * 对话框关闭后重置本地状态
   * 后端断点不受影响，下次打开点继续仍可恢复
   */
  const handleClosed = () => {
    syncing.value = false
    finished.value = false
    stopped.value = false
    inserted.value = 0
    updated.value = 0
    syncedCount.value = 0
    total.value = 0
    processed.value = 0
  }
</script>

<style scoped>
  .sync-wrap {
    padding: 0 4px;
  }
  .sync-row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  .sync-label {
    margin-right: 10px;
    color: var(--el-text-color-regular);
  }
  .sync-input {
    flex: 1;
  }
  .sync-unit {
    margin-left: 8px;
    color: var(--el-text-color-regular);
  }
  .sync-status {
    margin-top: 16px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    min-height: 20px;
    line-height: 1.5;
  }
  .sync-status.is-syncing {
    color: var(--el-color-primary);
  }
  .sync-status.is-done {
    color: var(--el-color-success);
  }
  .sync-status.is-stopped {
    color: var(--el-color-warning);
  }
  :global(.sync-dialog-body) {
    padding: 10px !important;
  }
</style>
