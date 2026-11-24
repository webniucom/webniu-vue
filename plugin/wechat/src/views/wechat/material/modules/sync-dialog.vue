<template>
  <ElDialog
    v-model="visible"
    :title="'同步' + typeLabel + '素材'"
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
          :max="20"
          :step="1"
          :disabled="syncing"
          controls-position="right"
          class="sync-input"
        />
        <span class="sync-unit">条（微信官方上限 20）</span>
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
    /** 当前素材分组：image/video/voice */
    type: 'image' | 'video' | 'voice'
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

  const typeLabel = computed(() =>
    props.type === 'image' ? '图片' : props.type === 'video' ? '视频' : '语音'
  )

  const batchSize = ref(20)
  const syncing = ref(false)
  const finished = ref(false)
  const stopped = ref(false)
  const inserted = ref(0)
  const updated = ref(0)
  const syncedCount = ref(0)
  const total = ref(0)
  const processed = ref(0)

  // 进度条：用后端返回的累计 processed / total 计算
  const percentage = computed(() => {
    if (finished.value) return 100
    if (total.value > 0) {
      return Math.min(99, Math.round((processed.value / total.value) * 100))
    }
    return 0
  })
  const indeterminate = computed(() => syncing.value && total.value === 0)
  const progressStatus = computed(() => (finished.value ? 'success' : ''))

  const statusText = computed(() => {
    const stat = `已同步 ${syncedCount.value} 条（新增 ${inserted.value}，更新 ${updated.value}）`
    if (syncing.value) return `同步中… ${stat}`
    if (finished.value) return `同步完成，${stat}`
    if (stopped.value) return `已停止，${stat}，可点击继续`
    return `点击开始同步${typeLabel.value}素材`
  })
  const statusClass = computed(() => ({
    'is-syncing': syncing.value,
    'is-done': finished.value,
    'is-stopped': stopped.value
  }))

  /**
   * 开始/继续同步
   * - 第一次：reset=1，强制从 0 开始（后端删 test 假数据 + 清断点 + 重来）
   * - 继续（stopped）：不传 reset，后端从 options 读断点接着跑
   *
   * 分页：上一批返回 skip 作为下一批 offset（粉丝 skip=offset）。
   */
  const startSync = async () => {
    if (syncing.value) return
    // 非继续状态：重置本次会话累计
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

    let offset = 0
    // 继续（stopped）→ 不传 reset，后端读断点接着跑
    // 非继续 → 第一包 reset=1 重来；后面包 reset=0 保持分页递增
    let reqReset = stopped.value ? 0 : 1

    try {
      while (syncing.value) {
        const res: any = await get(props.apiUrl, {
          type: props.type,
          batch_size: batchSize.value,
          offset,
          reset: reqReset
        })
        if (!syncing.value) break

        inserted.value += Number(res.inserted) || 0
        updated.value += Number(res.updated) || 0
        syncedCount.value += Number(res.batch_total) || 0
        if (res.total) total.value = Number(res.total)
        if (res.processed !== undefined) processed.value = Number(res.processed)
        offset = Number(res.skip) || 0
        // 从第 2 包开始就不再 reset，按后端返回的 skip 顺序翻页
        reqReset = 0

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
   * 后端 options 会保留断点，下次 startSync 接着跑
   */
  const stopSync = () => {
    syncing.value = false
    stopped.value = true
    ElMessage.info('已停止，进度已保存，可稍后继续')
  }

  /**
   * 对话框关闭：重置本地状态（断点还在后端 options，再打开选「继续」可恢复）
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
    font-size: 12px;
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
