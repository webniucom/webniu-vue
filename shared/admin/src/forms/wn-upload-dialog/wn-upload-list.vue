<template>
  <ElDialog
    :title="props.title"
    v-model="dialogVisible"
    align-center
    width="700px"
    class="upload-dialog"
    header-class="upload-dialog-header"
    body-class="upload-dialog-body"
    @closed="handleClosed"
  >
    <template #default>
      <div style="height: 218px">
        <el-splitter lazy>
          <el-splitter-panel resizable size="100px" min="100px" max="100px">
            <ElScrollbar max-height="calc(100vh)">
              <el-segmented
                v-model="value"
                :options="groupList"
                size="default"
                direction="vertical"
                block
                @change="handleChange"
              />
            </ElScrollbar>
          </el-splitter-panel>
          <el-splitter-panel resizable>
            <template v-if="uploadList.length > 0">
              <ElSpace :wrap="true" :size="10" class="w-full pl-4 pt-0">
                <template v-for="(item, index) in uploadList" :key="item.id">
                  <div
                    class="w-[100px] h-[100px] border border-gray-300 rounded-md p-1 cursor-pointer relative"
                    :class="{
                      'border-primary': selectedItems.some((s) => Number(s.id) === Number(item.id))
                    }"
                    @click="handleSelect(item)"
                  >
                    <el-image
                      v-if="isImage(item.url)"
                      :src="item.url"
                      fit="cover"
                      class="w-full h-full"
                    />
                    <div
                      v-else
                      class="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-1"
                      :title="getFileName(item.url)"
                    >
                      <ElIcon class="text-gray-500 text-3xl">
                        <Document />
                      </ElIcon>
                      <span class="text-xs text-gray-400 truncate w-full text-center px-1">{{
                        getFileName(item.url)
                      }}</span>
                    </div>
                    <!-- 选中对号 -->
                    <div
                      v-if="selectedItems.some((s) => Number(s.id) === Number(item.id))"
                      class="absolute top-1 right-1 w-5 h-5 text-white rounded-full flex items-center justify-center bg-green-500"
                    >
                      <ElIcon class="w-3 h-3 text-white">
                        <Check />
                      </ElIcon>
                    </div>
                  </div>
                  <!-- 每5个换行 -->
                  <template v-if="(index + 1) % 5 === 0 && index !== uploadList.length - 1">
                    <div class="w-full"></div>
                  </template>
                </template>
              </ElSpace>
            </template>
            <el-empty v-else class="confset-empty-image" description="暂无数据" />
          </el-splitter-panel>
        </el-splitter>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <el-pagination
          :page-size="pageSize"
          :current-page="currentPage"
          :total="total"
          size="small"
          background
          layout="prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
        <div class="flex">
          <ElButton type="primary" @click="handleConfirm">确认选择</ElButton>
          <ElButton @click="handleCancel">取消</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch } from 'vue'
  import { ElPagination, ElImage, ElButton, ElSpace, ElIcon, ElEmpty } from 'element-plus'
  import { Check, Document } from '@element-plus/icons-vue'
  import { useWnRequestGet } from '@admin/core/context'

  // 请求走宿主注入（基座注入 axios 版 get，子应用不注入时用包内 fetch 版）
  const requestGet = useWnRequestGet()

  const SELECT_API = '/webniu/admin/upload/select'
  const GROUP_SELECT_API = '/webniu/admin/upload/groupselect'

  interface Props {
    visible: boolean
    title?: string
    category?: number
    multiple?: boolean
  }
  const value = ref(0)

  const props = withDefaults(defineProps<Props>(), {
    title: '图片列表',
    category: 0,
    multiple: false
  })

  const emit = defineEmits(['update:visible', 'submit'])

  // 响应式状态
  const uploadList = ref<any[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const selectedItems = ref<any[]>([])
  const category = ref(props.category)
  const groupList = ref<any[]>([])
  // 双向绑定
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  /**
   * 获取分组列表数据
   */
  async function getGroupList(): Promise<void> {
    let Group = await requestGet(GROUP_SELECT_API)
    const noGroup: any = {
      label: '无分组',
      value: 0
    }
    groupList.value = [
      noGroup,
      ...(Group.records.map((item: any) => ({
        label: item.name,
        value: item.id
      })) || [])
    ]
  }

  // 获取列表数据
  const fetchGetUploadList = async () => {
    let List = await requestGet(SELECT_API, {
      page: currentPage.value,
      limit: pageSize.value,
      order: 'desc',
      field: 'id',
      category: category.value
    })
    uploadList.value = List.records || []
    total.value = List.total || 0
  }
  // 分页大小改变
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    fetchGetUploadList()
  }

  // 页码改变
  const handlePageChange = (page: number) => {
    currentPage.value = page
    fetchGetUploadList()
  }
  // 确认选择
  const handleConfirm = () => {
    if (selectedItems.value.length === 0) {
      ElMessage.warning('请选择图片')
      return
    }
    emit('submit', selectedItems.value)
    emit('update:visible', false)
  }

  // 取消
  const handleCancel = () => {
    emit('update:visible', false)
  }

  // 关闭弹窗
  const handleClosed = () => {
    selectedItems.value = []
  }

  // 分类改变
  const handleChange = (val: number) => {
    category.value = val
    fetchGetUploadList()
  }
  const handleSelect = (item: any) => {
    const index = selectedItems.value.findIndex((s) => Number(s.id) === Number(item.id))
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      if (!props.multiple) {
        selectedItems.value = []
      }
      selectedItems.value.push(item)
    }
  }

  // 判断是否为图片文件
  const isImage = (url: string) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const ext = url.split('.').pop()?.toLowerCase()
    return imageExts.includes(ext || '')
  }

  // 从 url 中提取文件名
  const getFileName = (url: string) => {
    return url.split('/').pop() || ''
  }

  // 监听弹窗显示
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        currentPage.value = 1
        getGroupList().then(() => {
          fetchGetUploadList()
        })
      }
    }
  )

  onMounted(() => {})
</script>

<style scoped>
  :deep(.el-splitter-bar__dragger-horizontal):after,
  :deep(.el-splitter-bar__dragger-horizontal):before {
    width: 0px;
  }
  :deep(.confset-empty-image .el-empty__image) {
    width: 60px;
  }
</style>
