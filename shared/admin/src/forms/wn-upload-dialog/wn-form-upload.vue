<template>
  <div class="wn-form-upload">
    <el-space wrap>
      <div
        v-for="(item, index) in imgList"
        :key="item"
        class="h-[50px] relative"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = -1"
      >
        <el-image
          v-if="isImage(item)"
          class="rounded-[5px] w-[50px] h-[50px] border border-solid border-gray-300"
          :src="item"
          fit="cover"
          :preview-src-list="[item]"
        />
        <div
          v-else
          class="rounded-[5px] w-[50px] h-[50px] border border-solid border-gray-300 flex items-center justify-center bg-gray-50"
          :title="getFileName(item)"
        >
          <el-icon class="text-gray-500 text-xl">
            <Document />
          </el-icon>
        </div>
        <div
          v-show="hoveredIndex === index"
          class="absolute w-4 h-4 top-[1px] right-[1px] rounded-[2px] bg-[#ffffff] flex items-center justify-center cursor-pointer transition-colors"
          @click="handleRemove(index)"
        >
          <el-icon class="text-white text-xs">
            <Delete />
          </el-icon>
        </div>
      </div>
      <div class="h-[50px]" :title="title">
        <div
          class="border border-solid border-gray-300 rounded-[5px] w-[50px] h-[50px] inline-block overflow-hidden relative cursor-pointer"
          @click="handleClick"
        >
          <div class="h-full flex items-center justify-center">
            <el-icon class="text-2xl!">
              <Plus />
            </el-icon>
          </div>
        </div>
      </div>
      <div class="h-[50px]" v-if="props.uploadlist" title="图片列表">
        <div
          class="border border-solid border-gray-300 rounded-[5px] w-[50px] h-[50px] inline-block overflow-hidden relative cursor-pointer"
          @click="upListClick"
        >
          <div class="h-full flex items-center justify-center">
            <el-icon class="text-2xl!">
              <ArtSvgIcon icon="ri:menu-fill" />
            </el-icon>
          </div>
        </div>
      </div>
    </el-space>
    <WnUploadDialog
      class="wn-form-upload-dialog"
      v-model:visible="dialogVisible"
      :title="title"
      :multiple="props.multiple"
      :loading="loading"
      :limit="props.limit"
      :accept="props.accept"
      :size="props.size"
      :action="props.action"
      :post-data="props.postData"
      @submit="handleUploadSubmit"
    />
    <WnUploadList
      class="wn-form-upload-list"
      v-model:visible="listVisible"
      title="图片列表"
      :multiple="props.multiple"
      :loading="loading"
      @submit="handleUploadSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { Plus, Delete, Document } from '@element-plus/icons-vue'
  import WnUploadDialog from './wn-upload-dialog.vue'
  import WnUploadList from './wn-upload-list.vue'

  //读取到 绑定的值 然后在传回去
  const dialogVisible = ref(false)
  const listVisible = ref(false)
  const currentUploadData = ref<any>({})
  const loading = ref(false)
  const emit = defineEmits(['update:modelValue'])
  interface Props {
    modelValue?: string
    multiple?: boolean
    title?: string
    limit?: number
    accept?: string
    size?: number
    uploadlist?: boolean
    action?: string
    postData?: Record<string, any>
  }
  const props = defineProps<Props>()
  const imgList = ref<any[]>([])
  const title = ref(props.title || '上传文件')
  const hoveredIndex = ref(-1)
  const handleUploadSubmit = (data: any) => {
    if (props.multiple) {
      imgList.value.push(...data.map((item: any) => item.url))
    } else {
      imgList.value = [data[0].url]
    }
    dialogVisible.value = false
  }
  const initListData = () => {
    title.value = props.title || '上传文件'
    imgList.value = props.modelValue?.split?.(',') || []
  }
  watch(
    imgList,
    () => {
      emit('update:modelValue', imgList.value.join(','))
    },
    { deep: true }
  )
  const handleClick = () => {
    dialogVisible.value = true
    currentUploadData.value = props || {}
  }

  const handleRemove = (index: number) => {
    imgList.value.splice(index, 1)
  }
  const isImage = (url: string) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const ext = url.split('.').pop()?.toLowerCase()
    return imageExts.includes(ext || '')
  }
  const getFileName = (url: string) => {
    return url.split('/').pop() || ''
  }
  const upListClick = () => {
    listVisible.value = true
  }
  watch(
    () => props.modelValue,
    () => {
      initListData()
    }
  )

  onMounted(() => {
    initListData()
  })
</script>
<style scoped></style>
