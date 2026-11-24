<template>
  <ElDialog
    :title="title"
    v-model="dialogVisible"
    :width="width"
    class="reply-material-dialog"
    header-class="reply-material-dialog-header"
    body-class="reply-material-dialog-body"
    align-center
    @closed="handleClosed"
  >
    <template #default>
      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        height="323"
        :data="data"
        :columns="columns"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      >
      </ArtTable>
    </template>
    <template #footer>
      <div class="reply-material-dialog-footer mt-5">
        <div>
          <el-pagination
            class="material-pagination"
            :page-size="pagination.size"
            :current-page="pagination.current"
            :total="pagination.total"
            size="small"
            background
            layout="prev, pager, next"
            @current-change="handleCurrentChange"
          />
        </div>
        <div>
          <ElButton @click="dialogVisible = false">取消</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref, onMounted } from 'vue'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get } from '@admin/core/request'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = ref('回复列表')
  const width = ref('500')

  onMounted(() => {})

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const SELECT_API = '/wechat/account/reply/select'
  //加载数据列表
  const fetchGetList = (params: any) => {
    return get(SELECT_API, params)
  }

  const { columns, data, loading, pagination, getData, handleCurrentChange } = useWnTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'desc',
        field: 'id',
        limit: 5
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        {
          label: '回复名称',
          prop: 'name',
          showOverflowTooltip: true
        },
        {
          label: '关键词',
          prop: 'content',
          showOverflowTooltip: true
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          align: 'right',
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h(ArtButtonTable, {
                type: 'add',
                vAuth: 'update',
                icon: 'ri:send-plane-line',
                class: '!mr-0 !ml-0',
                onClick: () => showDialog(row)
              })
            ])
        }
      ]
    },
    // 数据处理
    transform: {
      dataTransformer: (records: any) => {
        return records
      }
    }
  })

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {}

  /**
   * 关闭对话框时触发
   * 清空表单数据并重置验证状态
   */
  const handleClosed = () => {
    initFormData()
    nextTick(() => {})
  }

  const showDialog = (row: any) => {
    emit('submit', row)
  }
  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        initFormData()
        getData()
        nextTick(() => {})
      }
    },
    { immediate: true }
  )
</script>
<style scoped>
  :global(.reply-material-dialog-form) {
    padding: 5px 0px 0px 0px !important;
  }
  :deep(.reply-material-dialog .reply-material-dialog-header) {
    padding: 0px !important;
  }
  :global(.reply-material-dialog-form .el-form-item--default) {
    margin-bottom: 5px !important;
  }
  :global(.reply-material-dialog-body) {
    padding: 0px !important;
  }
  .reply-material-dialog-text-content {
    width: 100%;
  }
  :deep(.reply-material-dialog-header) {
    padding-bottom: 0px !important;
  }
  .reply-material-dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
</style>
