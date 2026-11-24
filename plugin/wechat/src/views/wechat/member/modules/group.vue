<template>
  <ElCard class="tree-card art-card-xs flex flex-col h-full mt-0 mr-4">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2"> {{ props.groupname }}列表 </div>
        <ElButton size="small" type="primary" @click="createGroupCategory" v-ripple>
          创建{{ props.groupname }}
        </ElButton>
      </div>
    </template>
    <ElScrollbar max-height="calc(100vh - 200px)">
      <div class="category-list">
        <div
          v-for="item in items"
          :key="item.groupid"
          :class="[
            'category-item flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer group',
            props.groupid === item.groupid ? 'bg-gray-50' : ''
          ]"
          @click="handleNodeClick(item)"
        >
          <div class="mr-0 text-gray-400 flex items-center">
            <ArtSvgIcon icon="ri:arrow-right-s-line" style="vertical-align: middle" />
          </div>
          <div class="category-info flex-1">
            <div class="category-label text-xs">{{ item.name }}</div>
          </div>
          <div
            class="category-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6.5!"
          >
            <ElTag
              v-if="item.groupid !== 0"
              class="cursor-pointer mr-1"
              type="primary"
              @click.stop="editGroupCategory(item.groupid)"
            >
              <ArtSvgIcon icon="ri:edit-line" />
            </ElTag>
            <ElTag
              v-if="item.groupid !== 0"
              class="cursor-pointer"
              type="danger"
              @click.stop="deleteGroupCategory(item.groupid)"
            >
              <ArtSvgIcon icon="ri:delete-bin-5-line" />
            </ElTag>
          </div>
        </div>
        <el-empty
          v-if="props.items.length == 0"
          class="confset-empty-image"
          :description="`暂无${props.groupname}数据`"
        />
      </div>
      <!-- 字典分组弹窗 -->
      <ElDialog
        v-model="groupDialogVisible"
        :title="groupDialogType === 'insert' ? '添加' + props.groupname : '编辑' + props.groupname"
        width="30%"
        align-center
        class="wn-dialog"
        @close="handleDialogClose"
      >
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
          <ElFormItem label="名称" prop="name">
            <ElInput v-model="formData.name" placeholder="请输入名称" />
          </ElFormItem>
          <ElFormItem label="状态" prop="status">
            <ElSwitch v-model="formData.status" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="handleDialogClose">取消</ElButton>
            <ElButton type="primary" :loading="submitLoading" @click.stop="handleGroupSubmit"
              >提交</ElButton
            >
          </div>
        </template>
      </ElDialog>
    </ElScrollbar>
  </ElCard>
</template>

<script setup lang="ts">
  import { post, del } from '@admin/core/request'
  import type { GroupItem, FormRules } from './types'
  import { ref, nextTick, onMounted, onUnmounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  interface Props {
    items: GroupItem[]
    config: any
    groupname: string
    groupid: number
  }

  interface Emits {
    (e: 'nodeClick', item: GroupItem): void
    (e: 'refresh'): void
  }
  const props = defineProps<Props>()
  const UPDATE_API = props.config.url + '/groupupdate'
  const INSERT_API = props.config.url + '/groupinsert'
  const DELETE_API = props.config.url + '/groupdelete'
  const formRef = ref()
  const formData = ref<GroupItem>({
    groupid: 0,
    name: '',
    count: '',
    default: 0,
    status: 1
  })
  const rules = ref<FormRules>({
    // 光标定位到名称输入框
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  })
  const emit = defineEmits<Emits>()
  // 提交loading状态
  const submitLoading = ref(false)

  // 处理节点点击事件
  const handleNodeClick = (item: GroupItem) => {
    emit('nodeClick', item)
  }
  // 分组弹窗显示控制
  const groupDialogVisible = ref(false)
  // 分组弹窗类型
  const groupDialogType = ref('insert')

  // 重置表单数据
  const resetFormData = () => {
    formData.value = {
      groupid: 0,
      name: '',
      count: '',
      default: 0,
      status: 1
    }
  }

  // 分组弹窗提交事件
  const handleGroupSubmit = async () => {
    try {
      // 表单验证
      await formRef.value.validate()

      submitLoading.value = true

      if (groupDialogType.value === 'insert') {
        // 新增分组
        await post(INSERT_API, formData.value)
        ElMessage.success('添加成功')
      } else {
        // 更新分组
        await post(UPDATE_API, formData.value)
        ElMessage.success('更新成功')
      }

      groupDialogVisible.value = false
      resetFormData()
      // 通知父组件刷新数据
      emit('refresh')
    } catch (error: any) {
      console.error('提交失败:', error)
      const firstErrorField = Object.keys(error)[0]
      if (firstErrorField) {
        nextTick(() => {
          const el = formRef.value.getFieldEl(firstErrorField)
          if (el) {
            el.focus()
          }
        })
      }
      ElMessage.error('表单验证失败，请检查红色标记的字段')
    } finally {
      submitLoading.value = false
    }
  }

  // 创建分组
  const createGroupCategory = () => {
    groupDialogVisible.value = true
    groupDialogType.value = 'insert'
    resetFormData()
  }

  // 编辑分组
  const editGroupCategory = (id: number) => {
    const item = props.items.find((i) => i.groupid === id)
    if (item) {
      groupDialogVisible.value = true
      groupDialogType.value = 'update'
      // 填充现有数据
      formData.value = {
        groupid: item.groupid,
        name: item.name,
        count: item.count,
        default: item.default,
        status: item.status
      }
    }
  }

  // 删除分组
  const deleteGroupCategory = async (groupid: number) => {
    try {
      await ElMessageBox.confirm(
        '确定要删除该分组吗？删除后，该分组下的数据也将被删除。',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await del(DELETE_API, { groupid })
      ElMessage.success('删除成功')

      // 如果删除的是当前选中的分组，重置选中状态
      if (props.groupid === groupid) {
        emit('nodeClick', { groupid: 0, name: '', count: '', default: 0, status: 1 })
      }

      // 通知父组件刷新数据
      emit('refresh')
    } catch (error) {
      // 用户取消删除
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败，请重试')
      }
    }
  }

  // 关闭弹窗
  const handleDialogClose = () => {
    groupDialogVisible.value = false
    resetFormData()
    formRef.value?.resetFields()
  }
  // 在组件挂载时添加键盘事件监听
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  // 在组件卸载时移除键盘事件监听
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
  // 键盘事件处理函数
  const handleKeyDown = (event: KeyboardEvent) => {
    // 只在弹窗可见时处理
    if (groupDialogVisible.value && event.key === 'Enter' && !event.shiftKey) {
      // 阻止默认行为
      event.preventDefault()
      // 触发表单提交
      handleGroupSubmit()
    }
  }
</script>
<style scoped>
  :deep(.confset-empty-image .el-empty__image) {
    width: 80px;
  }
</style>
