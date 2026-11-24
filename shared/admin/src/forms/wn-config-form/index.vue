<!--
  配置式表单组件（子应用版 ArtForm）
  写法：传 items 数组，每项用 type 指定控件，其余属性写进 props 里即可。

  可移植要求：vue API / El 组件全部显式 import，不依赖宿主的 auto-import 与全局注册；
  Tailwind 工具类由宿主应用的 tailwind 扫描本目录生成（子应用需在 tailwind.css 里 @source 本包）。
-->
<template>
  <ElForm
    ref="formRef"
    :model="modelValue"
    :label-width="labelWidth"
    :label-position="labelPosition"
    v-bind="$attrs"
  >
    <ElRow :gutter="gutter">
      <ElCol
        v-for="item in visibleItems"
        :key="item.key"
        :span="item.type === 'divider' ? 24 : item.span || span"
      >
        <!-- 分割线 -->
        <ElDivider
          v-if="item.type === 'divider'"
          v-bind="item.props || {}"
          content-position="left"
        >
          <b class="text-gray-500">{{ item.label }}</b>
        </ElDivider>

        <!-- 普通表单项 -->
        <ElFormItem
          v-else
          :class="item.type === 'upload' ? 'items-center' : ''"
          :prop="item.key"
          :rules="item.rules"
          :label="item.label"
          :label-width="item.labelWidth"
        >
          <component
            :is="getComponent(item)"
            :model-value="getFieldValue(item.key)"
            @update:model-value="setFieldValue(item.key, $event)"
            v-bind="item.props || {}"
          >
            <!-- 下拉选择 -->
            <template v-if="item.type === 'select'">
              <ElOption
                v-for="option in item.options || []"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </template>
            <!-- 单选组 -->
            <template v-else-if="item.type === 'radiogroup'">
              <ElRadio v-for="option in item.options || []" :key="option.value" :label="option.value">
                {{ option.label }}
              </ElRadio>
            </template>
            <!-- 复选组 -->
            <template v-else-if="item.type === 'checkboxgroup'">
              <ElCheckbox
                v-for="option in item.options || []"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </ElCheckbox>
            </template>
          </component>
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  // 以变量形式放进 componentMap / 在模板中使用的组件必须显式 import
  import {
    ElCheckbox,
    ElCheckboxGroup,
    ElCol,
    ElDatePicker,
    ElDivider,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElOption,
    ElRadio,
    ElRadioGroup,
    ElRow,
    ElSelect,
    ElSwitch,
    type FormInstance
  } from 'element-plus'
  import WnFormUpload from '@admin/forms/wn-upload-dialog/wn-form-upload.vue'
  defineOptions({ name: 'WnConfigForm' })

  const componentMap = {
    input: ElInput, // 输入框（props.type = 'textarea' 即为文本域）
    number: ElInputNumber, // 数字输入框
    select: ElSelect, // 选择器
    switch: ElSwitch, // 开关
    radiogroup: ElRadioGroup, // 单选框组
    checkboxgroup: ElCheckboxGroup, // 复选框组
    date: ElDatePicker, // 日期选择器
    datetime: ElDatePicker, // 日期时间选择器
    upload: WnFormUpload // 上传（值 = 逗号拼接的 URL 串）
  }

  /** 表单项配置 */
  export interface FormItem {
    /** 字段名 */
    key: string
    /** 标签文本 */
    label: string
    /** 控件类型，见 componentMap */
    type?: keyof typeof componentMap | string
    /** 占据的栅格宽度（24 格制） */
    span?: number
    /** 覆盖表单的 labelWidth */
    labelWidth?: string | number
    /** 是否隐藏该项 */
    hidden?: boolean | (() => boolean)
    /** 选项数据（select / radiogroup / checkboxgroup） */
    options?: Array<{ label: string; value: string | number }>
    /** 透传给控件的属性 */
    props?: Record<string, any>
    /** 校验规则 */
    rules?: Record<string, any>[]
  }

  interface Props {
    items: FormItem[]
    /** 默认单项栅格宽度 */
    span?: number
    /** 栅格间距 */
    gutter?: number
    labelWidth?: string | number
    labelPosition?: 'left' | 'right' | 'top'
  }

  const props = withDefaults(defineProps<Props>(), {
    items: () => [],
    span: 24,
    gutter: 12,
    labelWidth: '80px',
    labelPosition: 'right'
  })

  const modelValue = defineModel<Record<string, any>>({ default: () => ({}) })
  const formRef = ref<FormInstance>()

  const getComponent = (item: FormItem) =>
    componentMap[item.type as keyof typeof componentMap] || componentMap.input

  const getFieldValue = (key: string) => modelValue.value?.[key]

  // 清空时直接置空串，保证 el-form 的 required 规则仍能命中
  const setFieldValue = (key: string, value: unknown) => {
    modelValue.value[key] = value
  }

  const visibleItems = computed(() =>
    props.items.filter((item) => !(typeof item.hidden === 'function' ? item.hidden() : item.hidden))
  )

  defineExpose({
    /** 校验整个表单，不通过时 reject */
    validate: (...args: any[]) => formRef.value?.validate(...args),
    /** 清空校验状态并恢复初始值 */
    reset: () => formRef.value?.resetFields()
  })
</script>
