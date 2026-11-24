<template>
  <div class="user-page art-full-height" v-loading="loadings">
    <el-splitter>
      <el-splitter-panel class="art-full-height">
        <Search v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></Search>
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
                  v-auth="'insert'"
                  type="primary"
                  class="h-8!"
                  @click="showDialog('insert')"
                  v-ripple
                  >新增{{ config.title }}</ElButton
                >
                <ElButton
                  v-if="selectedRows.length > 0"
                  v-auth="'delete'"
                  type="danger"
                  class="h-8!"
                  @click="allDelete"
                  v-ripple
                  plain
                  >删除{{ config.title }}</ElButton
                >
              </ElSpace>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable
            ref="tableRef"
            rowKey="id"
            :loading="loading"
            :data="data"
            :columns="columns"
            :pagination="pagination"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            :default-expand-all="false"
            @selection-change="handleSelectionChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          >
          </ArtTable>
          <!-- 配置弹窗 -->
          <Dialog
            v-model:visible="dialogVisible"
            :type="dialogType"
            :editData="currentData"
            :title="config.title"
            :data="data"
            :loading="loading"
            @submit="handleSubmit"
          />
        </ElCard>
        <ElDialog
          v-model="testVisible"
          title="测试短信"
          width="500"
          class="smsdialog"
          body-class="dialog-body"
          align-center
        >
          <ArtForm
            ref="testFormRef"
            v-model="testFormData"
            :items="testFormItems"
            label-width="100px"
            :show-reset="false"
            :show-submit="false"
          >
            <template #jsondata>
              <ElInput
                v-model="testFormData.jsondata"
                type="textarea"
                placeholder="请输入JSON数据"
                :rows="4"
                @blur="validateProps"
              />
            </template>
          </ArtForm>
          <template #footer>
            <div class="dialog-footer">
              <ElButton @click="testVisible = false">取消</ElButton>
              <ElButton type="primary" @click="testSubmit">提交</ElButton>
            </div>
          </template>
        </ElDialog>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { convertControllerToUrl } from '@/utils/controller'
  import { useTable } from '@/hooks/core/useTable'
  import { get, post, del } from '@/api/common-request'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import Search from './modules/search.vue'
  import Dialog from './modules/dialog.vue'
  import ArtButtonTable from '@admin/forms/art-button-table/index.vue'

  defineOptions({ name: 'SmsTemp' })
  // 路由参数
  const route = useRoute()
  const worktabStore = useWorktabStore()
  const tab = worktabStore.getTabTitle(route.path)
  const url = convertControllerToUrl(tab?.key as string)

  const loadings = ref(false)
  const UPDATE_API = url + '/update'
  const INSERT_API = url + '/insert'
  const SELECT_API = url + '/select'
  const DELETE_API = url + '/delete'
  // config
  const config = ref<any>({
    title: '模板',
    layout: 'refresh',
    url: url
  })
  const selectedRows = ref<any>([])
  // 测试短信弹窗
  const testVisible = ref(false)
  const testFormData = ref<any>({
    sign: '',
    phone_number: '',
    template_id: '',
    jsondata: ''
  })
  const testFormItems = computed(() => [
    {
      label: '签名',
      key: 'sign',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入签名',
        clearable: true,
        tooltip: true,
        disabled: true
      }
    },
    {
      label: '模板ID',
      key: 'template_id',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入模板ID',
        clearable: true,
        tooltip: true,
        disabled: true
      }
    },
    {
      label: '手机号',
      key: 'phone_number',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入手机号',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入手机号',
          trigger: 'blur'
        }
      ]
    },
    {
      label: 'JSON数据',
      key: 'jsondata',
      type: 'input',
      span: 24,
      props: {
        placeholder: '请输入JSON数据',
        clearable: true,
        tooltip: true
      },
      rules: [
        {
          required: true,
          message: '请输入JSON数据',
          trigger: 'blur'
        }
      ]
    }
  ])
  // 搜索参数
  const searchForm = ref<any>({
    name: '',
    template_id: '',
    sign: ''
  })
  const layout = ref('refresh')
  // 弹窗参数
  const dialogVisible = ref(false)
  const dialogType = ref('insert')
  const currentData = ref<any>()

  //加载数据列表
  const fetchGetList = (params: any) => {
    return get(SELECT_API, params)
  }
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    refreshUpdate,
    handleSizeChange,
    handleCurrentChange,
    replaceSearchParams,
    resetSearchParams,
    refreshData
    //resetColumns
  } = useTable<any>({
    // 核心配置
    core: {
      // 是否立即加载数据（设为false，由分组加载完成后触发）
      immediate: false,
      apiFn: fetchGetList,
      apiParams: {
        order: 'asc',
        field: 'sort'
      },
      // 自定义分页数据映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      paginationKey: {
        current: 'page',
        size: 'limit'
      },
      columnsFactory: () => [
        { type: 'selection' },
        {
          label: '名称',
          prop: 'name'
        },
        {
          label: '模板ID',
          prop: 'template_id'
        },
        {
          label: '签名',
          prop: 'sign'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          align: 'left',
          formatter: (row: any) => {
            return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
              row.status === 1 ? '启用' : '禁用'
            )
          }
        },
        {
          prop: 'operation',
          label: '操作',
          fixed: 'right',
          width: 180,
          align: 'right',
          formatter: (row: any) =>
            h('div', { style: 'text-align: right' }, [
              h(ArtButtonTable, {
                type: 'view',
                vAuth: 'test',
                icon: 'ri:send-plane-line',
                onClick: () => testsms(row)
              }),
              h(ArtButtonTable, {
                type: 'edit',
                vAuth: 'update',
                onClick: () => showDialog('update', row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                vAuth: 'delete',
                class: '!mr-0',
                onClick: () => deleteItem(row)
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
  // 打开弹窗添加or编辑（新增时给 switch 字段一个合法的默认值，否则 undefined 不是 active/inactive 值，ElSwitch 会告警）
  const showDialog = (type: string, row?: any): void => {
    dialogType.value = type
    currentData.value = row || { status: 1 }
    dialogVisible.value = true
  }
  // 删除单条数据
  const deleteItem = async (row: any) => {
    ElMessageBox.confirm(`确定要删除选中的数据吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: row.id })
        ElMessage.success('删除成功')
        refreshUpdate()
      })
      .catch(() => {
        return
      })
  }
  // 删除多个数据
  const allDelete = async () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请选择要删除的数据')
      return
    }
    ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个数据吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await del(DELETE_API, { id: selectedRows.value.map((item: any) => item.id) })
        ElMessage.success('删除成功')
        refreshUpdate()
      })
      .catch(() => {
        return
      })
  }
  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: any) => {
    replaceSearchParams(params)
    getData()
  }
  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: any): void => {
    selectedRows.value = selection
  }
  // 测试短信
  const testsms = async (row: any) => {
    testVisible.value = true
    testFormData.value = {
      sign: row.sign,
      phone_number: '',
      template_id: row.template_id,
      jsondata: '{"name": "网牛引擎"}'
    }
    validateProps()
  }
  // 测试短信提交
  const testSubmit = async (data: any): Promise<void> => {
    await post(url + '/test', data)
    ElMessage.success('测试成功')
    testVisible.value = false
  }
  /**
   * 验证并格式化 props JSON 内容
   */
  const validateProps = () => {
    if (!testFormData.value.jsondata) return
    try {
      const parsed = JSON.parse(testFormData.value.jsondata)
      testFormData.value.jsondata = JSON.stringify(parsed, null, 2)
    } catch {
      testFormData.value.jsondata = fixJsonFormat(testFormData.value.jsondata)
      // 验证失败会由表单验证规则显示错误提示
    }
  }

  /**
   * 自动修复 JSON 格式
   * 1. 单引号替换为双引号
   * 2. 键名用双引号包裹
   * 3. 非数字/布尔/null 的值用双引号包裹
   */
  const fixJsonFormat = (str: string): string => {
    let result = str
    // 1. 将单引号替换为双引号
    result = result.replace(/'/g, '"')
    // 2. 修复键名（如果键没有引号）
    result = result.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // 3. 修复值（数字、true、false、null 保持不变，其他加上引号）
    result = result.replace(/:\s*([^",{}[\]\d\w\n]+)(?=\s*[,}\]])/g, (match, value) => {
      const trimmed = value.trim()
      if (['true', 'false', 'null'].includes(trimmed) || !isNaN(Number(trimmed))) {
        return match
      }
      return `: "${trimmed}"`
    })
    // 4. 处理尾部逗号
    result = result.replace(/,(\s*[}\]])/g, '$1')
    return result
  }
  /**
   * 提交处理
   * @param data 数据
   */
  const handleSubmit = async (data: any): Promise<void> => {
    await post(dialogType.value === 'insert' ? INSERT_API : UPDATE_API, data)
    dialogVisible.value = false
    currentData.value = {}
    ElMessage.success(dialogType.value === 'insert' ? '添加成功' : '更新成功')
    if (dialogType.value === 'update') {
      refreshUpdate()
    } else {
      getData()
    }
  }
  // 初始化默认选中第一个分组
  onMounted(async () => {
    try {
      loadings.value = true
      //const res: IndexConfig = await fetchGetIndex()

      // 初始化表单数据
      //form.value = res.form || []

      layout.value = config.value.layout || 'refresh'
      // 初始化表格数据
      nextTick(() => {
        getData()
        loadings.value = false
      })
      // 处理成功逻辑
    } catch (error) {
      ElMessage.error('加载配置失败')
      loadings.value = false
      console.error(error)
    }
  })
</script>
<style scoped>
  :deep(.smsdialog .dialog-body) {
    padding: 0 !important;
  }
  :deep(.el-splitter-bar__dragger-horizontal:after),
  :deep(.el-splitter-bar__dragger-horizontal:before) {
    width: 0px;
  }
</style>
