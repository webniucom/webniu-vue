<template>
  <ElDrawer
    :title="title"
    v-model="dialogVisible"
    :size="700"
    align-center
    class="confset-dialog"
    header-class="confset-dialog-header"
    body-class="confset-dialog-body"
    @closed="handleClosed"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      :disabled="formData.disabled === 1"
      label-width="80px"
    >
      <ElFormItem label="分组标识" prop="name">
        <el-button type="primary" size="small" plain>{{ formData.name }}</el-button>
      </ElFormItem>

      <div class="grid grid-cols-2">
        <ElFormItem label="配置标题" prop="label">
          <ElInput v-model="formData.label" placeholder="请输入配置标题" />
        </ElFormItem>
        <ElFormItem label="标题宽度" prop="label_width">
          <ElInputNumber
            v-model="formData.label_width"
            :min="50"
            :max="200"
            :step="1"
            type="number"
            placeholder="请输入标题宽度"
          />
        </ElFormItem>
      </div>
      <ElFormItem label="字段标识" prop="key">
        <ElInput v-model="formData.key" placeholder="请输入字段标识" />
      </ElFormItem>
      <ElFormItem label="字段类型" prop="type">
        <ElSelect v-model="formData.type">
          <ElOption label="文本框" value="input" />
          <ElOption label="文本域" value="textarea" />
          <ElOption label="下拉选择" value="select" />
          <ElOption label="级联选择器" value="cascader" />
          <ElOption label="树型选择器" value="treeselect" />
          <ElOption label="单点选择" value="radiogroup" />
          <ElOption label="复选框" value="checkboxgroup" />
          <ElOption label="图片上传" value="upload" />
          <ElOption label="文件上传" value="file" />
          <ElOption label="日期时间" value="datetime" />
          <ElOption label="时间选择" value="timeselect" />
          <ElOption label="时间选择器" value="timepicker" />
          <ElOption label="开关按钮" value="switch" />
          <ElOption label="数字框" value="number" />
          <ElOption label="评分评分" value="rate" />
          <ElOption label="滑块" value="slider" />
          <ElOption label="分割线" value="divider" />
        </ElSelect>
      </ElFormItem>
      <!-- 选项配置或字典选择 -->
      <ElFormItem
        label="选项配置"
        prop="options"
        class="confset-options-form-item"
        v-if="
          formData.type === 'select' ||
          formData.type === 'radiogroup' ||
          formData.type === 'checkboxgroup' ||
          formData.type === 'treeselect' ||
          formData.type === 'cascader'
        "
      >
        <!-- 选项配置 -->
        <template v-if="!showDictSelector">
          <VueDraggable
            v-model="formData.options"
            class="value-list"
            handle=".drag-handle"
            :animation="200"
          >
            <div
              v-for="(item, index) in formData.options"
              :key="index"
              class="value-item mb-2 flex items-center"
            >
              <ElInput
                v-model="item.label"
                placeholder="选项标题"
                class="mr-2"
                style="width: 200px"
              />
              <ElInput
                v-model="item.value"
                placeholder="选项值"
                class="mr-2"
                style="width: 200px"
              />
              <div class="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600">
                <ArtSvgIcon icon="ri:draggable" />
              </div>
              <ElButton type="danger" size="small" @click="handleRemoveValue(index)" plain>
                <ArtSvgIcon icon="ri:delete-bin-5-line" />
              </ElButton>
            </div>
          </VueDraggable>
          <div style="margin-top: 1px">
            <ElButton type="primary" size="small" @click="handleAddValue" plain>
              <ArtSvgIcon icon="ri-add-line" class="mr-1" />
              添加选项
            </ElButton>
            <ElButton type="info" size="small" @click="handleSelectDict" plain>
              <ArtSvgIcon icon="ri-arrow-right-line" class="mr-1" />
              选择字典
            </ElButton>
          </div>
        </template>

        <!-- 字典选择 -->
        <template v-else>
          <div class="flex items-center gap-3">
            <ElSelect
              v-model="formData.dict"
              placeholder="请选择字典类型"
              style="width: 300px"
              clearable
              :loading="dictLoading"
            >
              <ElOption
                v-for="dict in dictOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </ElSelect>
            <ElButton type="primary" size="small" @click="handleBackToOptions" plain>
              <ArtSvgIcon icon="ri-arrow-left-line" class="mr-1" />
              选项配置
            </ElButton>
          </div>
        </template>
      </ElFormItem>
      <ElFormItem label="描述" prop="desc">
        <ElInput v-model="formData.desc" placeholder="请输入描述" />
      </ElFormItem>
      <ElFormItem label="属性" prop="props">
        <ElInput
          v-model="formData.props"
          placeholder="请输入属性"
          type="textarea"
          :rows="5"
          @blur="validateProps"
        />
      </ElFormItem>

      <!-- 并排显示栅格布局和排序 -->
      <div class="grid grid-cols-2">
        <ElFormItem label="栅格布局" prop="span">
          <ElInputNumber
            v-model="formData.span"
            :min="12"
            :max="24"
            :step="1"
            type="number"
            placeholder="请输入栅格布局"
          />
        </ElFormItem>
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber
            v-model="formData.sort"
            :min="0"
            :max="9999"
            :step="1"
            type="number"
            placeholder="请输入排序"
          />
        </ElFormItem>
        <ElFormItem label="隐藏" prop="hidden">
          <ElSwitch v-model="formData.hidden" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElSwitch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <div class="confset-dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { type FormInstance, type FormRules } from 'element-plus'
  import type { FormData } from './confset-types'
  import { VueDraggable } from 'vue-draggable-plus'
  import { get } from '@/api/common-request'
  import { ref, reactive, computed, nextTick } from 'vue'

  interface Props {
    visible: boolean
    type: string
    editData?: Partial<FormData>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const title = computed(() => {
    return props.type === 'update' ? '编辑配置' : '新增配置'
  })

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 表单实例
  const formRef = ref<FormInstance>()

  // 是否显示字典选择器
  const showDictSelector = ref(false)
  const DICT_API = '/webniu/admin/dict/groupselect'
  // 字典选项（动态加载）
  const dictOptions = ref<any[]>([])
  // 字典加载状态
  const dictLoading = ref(false)

  // 表单数据
  const formData = reactive<FormData>({
    id: '',
    model: 'apptem',
    name: '',
    label: '',
    label_width: 110,
    desc: '',
    type: 'input',
    dict: '',
    key: '',
    value: '',
    span: 24,
    sort: 0,
    hidden: 0,
    props: '',
    status: 1,
    disabled: 0,
    options: [] as any[]
  })

  // 表单验证规则
  const rules: FormRules = {
    label: [
      { required: true, message: '请输入配置标题', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    key: [
      { required: true, message: '请输入配置标识', trigger: 'blur' },
      { min: 3, max: 30, message: '长度在 3 到 30 个字符', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择组件类型', trigger: 'blur' }],
    dict: [{ required: true, message: '请选择字典类型', trigger: 'blur' }],
    props: [
      {
        validator: (rule: any, value: string, callback: any) => {
          if (!value) {
            callback()
            return
          }
          try {
            JSON.parse(value)
            callback()
          } catch {
            callback(new Error('JSON 格式错误，请检查语法'))
          }
        },
        trigger: 'blur'
      }
    ],
    // 排序 必须输入数字
    sort: [
      { required: true, message: '请输入排序', trigger: 'blur' },
      { type: 'number', message: '排序必须是数字', trigger: 'blur' }
    ]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'update' && props.editData
    const row = props.editData
    const options = isEdit && row ? row.options || [] : []
    const dict = isEdit && row ? row.dict || '' : ''

    Object.assign(formData, {
      id: isEdit && row ? row.id || '' : '',
      model: props.editData?.model || '',
      name: props.editData?.name || '',
      label: isEdit && row ? row.label || '' : props.editData?.label || '',
      label_width: isEdit && row ? Number(row.label_width || 110) : 110,
      desc: isEdit && row ? row.desc || '' : '',
      type: isEdit && row ? row.type || 'input' : 'input',
      dict,
      key: isEdit && row ? row.key || '' : '',
      value: isEdit && row ? row.value || '' : '',
      span: isEdit && row ? Number(row.span || 24) : 24,
      sort: isEdit && row ? Number(row.sort || 0) : 0,
      hidden: isEdit && row ? Number(row.hidden || 0) : 0,
      status: isEdit && row ? Number(row.status === 0 ? 0 : 1) : 1,
      disabled: isEdit && row ? Number(row.disabled || 0) : 0,
      options
    })
    formData.props = isEdit && row ? row.props || propslist.value : propslist.value

    // 根据数据自动判断显示选项配置还是字典选择
    // 如果 options.length > 0 且 dict 为空 → 显示选项配置
    // 如果 options.length === 0 且 dict 不为空 → 显示字典选择
    if (options.length > 0 && !dict) {
      showDictSelector.value = false
    } else if (options.length === 0 && dict) {
      showDictSelector.value = true
    } else {
      // 默认显示选项配置
      showDictSelector.value = false
    }
  }

  /**
   * 添加选项
   */
  const handleAddValue = () => {
    formData.options.push({
      label: '',
      value: ''
    })
  }

  // 添加监听：当 desc 变化时自动更新 props
  watch(
    () => formData.desc,
    (newDesc) => {
      try {
        // 尝试解析现有的 props
        const existingProps = formData.props ? JSON.parse(formData.props) : {}
        // 只更新 placeholder，保留其他字段
        formData.props = JSON.stringify(
          {
            ...existingProps, // 保留现有属性
            placeholder: newDesc || false // 更新 placeholder
          },
          null,
          2
        )
      } catch {
        // 如果解析失败，使用默认值
        formData.props = propslist.value
      }
    }
  )

  /**
   * 删除选项
   */
  const handleRemoveValue = (index: number) => {
    formData.options.splice(index, 1)
  }

  /**
   * 验证并格式化 props JSON 内容
   */
  const validateProps = () => {
    if (!formData.props) return
    try {
      const parsed = JSON.parse(formData.props)
      formData.props = JSON.stringify(parsed, null, 2)
    } catch {
      formData.props = fixJsonFormat(formData.props)
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
   * 关闭对话框时触发
   * 清空表单数据并重置验证状态
   */
  const handleClosed = () => {
    initFormData()
    nextTick(() => {
      formRef.value?.clearValidate()
      formRef.value?.resetFields()
    })
  }
  //改成计算属性格式
  const propslist = computed(() => {
    return JSON.stringify(
      {
        placeholder: formData.desc || false,
        clearable: true,
        tooltip: true
      },
      null,
      2
    )
  })
  /**
   * 加载字典数据
   */
  const loadDictData = async () => {
    if (dictLoading.value || dictOptions.value.length > 0) return

    dictLoading.value = true
    try {
      const res = await get(DICT_API, {
        format: 'custom'
      })
      if (res.records) {
        dictOptions.value = res.records.map((item: any) => ({
          value: item.value,
          label: item.label
        }))
      }
    } catch (error) {
      console.error('加载字典数据失败:', error)
    } finally {
      dictLoading.value = false
    }
  }

  /**
   * 打开字典选择器
   */
  const handleSelectDict = () => {
    showDictSelector.value = true
    // 切换到字典选择时清空选项配置（二选一）
    formData.options = []
    // 动态加载字典数据
    loadDictData()
  }

  /**
   * 返回选项配置
   */
  const handleBackToOptions = () => {
    showDictSelector.value = false
    // 返回选项配置时清空字典选择
    formData.dict = ''
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
        // 弹窗打开时自动加载字典数据（带缓存）
        loadDictData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (valid) {
        const postData = {
          ...formData,
          options: JSON.stringify(formData.options)
        }
        emit('submit', postData)
      }
    })
  }
</script>
<style scoped>
  .confset-dialog .el-drawer__header {
    margin-bottom: 20px;
  }
  .confset-options-form-item :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
</style>
