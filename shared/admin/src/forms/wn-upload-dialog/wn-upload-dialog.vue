<template>
  <ElDialog
    :title="title"
    v-model="dialogVisible"
    align-center
    width="500px"
    class="upload-dialog"
    header-class="upload-dialog-header"
    body-class="upload-dialog-body"
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="props" :rules="rules" label-width="80px" label-position="top">
      <el-upload
        ref="uploadRef"
        drag
        :multiple="props.multiple"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="extraData"
        :name="props.name"
        :limit="limit"
        :on-exceed="handleExceed"
        :before-upload="handleBeforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
        :on-change="handleUploadChange"
        :accept="acceptTypes"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text"> 拖拽文件到此处 或 <em>点击上传</em> </div>
        <template #tip>
          <p class="text-sm text-gray-500 mt-2">
            文件大小不能超过 {{ Number(size).toFixed(2) }} MB 支持 {{ acceptTypes }} 格式
          </p>
        </template>
      </el-upload>
    </ElForm>
  </ElDialog>
</template>

<script setup lang="ts">
  import type {
    UploadRawFile,
    UploadProps,
    FormInstance,
    FormRules,
    UploadInstance
  } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { useWnUploadLimit } from '@admin/core/config'
  // 上传限制由宿主注入（基座注入后端 systemConfig.attachMent），子应用不注入时走内置安全默认值
  const uploadLimit = useWnUploadLimit()
  const INSERT_API = '/webniu/admin/upload/insert'
  const props = withDefaults(defineProps<Props>(), {
    title: '图片上传',
    category: 0,
    multiple: false,
    name: 'file',
    drag: true
  })
  const acceptTypes = computed(() => props.accept || uploadLimit.value.include)
  const size = computed(() => {
    return props.size || uploadLimit.value.single_limit
  })
  const limit = computed(() => {
    return props.limit || uploadLimit.value.nums
  })
  const handleExceed = () => {
    ElMessage.error(`最多只能上传 ${limit.value} 个文件!`)
  }
  const uploadAction = computed(() => {
    if (props.action) {
      return props.action
    }
    // 子应用独立编译时 VITE_API_URL 可能为空，回退到 /app/，避免拼出 undefinedwebniu/...
    const base = (import.meta.env.VITE_API_URL || '/app/').replace(/\/?$/, '/')
    return base + INSERT_API.replace(/^\//, '')
  })
  const uploadHeaders = ref({
    Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
  })
  interface Props {
    visible: boolean
    title: string
    multiple?: boolean
    accept?: string
    size?: number
    category?: number
    drag?: boolean
    name?: string
    action?: string
    limit?: number
    postData?: Record<string, any>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }
  const emit = defineEmits<Emits>()
  const title = computed(() => {
    return props.title
  })
  const uploadRef = ref<UploadInstance>()
  const uploadedFilesList = ref<any[]>([])
  const uploadProgress = ref(0)
  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()

  //提交数据
  const extraData = computed(() => ({
    category: props.category,
    ...props.postData
  }))
  // 表单验证规则
  const rules: FormRules = {}
  const handleBeforeUpload = (rawFile: UploadRawFile) => {
    const types = acceptTypes.value.split(',').map((type: string) => type.trim())

    const fileName = rawFile.name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

    const isAccept = types.some((type: string) => {
      const typeLower = type.toLowerCase()
      if (typeLower.startsWith('.')) {
        return fileExtension === typeLower
      }
      if (
        typeLower.includes('/') ||
        typeLower.startsWith('image/') ||
        typeLower.startsWith('text/') ||
        typeLower.startsWith('application/')
      ) {
        return rawFile.type.includes(typeLower)
      }
      return fileExtension === '.' + typeLower || rawFile.type.includes(typeLower)
    })
    const isLtMaxSize = rawFile.size / 1024 / 1024 < size.value
    if (!isAccept) {
      ElMessage.error(`只能上传${acceptTypes.value}文件!`)
      return false
    }
    if (!isLtMaxSize) {
      //保留小数后2位
      ElMessage.error(`文件大小不能超过 ${Number(size.value).toFixed(2)}MB!`)
      return false
    }
    uploadProgress.value = 0
    return true
  }
  // 上传进度
  const handleUploadProgress: UploadProps['onProgress'] = (options) => {
    uploadProgress.value = Math.round(options.percent || 0)
  }
  // 上传成功
  const handleUploadSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
    uploadProgress.value = 100
    if (response.code === 200) {
      uploadedFilesList.value.push(response.data)
    } else {
      // 业务失败：标记文件为 fail，阻止 handleUploadChange 误判全部成功
      uploadFile.status = 'fail'
      ElMessage.error(response.msg || '上传失败')
    }
  }
  // 上传失败
  const handleUploadError: UploadProps['onError'] = (error) => {
    ElMessage.error('上传失败: ' + error.message)
  }
  const handleUploadChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
    // 全部已出结果（成功或失败）且有成功文件时才提交
    const allSettled = uploadFiles.every(
      (file) => file.status === 'success' || file.status === 'fail'
    )
    if (allSettled && uploadedFilesList.value.length > 0) {
      //延迟1秒
      setTimeout(() => {
        emit('submit', uploadedFilesList.value)
      }, 500)
    }
    return false
  }
  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = async () => {
    uploadProgress.value = 0
    uploadedFilesList.value = []
    // 清空上传组件的文件列表
    nextTick(() => {
      uploadRef.value?.clearFiles()
    })
  }

  /**
   * 关闭对话框时触发
   * 清空表单数据并重置验证状态
   */
  const handleClosed = () => {
    initFormData()
    emit('update:visible', false)
    nextTick(() => {
      formRef.value?.clearValidate()
    })
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
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )
</script>
<style scoped>
  .upload-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .upload-options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
  :global(.upload-dialog-body) {
    padding: 0px !important;
  }
</style>
