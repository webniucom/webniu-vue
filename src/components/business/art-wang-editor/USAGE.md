# WangEditor 富文本编辑器使用指南

`ArtForm` 组件已集成 `WangEditor` 富文本编辑器，支持富文本编辑、图片上传等功能。

## 基础使用

在 `ArtForm` 的 `items` 配置中，将 `type` 设置为 `'wangeditor'` 即可使用。

```typescript
const formItems = ref<FormItem[]>([
  {
    key: 'content',
    label: '内容',
    type: 'wangeditor',
    span: 24,
    props: {
      placeholder: '请输入内容...',
      height: '400px'
    }
  }
])
```

## 完整配置示例

```typescript
const formItems = ref<FormItem[]>([
  {
    key: 'title',
    label: '标题',
    type: 'input',
    span: 12,
    props: {
      placeholder: '请输入标题'
    }
  },
  {
    key: 'content',
    label: '内容',
    type: 'wangeditor',
    span: 24,
    props: {
      placeholder: '请输入文章内容...',
      height: '500px',
      mode: 'default',
      excludeKeys: ['fontFamily'],
      uploadConfig: {
        maxFileSize: 5 * 1024 * 1024,
        maxNumberOfFiles: 5
      }
    }
  }
])
```

## Props 配置

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `height` | 编辑器高度 | `string` | `'500px'` |
| `mode` | 编辑器模式 | `'default' \| 'simple'` | `'default'` |
| `placeholder` | 占位符文本 | `string` | `'请输入内容...'` |
| `toolbarKeys` | 完全自定义工具栏 | `string[]` | - |
| `insertKeys` | 插入新工具到指定位置 | `{ index: number; keys: string[] }` | - |
| `excludeKeys` | 排除的工具栏项 | `string[]` | `['fontFamily']` |
| `uploadConfig` | 上传配置 | `object` | 见下方 |

### uploadConfig 配置

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `maxFileSize` | 最大文件大小（字节） | `number` | `3 * 1024 * 1024`（3MB） |
| `maxNumberOfFiles` | 最大文件数量 | `number` | `10` |
| `server` | 上传服务器地址 | `string` | `${VITE_API_URL}/api/common/upload/wangeditor` |
| `isCustomUpload` | 是否开启自定义上传 | `boolean` | `false` |

## 工具栏配置

### 完全自定义工具栏

```typescript
{
  type: 'wangeditor',
  props: {
    toolbarKeys: ['headerSelect', 'bold', 'italic', 'underline']
  }
}
```

### 插入新工具

```typescript
{
  type: 'wangeditor',
  props: {
    insertKeys: {
      index: 5,
      keys: ['yourCustomKey']
    }
  }
}
```

### 排除工具

```typescript
{
  type: 'wangeditor',
  props: {
    excludeKeys: ['fontFamily', 'fontSize']
  }
}
```

## 常用工具栏项

- `headerSelect` - 标题选择
- `bold` - 加粗
- `italic` - 斜体
- `underline` - 下划线
- `through` - 删除线
- `code` - 代码
- `sub` - 下标
- `sup` - 上标
- `color` - 文字颜色
- `bgColor` - 背景颜色
- `fontFamily` - 字体
- `fontSize` - 字号
- `lineHeight` - 行高
- `bulletedList` - 无序列表
- `numberedList` - 有序列表
- `todo` - 待办事项
- `justifyLeft` - 左对齐
- `justifyRight` - 右对齐
- `justifyCenter` - 居中
- `justifyJustify` - 两端对齐
- `indent` - 增加缩进
- `delIndent` - 减少缩进
- `insertLink` - 插入链接
- `uploadImage` - 上传图片
- `insertImage` - 插入网络图片
- `deleteImage` - 删除图片
- `editImage` - 编辑图片
- `viewImageLink` - 查看图片链接
- `imageWidth30` - 图片宽度30%
- `imageWidth50` - 图片宽度50%
- `imageWidth100` - 图片宽度100%
- `insertVideo` - 插入视频
- `uploadVideo` - 上传视频
- `insertTable` - 插入表格
- `deleteTable` - 删除表格
- `insertDivider` - 分割线
- `undo` - 撤销
- `redo` - 重做
- `fullScreen` - 全屏
- `clearStyle` - 清除格式

## 完整示例

```vue
<template>
  <ArtForm
    :items="formItems"
    v-model="formData"
    span="12"
    @submit="handleSubmit"
    @reset="handleReset"
  />
</template>

<script setup lang="ts">
  import ArtForm from '@/components/core/forms/art-form/index.vue'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'

  const formItems = ref<FormItem[]>([
    {
      key: 'title',
      label: '标题',
      type: 'input',
      span: 12,
      props: {
        placeholder: '请输入标题',
        maxlength: 100
      }
    },
    {
      key: 'summary',
      label: '摘要',
      type: 'input',
      span: 12,
      props: {
        placeholder: '请输入摘要',
        maxlength: 200
      }
    },
    {
      key: 'content',
      label: '正文',
      type: 'wangeditor',
      span: 24,
      props: {
        placeholder: '请输入文章正文...',
        height: '400px',
        mode: 'default',
        excludeKeys: ['fontFamily'],
        uploadConfig: {
          maxFileSize: 5 * 1024 * 1024,
          maxNumberOfFiles: 5
        }
      }
    }
  ])

  const formData = ref({
    title: '',
    summary: '',
    content: ''
  })

  const handleSubmit = (data: Record<string, any>) => {
    console.log('提交的数据:', data)
    // 这里处理提交逻辑
  }

  const handleReset = () => {
    console.log('表单已重置')
  }
</script>
```

## 注意事项

1. **富文本清洗**：`ArtForm` 组件会自动清洗空富文本内容（如 `<p><br></p>`），可以通过 `sanitizeOutput` 配置调整
2. **图片上传**：确保后端接口 `${VITE_API_URL}/api/common/upload/wangeditor` 正常工作
3. **编辑器高度**：根据实际需求调整 `height` 属性，建议最小值为 `300px`
4. **表单验证**：富文本编辑器支持校验规则，可通过 `rules` 属性配置

```typescript
{
  key: 'content',
  label: '内容',
  type: 'wangeditor',
  span: 24,
  rules: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ]
}
```
