<template>
  <ElDialog
    :title="title || '选择权限'"
    v-model="dialogVisible"
    align-center
    width="700"
    class="wn-custom-select-dialog"
    draggable
    :fullscreen="isFullscreen"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ title || '请选择' }}</span>
        <div class="dialog-header-actions">
          <div
            class="size-7.5 flex items-center justify-center cursor-pointer rounded-md dark:bg-g-300/40 text-g-700 hover:bg-g-300 md:ml-0"
            @click="toggleFullscreen"
          >
            <ArtSvgIcon v-if="!isFullscreen" icon="ri:fullscreen-line" class="text-g-600" />
            <ArtSvgIcon v-else icon="ri:fullscreen-exit-line" class="text-g-600" />
          </div>
        </div>
      </div>
    </template>
    <template #default>
      <div class="dialog-content common-layout">
        <el-container>
          <el-header class="pr-0! pl-0! pb-1.5! h-auto!">
            <ElInput
              v-model="filterText"
              :prefix-icon="Search"
              placeholder="请输入关键词"
              clearable
              tooltip
            />
          </el-header>
          <el-container>
            <div class="flex gap-4" style="width: 100%">
              <div
                class="flex-1 pt-0! pb-0! pl-0! pr-0! wn-custom-select-tree"
                v-if="!multiple && !showCheckbox"
              >
                <ElCard shadow="never" class="art-table-card content-card-custom">
                  <template #header>
                    <div class="card-header"> 选择类型 </div>
                  </template>
                  <template #default>
                    <ElScrollbar :height="isFullscreen ? 'calc(100vh - 230px)' : '300px'">
                      <el-tree
                        ref="treeRef"
                        class="filter-tree"
                        :data="filteredData"
                        :props="defaultProps"
                        :default-expand-all="true"
                        :filter-node-method="filterNode"
                        node-key="id"
                        :show-checkbox="showCheckbox || false"
                        :multiple="multiple || false"
                        :check-strictly="checkStrictly || false"
                        :checked-keys="{ checked: currentModelCheckedIds, halfChecked: [] }"
                        :render-after-expand="false"
                        @check-change="handleCheckChange"
                        @node-click="handleNodeClick"
                        :highlight-current="true"
                      />
                    </ElScrollbar>
                  </template>
                </ElCard>
              </div>
              <div class="flex-1 pt-0! pb-0! pl-0! pr-0! wn-custom-select-tree" v-else>
                <ElCard shadow="never" class="art-table-card content-card-custom">
                  <template #header v-if="props.screen">
                    <div class="card-header">
                      <span style="width: 80px; display: inline-block">筛选类型</span>
                      <el-select
                        v-model="modelValue"
                        placeholder="Select"
                        style="width: 100%"
                        size="small"
                      >
                        <el-option
                          v-for="item in options"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </div>
                  </template>
                  <template #default>
                    <ElScrollbar :height="isFullscreen ? 'calc(100vh - 230px)' : '300px'">
                      <el-tree
                        ref="treeRef"
                        class="filter-tree"
                        :data="filteredData"
                        :props="defaultProps"
                        :default-expand-all="false"
                        :filter-node-method="filterNode"
                        :node-key="nodeKey || 'id'"
                        :show-checkbox="showCheckbox || false"
                        :multiple="multiple || false"
                        :check-strictly="checkStrictly || false"
                        :checked-keys="{ checked: currentModelCheckedIds, halfChecked: [] }"
                        :render-after-expand="false"
                        @check-change="handleCheckChange"
                        @node-click="handleNodeClick"
                        :highlight-current="true"
                      />
                    </ElScrollbar>
                  </template>
                </ElCard>
              </div>
              <div style="width: 200px" v-if="multiple || showCheckbox">
                <ElCard shadow="never" class="art-table-card wn-cardaside">
                  <template #header>
                    <div class="card-header">
                      <span>已选{{ selectedIds.length }}项</span>
                      <ElButton type="primary" @click="handleGetChecked" size="small"
                        >清空</ElButton
                      >
                    </div>
                  </template>
                  <template #default>
                    <ElScrollbar
                      :height="
                        isFullscreen ? 'calc(100vh - 240px)' : props.screen ? '340px' : '290px'
                      "
                    >
                      <div v-if="selectedItems.length === 0" class="text-center text-g-400 py-8">
                        暂无选中数据
                      </div>
                      <div
                        v-for="item in selectedItems"
                        :key="item.id"
                        class="flex items-center justify-between p-2.5 mb-0 bg-g-50 rounded cursor-pointer hover:bg-g-100"
                      >
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-g-800 truncate">{{
                            getNodeLabel(item)
                          }}</div>
                          <div class="text-xs text-g-400">ID: {{ item.id }}</div>
                        </div>
                        <ElIcon
                          class="text-g-400 hover:text-red-500 transition-colors ml-2"
                          :class="{ 'cursor-not-allowed opacity-50': item.disabled }"
                          @click="handleRemoveItem(item)"
                        >
                          <Delete />
                        </ElIcon>
                      </div>
                    </ElScrollbar>
                  </template>
                </ElCard>
              </div>
            </div>
          </el-container>
        </el-container>
      </div>
    </template>
    <template #footer>
      <div class="footer-container">
        <span class="text-sm text-g-600" v-if="multiple || showCheckbox"
          >当前已选择 {{ selectedIds.length }} 项</span
        >
        <span class="text-sm text-g-600" v-else
          >当前已选择：{{ selectedItems.length > 0 ? getNodeLabel(selectedItems[0]) : '无' }}</span
        >
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">提交</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, watch, nextTick, ref } from 'vue'
  import { Search, Delete } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import type { FilterNodeMethodFunction, TreeInstance } from 'element-plus'

  interface Props {
    visible?: boolean
    type?: string
    title?: string
    data?: any[]
    screen?: boolean
    selected?: any[]
    multiple?: boolean
    checkStrictly?: boolean
    showCheckbox?: boolean
    nodeKey?: string
    props?: {
      label?: string
      value?: string
      children?: string
    }
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any[]): void
  }

  interface Tree {
    [key: string]: any
  }

  interface TreeNode {
    id: number | string
    label?: string
    children?: TreeNode[]
    [key: string]: any
  }

  const defaultProps = computed(() => ({
    children: props.props?.children || 'children',
    label: props.props?.label || 'label',
    value: props.props?.value || 'id'
  }))

  // 获取节点的标签值（支持自定义字段）
  const getNodeLabel = (node: TreeNode): string => {
    return node[defaultProps.value.label] || ''
  }

  const filterText = ref('')
  const props = withDefaults(defineProps<Props>(), {
    multiple: false,
    showCheckbox: false,
    checkStrictly: false,
    screen: false
  })
  const emit = defineEmits<Emits>()
  const title = computed(() => props.title)
  const treeRef = ref<TreeInstance>()
  // 选项卡切换
  const modelValue = ref('webniu')

  // 根据 modelValue 过滤当前显示的数据
  const filteredData = computed(() => {
    if (!props.data) return []
    // 如果 screen 为 false，直接返回所有数据，不按 model 过滤
    if (!props.screen) return props.data
    return props.data.filter((item) => item.model === modelValue.value)
  })
  const options = [
    {
      value: 'webniu',
      label: '网牛引擎'
    },
    {
      value: 'wechat',
      label: '微信公众号'
    },
    {
      value: 'wxapp',
      label: '微信小程序'
    },
    {
      value: 'work',
      label: '企业微信'
    },
    {
      value: 'aliapp',
      label: '支付宝平台'
    },
    {
      value: 'douyin',
      label: '抖音平台'
    },
    {
      value: 'aliapp',
      label: '快手平台'
    }
  ]

  // 全屏状态
  const isFullscreen = ref(false)

  // 选中的权限ID数组（保持与父组件传入格式一致：纯ID数组）
  const selectedIds = ref<(number | string)[]>([...(props.selected || [])])

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 切换全屏
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
  }

  /**
   * 获取扁平化的所有树节点（递归展开）
   */
  const getAllNodes = (data: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        result.push(node)
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    traverse(data)
    return result
  }

  // 当前 model 中已选中的 ID（用于树的勾选状态）
  const currentModelCheckedIds = computed(() => {
    if (!props.data || selectedIds.value.length === 0) return []
    // 如果 screen 为 false，返回所有选中的 ID
    if (!props.screen) return selectedIds.value
    const allNodes = getAllNodes(props.data)
    return selectedIds.value.filter((id) => {
      const node = allNodes.find((n) => n.id === id)
      return node && node.model === modelValue.value
    })
  })

  /**
   * 已选中的完整节点对象（用于右侧展示）
   */
  const selectedItems = computed(() => {
    if (!props.data || selectedIds.value.length === 0) return []

    const allNodes = getAllNodes(props.data)
    return selectedIds.value
      .map((id) => allNodes.find((node) => node.id === id))
      .filter((item): item is TreeNode => item !== undefined)
  })

  /**
   * 节点点击事件（用于单选模式）
   */
  const handleNodeClick = (data: TreeNode) => {
    if (!props.multiple && !props.showCheckbox) {
      // 单选模式：直接替换为当前选中项
      selectedIds.value = [data.id]

      // 高亮当前节点
      nextTick(() => {
        if (treeRef.value) {
          treeRef.value.setCurrentKey(data.id)
        }
      })
    }
  }

  /**
   * 树节点勾选变化处理
   */
  const handleCheckChange = (data: TreeNode, checked: boolean) => {
    if (!props.multiple) {
      // 单选模式下，只允许选择一个
      if (checked) {
        selectedIds.value = [data.id]
      } else {
        selectedIds.value = []
      }
    } else {
      // 多选模式
      if (checked) {
        if (!selectedIds.value.includes(data.id)) {
          selectedIds.value.push(data.id)
        }
      } else {
        selectedIds.value = selectedIds.value.filter((id) => id !== data.id)
      }
    }
  }

  /**
   * 删除单个已选项
   */
  const handleRemoveItem = (item: TreeNode) => {
    if (item.disabled) {
      ElMessage.warning('该选项无法删除')
      return
    }
    selectedIds.value = selectedIds.value.filter((itemId) => itemId !== item.id)

    // 同步更新树的勾选状态
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.setChecked(item.id, false, true)
      }
    })
  }

  /**
   * 清空所有已选
   */
  const handleGetChecked = () => {
    selectedIds.value = []

    // 同步更新树的勾选状态
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.setCheckedKeys([])
      }
    })
  }

  /**
   * 初始化表单数据
   */
  const initFormData = () => {
    isFullscreen.value = false
    // 初始化选中状态为父组件传入的值
    selectedIds.value = [...(props.selected || [])]
    // 同步树的状态
    nextTick(() => {
      if (treeRef.value) {
        if (props.showCheckbox) {
          // 复选框模式：只勾选当前 model 中的数据
          treeRef.value.setCheckedKeys(currentModelCheckedIds.value)
        } else {
          // 单选高亮模式
          if (props.selected && props.selected.length > 0) {
            treeRef.value.setCurrentKey(props.selected[0])
          }
        }
      }
    })
  }

  /**
   * 过滤节点方法
   */
  const filterNode: FilterNodeMethodFunction = (value: string, data: Tree) => {
    if (!value) return true
    return data[defaultProps.value.label]?.includes(value)
  }

  /**
   * 关闭对话框时触发
   */
  const handleClosed = () => {
    initFormData()
  }

  /**
   * 监听对话框状态变化
   */
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        initFormData()
      }
    },
    { immediate: true }
  )

  //监听筛选类型变化
  watch(modelValue, (val) => {
    nextTick(() => {
      console.log(val)
      if (treeRef.value && props.showCheckbox) {
        treeRef.value.setCheckedKeys(currentModelCheckedIds.value)
      }
    })
  })

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    emit('submit', [...selectedIds.value])
  }

  watch(filterText, (val) => {
    treeRef.value!.filter(val)
  })

  // 监听父组件 selected 变化
  watch(
    () => props.selected,
    (newSelected) => {
      if (newSelected) {
        selectedIds.value = [...newSelected]
      }
    },
    { deep: true }
  )
</script>
<style scoped>
  :global(.wn-custom-select-dialog .el-dialog__header) {
    margin-bottom: 0px !important;
  }
  :global(.wn-custom-select-dialog .el-dialog__body) {
    padding: 0px 0px 5px 0px !important;
  }
  .wn-custom-select-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .wn-custom-select-dialog .options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.w-e-text-placeholder) {
    top: 0px !important;
  }
  :global(.w-e-text-container p) {
    margin: 5px 0px !important;
  }
  :deep(.wn-cardaside .el-card__body) {
    padding: 0px !important;
  }
  :deep(.wn-cardaside .el-card__header) {
    padding: 12px 8px !important;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .footer-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .dialog-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    font-size: 18px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    transition: color 0.3s;
  }

  .header-icon:hover {
    color: var(--el-color-primary);
  }

  .is-fullscreen {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
  }

  .is-fullscreen :deep(.el-dialog__body) {
    height: calc(100vh - 120px);
    overflow: auto;
  }
  /* 禁止文本选择，防止快速点击时出现蓝色选框 */
  :deep(*) {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  :deep(.content-card-custom .el-card__header) {
    padding: 12px !important;
  }
</style>
