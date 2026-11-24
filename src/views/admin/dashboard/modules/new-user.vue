<template>
  <div class="art-card p-5 h-128 overflow-hidden mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>登录日志</h4>
        <p>login logs</p>
      </div>
    </div>
    <ArtTable
      ref="tableRef"
      rowKey="id"
      class="wn-art-table"
      :loading="loading"
      :data="data"
      :columns="columns"
      :pagination="pagination"
      :pagination-options="{ layout: 'prev, pager, next' }"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      :default-expand-all="false"
      @pagination:size-change="handleSizeChange"
      @pagination:current-change="handleCurrentChange"
    >
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { get } from '@/api/common-request'

  defineOptions({ name: 'NewUser' })

  const SELECT_API = '/webniu/admin/logtime/select'
  //加载数据列表
  const fetchGetList = (params: any) => {
    return get(SELECT_API, params)
  }
  const { columns, data, loading, pagination, getData, handleSizeChange, handleCurrentChange } =
    useTable<any>({
      // 核心配置
      core: {
        // 是否立即加载数据（设为false，由分组加载完成后触发）
        immediate: false,
        apiFn: fetchGetList,
        apiParams: {
          order: 'desc',
          field: 'id',
          page: 1,
          limit: 8
        },
        // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
        paginationKey: {
          current: 'page',
          size: 'limit'
        },
        columnsFactory: () => [
          {
            label: '账户',
            prop: 'username'
          },
          {
            label: '昵称',
            prop: 'nickname'
          },
          {
            label: 'IP',
            prop: 'user_ip'
          },
          {
            label: '代理',
            prop: 'user_agent',
            align: 'left',
            showOverflowTooltip: true
          },
          {
            label: '操作系统',
            prop: 'user_os',
            align: 'left',
            showOverflowTooltip: true
          },
          {
            label: '浏览器',
            prop: 'user_browser',
            align: 'left',
            showOverflowTooltip: true
          },
          {
            label: '日志时间',
            prop: 'created_at',
            align: 'left',
            showOverflowTooltip: true
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

  onMounted(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .art-card {
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: var(--el-color-primary) !important;
      background: transparent !important;
    }
  }
  :deep(.wn-art-table .el-table--default) {
    margin-top: 0px !important;
  }
</style>
