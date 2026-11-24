<template>
  <ElCard shadow="never" class="tree-card art-card-xs flex flex-col h-full mt-0 mr-4">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <slot name="header">
            <p class="text-sm">{{ title }}</p>
          </slot>
        </div>
        <ElButton v-if="showAdd" size="small" type="primary" @click="handleCreate" v-ripple>
          <ArtSvgIcon icon="ri:add-line" />
        </ElButton>
      </div>
    </template>
    <ElScrollbar max-height="scrollHeight">
      <VueDraggable
        v-if="draggable"
        v-model="localList"
        class="category-list"
        handle=".drag-handle"
        :animation="200"
        @end="handleDragEnd"
      >
        <div
          v-for="item in localList"
          :key="item.id"
          :class="[
            'category-item flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer group',
            selectedId === item.id ? 'bg-gray-50' : '',
            item.id === 0 ? 'cursor-not-allowed' : ''
          ]"
          @click="handleClick(item)"
        >
          <div
            v-if="item.id !== 0"
            class="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600"
          >
            <ArtSvgIcon :icon="dragIcon" style="vertical-align: text-top" />
          </div>
          <div v-else class="mr-2 text-gray-300">
            <ArtSvgIcon :icon="dragIcon" style="vertical-align: text-top" />
          </div>
          <div class="category-info flex-1">
            <div class="category-label text-xs">{{ item.name }}</div>
            <div class="category-name text-xs text-gray-500">{{ item.label }}</div>
          </div>
          <div
            v-if="item.id != 0"
            class="category-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ElTag
              v-if="showEdit"
              class="cursor-pointer mr-1"
              type="primary"
              @click.stop="handleEdit(item)"
            >
              <ArtSvgIcon icon="ri:edit-line" />
            </ElTag>
            <ElTag
              v-if="showDelete"
              class="cursor-pointer"
              type="danger"
              @click.stop="handleDelete(item.id)"
            >
              <ArtSvgIcon icon="ri:delete-bin-5-line" />
            </ElTag>
          </div>
        </div>
      </VueDraggable>
      <template v-else>
        <div
          v-for="item in localList"
          :key="item.id"
          :class="[
            'category-item flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer group',
            selectedId === item.id ? 'bg-gray-50' : ''
          ]"
          @click="handleClick(item)"
        >
          <div class="category-info flex-1">
            <div class="category-label text-xs">{{ item.name }}</div>
            <div class="category-name text-xs text-gray-500">{{ item.label }}</div>
          </div>
          <div
            class="category-actions opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ElTag
              v-if="showEdit"
              class="cursor-pointer mr-1"
              type="primary"
              @click.stop="handleEdit(item)"
            >
              <ArtSvgIcon icon="ri:edit-line" />
            </ElTag>
            <ElTag
              v-if="showDelete"
              class="cursor-pointer"
              type="danger"
              @click.stop="handleDelete(item.id)"
            >
              <ArtSvgIcon icon="ri:delete-bin-5-line" />
            </ElTag>
          </div>
        </div>
      </template>
      <el-empty v-if="localList.length == 0" class="confset-empty-image" :description="emptyText" />
      <slot></slot>
    </ElScrollbar>
  </ElCard>
</template>

<script setup lang="ts">
  import { ElTag, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@admin/base/art-svg-icon/index.vue'
  import { VueDraggable } from 'vue-draggable-plus'

  export interface GroupItem {
    id: number | string
    name: string
    label: string
    sort?: number
    [key: string]: any
  }

  interface Props {
    list?: GroupItem[]
    selectedId?: number | string | null
    title?: string
    emptyText?: string
    scrollHeight?: string
    draggable?: boolean
    dragIcon?: string
    showAdd?: boolean
    showEdit?: boolean
    showDelete?: boolean
    deleteApi?: string
    updateApi?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    list: () => [],
    selectedId: null,
    title: '分组列表',
    emptyText: '暂无数据',
    scrollHeight: 'calc(100vh - 200px)',
    draggable: false,
    dragIcon: 'ri:draggable',
    showAdd: true,
    showEdit: true,
    showDelete: true
  })

  interface Emits {
    (e: 'click', item: GroupItem): void
    (e: 'create'): void
    (e: 'edit', item: GroupItem): void
    (e: 'delete', id: number | string): void
    (e: 'update', data: GroupItem[]): void
    (e: 'update:selectedId', value: number | string | null): void
    (e: 'sortChange', list: GroupItem[]): void
  }

  const emit = defineEmits<Emits>()

  const localList = computed({
    get: () => props.list,
    set: (val) => emit('update', val as GroupItem[])
  })

  const handleClick = (item: GroupItem) => {
    emit('click', item)
    emit('update:selectedId', item.id)
  }

  const handleCreate = () => {
    emit('create')
  }

  const handleEdit = (item: GroupItem) => {
    emit('edit', item)
  }

  const handleDelete = (id: number | string) => {
    ElMessageBox.confirm('确定删除该分组吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        emit('delete', id)
      })
      .catch(() => {
        return
      })
  }

  const handleDragEnd = () => {
    const sortData = props.list.map((item, index) => ({
      ...item,
      sort: index + 1
    }))
    emit('sortChange', sortData)
  }
</script>

<style scoped>
  .tree-card :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    padding: 10px 10px 10px 10px;
  }
</style>
