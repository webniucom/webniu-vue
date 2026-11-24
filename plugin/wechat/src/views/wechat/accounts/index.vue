<template>
  <div class="user-page art-full-height">
    <el-splitter lazy class="wn-splitter">
      <el-splitter-panel class="art-full-height">
        <Search
          v-model="searchForm"
          @search="handleSearch"
          @reset="resetSearchParams"
        ></Search>
        <ElCard class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader
            v-model:columns="columnChecks"
            :layout="layout"
            :loading="loading"
            @refresh="refreshData"
          >
            <template #left>
              <ElSpace wrap>
                <ElButton
                  v-if="canCreate"
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  v-ripple
                  @click="showDialog('insert')"
                  >创建账户</ElButton
                >
              </ElSpace>
            </template>
          </ArtTableHeader>
       <!-- 表格 -->
          <ArtTable
            rowKey="id"
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
          <!-- 创建/编辑账户 -->
          <Dialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :edit-data="currentData"
            @success="getData"
          />
        </ElCard>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { toAdminApiUrl } from '@admin/core/utils/controller'
  import { useWnTable } from '@admin/core/table/useWnTable'
  import { get, del } from '@admin/core/request'
  import { ElTag, ElImage, ElMessage, ElMessageBox } from 'element-plus'
  import { useUserStore } from '@stores/modules/user'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'
  import { wxImgUrl } from '@/utils/wximg'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'

  const route = useRoute()
  const userStore = useUserStore()
  const url = toAdminApiUrl(route.meta.key as string)
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'

  const layout = ref('refresh')
  // 创建账户弹窗
  const dialogVisible = ref(false)
  const dialogType = ref<'insert' | 'update'>('insert')
  const currentData = ref<any>()
  // 当前登录账户ID：不能删除自己
  const currentAdminId = computed(() => Number(userStore.getUserInfo?.info?.id || 0))
  // 当前登录账户是否超管：超管可删除任意非超管账户
  const isSuperUser = computed(() => !!userStore.getUserInfo?.isSuperAdmin)
  // 非超管创建的子账户不允许再创建账户
  const canCreate = ref(true)
  const loadPerm = async () => {
    try {
      const res: any = await get(url + '/perm')
      canCreate.value = !!res?.can_create
    } catch {
      canCreate.value = true
    }
  }
  onMounted(loadPerm)
  // 搜索参数
  const searchForm = ref<any>({ username: '', nickname: '' })

  const fetchGetList = (params: any) => get(SELECT_API, params)

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams,
    refreshData
  } = useWnTable<any>({
    core: {
      immediate: true,
      apiFn: fetchGetList,
      apiParams: {
        order: 'desc',
        field: 'id'
      },
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        {
          prop: 'id',
          label: 'ID',
          align: 'left',
          width: 80
        },
        {
          prop: 'avatar',
          label: '头像',
          align: 'left',
          width: 80,
          formatter: (row: any) => {
            const avatar = wxImgUrl(row.avatar) || '/app/webniu/images/avatar.png'
            return h(ElImage, {
              class: 'w-10 h-10 rounded-md flex! items-center justify-center',
              src: avatar,
              previewSrcList: [avatar],
              // 图片预览是否插入至 body 元素上，用于解决表格内部图片预览样式异常
              previewTeleported: true
            })
          }
        },
        {
          prop: 'username',
          label: '账号',
          align: 'left',
          minWidth: 130
        },
        {
          prop: 'nickname',
          label: '昵称',
          align: 'left',
          minWidth: 120,
          showOverflowTooltip: true
        },
        {
          prop: 'applist',
          label: '绑定公众号',
          align: 'left',
          minWidth: 220,
          formatter: (row: any) => {
            const list: string[] = row.applist || []
            if (!list.length) return '-'
            return h(
              'div',
              { class: 'flex flex-wrap gap-1' },
              list.map((name) => h(ElTag, { type: 'success', size: 'small' }, () => name))
            )
          }
        },
        {
          prop: 'appcount',
          label: '公众号数',
          align: 'left',
          width: 100,
          formatter: (row: any) => `${row.appcount || 0}`
        },
        {
          prop: 'status',
          label: '状态',
          align: 'left',
          width: 90,
          formatter: (row: any) => {
            return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'created_at',
          label: '创建时间',
          align: 'left',
          width: 170
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          align: 'right',
          width: 120,
          formatter: (row: any) => {
            const buttons: any[] = [
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                onClick: () => showDialog('update', row)
              })
            ]
            // 不能删除自己、不能删除超管账户；超管可删任意非超管账户，其他账户只能删自己创建的
            const canDelete =
              Number(row.id) !== currentAdminId.value &&
              !row.is_super &&
              (isSuperUser.value || Number(row.admin_id || 0) === currentAdminId.value)
            if (canDelete) {
              buttons.push(
                h(ArtButtonTable, {
                  type: 'delete',
                  vAuth: 'delete',
                  class: '!mr-0',
                  onClick: () => deleteItem(row)
                })
              )
            }
            return h('div', { style: 'text-align: right' }, buttons)
          }
        }
      ]
    },
    transform: {
      dataTransformer: (records: any) => records
    }
  })

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }

  // 打开创建/编辑弹窗
  const showDialog = (type: 'insert' | 'update', row?: any) => {
    dialogType.value = type
    currentData.value = row
    dialogVisible.value = true
  }

  // 删除账户
  const deleteItem = async (row: any) => {
    ElMessageBox.confirm(`确定删除账户「${row.username}」吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: row.id })
        ElMessage.success('删除成功')
        getData()
      })
      .catch(() => {
        return
      })
  }
</script>
<style scoped>
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
