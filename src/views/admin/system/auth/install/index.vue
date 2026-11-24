<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <div class="login-left-view">
      <div class="logo">
        <ArtLogo class="icon" size="46" />
        <h1 class="title">{{ systemConfig.systemInfo.name }}</h1>
      </div>

      <div class="left-img">
        <div class="form">
          <!-- 步骤内容区 -->
          <ElCard class="mb-7.5 max-w-[1024px] mx-auto">
            <template #header>
              <ElSteps class="w-full py-2" :active="active" align-center finish-status="success">
                <ElStep title="阅读许可协议" />
                <ElStep title="环境检查" />
                <ElStep title="填写数据库信息" />
                <ElStep title="填写管理员账户" />
                <ElStep title="完成" />
              </ElSteps>
            </template>
            <ElWatermark content="" :font="{ color: 'rgba(128, 128, 128, 0.2)' }">
              <!-- 步骤按钮区 -->
              <div class="step-content">
                <div v-if="active === 0">
                  <textarea
                    class="license-box !text-xs"
                    readonly
                    @scroll="handleLicenseScroll"
                    v-model="licenseContent"
                  ></textarea>
                  <ElCheckbox v-model="licenseChecked">我已阅读并同意</ElCheckbox>
                </div>
                <div v-else-if="active === 1">
                  <div>
                    <el-collapse v-model="detection" accordion expand-icon-position="left">
                      <el-collapse-item title="运行环境" name="1">
                        <el-table :data="environment" style="width: 100%" stripe>
                          <el-table-column prop="title" label="项目" />
                          <el-table-column prop="recommend" label="所需环境" />
                          <el-table-column prop="current" label="当前环境" />
                        </el-table>
                      </el-collapse-item>
                      <el-collapse-item title="目录权限" name="2">
                        <el-table :data="catalogue" style="width: 100%">
                          <el-table-column prop="path" label="目录" />
                          <el-table-column prop="read" label="读取权限">
                            <template #default="{ row }">
                              <ArtSvgIcon
                                :icon="row.read"
                                :class="
                                  row.read === 'ri:check-fill' ? 'text-green-500' : 'text-red-500'
                                "
                                class="icon size-5"
                              />
                            </template>
                          </el-table-column>
                          <el-table-column prop="write" label="写入权限">
                            <template #default="{ row }">
                              <ArtSvgIcon
                                :icon="row.write"
                                :class="
                                  row.write === 'ri:check-fill' ? 'text-green-500' : 'text-red-500'
                                "
                                class="icon size-5"
                              />
                            </template>
                          </el-table-column>
                        </el-table>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
                <div v-else-if="active === 2">
                  <ElForm
                    :model="dbForm"
                    :rules="dbRules"
                    ref="dbFormRef"
                    label-width="100px"
                    class="px-4 pt-3"
                  >
                    <ElFormItem label="数据库账户" prop="user">
                      <ElInput v-model="dbForm.user" placeholder="请输入数据库账户" />
                    </ElFormItem>
                    <ElFormItem label="数据库密码" prop="password">
                      <ElInput
                        v-model="dbForm.password"
                        type="password"
                        placeholder="请输入数据库密码"
                      />
                    </ElFormItem>
                    <ElFormItem label="数据库名称" prop="database">
                      <ElInput v-model="dbForm.database" placeholder="请输入数据库名称" />
                    </ElFormItem>
                    <ElFormItem label="数据库前缀" prop="prefix">
                      <ElInput v-model="dbForm.prefix" placeholder="请输入数据库前缀" />
                    </ElFormItem>
                    <ElFormItem label="数据库主机" prop="host">
                      <ElInput v-model="dbForm.host" placeholder="请输入数据库主机" />
                    </ElFormItem>
                    <ElFormItem label="数据库端口" prop="port">
                      <ElInput v-model="dbForm.port" placeholder="请输入数据库端口" />
                    </ElFormItem>
                    <ElFormItem label="强制覆盖" prop="overwrite" :required="false">
                      <ElCheckbox v-model="dbForm.overwrite">强制覆盖已存在数据库</ElCheckbox>
                    </ElFormItem>
                  </ElForm>
                </div>
                <div v-else-if="active === 3">
                  <ElForm
                    :model="adminForm"
                    :rules="adminRules"
                    ref="adminFormRef"
                    label-width="100px"
                  >
                    <ElFormItem label="用户名" prop="username">
                      <ElInput v-model="adminForm.username" placeholder="请输入管理员用户名" />
                    </ElFormItem>
                    <ElFormItem label="密码" prop="password">
                      <ElInput
                        v-model="adminForm.password"
                        type="password"
                        placeholder="请输入密码"
                      />
                    </ElFormItem>
                    <ElFormItem label="确认密码" prop="password_confirm">
                      <ElInput
                        v-model="adminForm.password_confirm"
                        type="password"
                        placeholder="请确认密码"
                      />
                    </ElFormItem>
                  </ElForm>
                </div>
                <div v-else-if="active === 5">
                  <ArtResultPage
                    type="success"
                    title="安装完成"
                    message="恭喜，系统已安装完成！"
                    iconCode="ri:check-fill"
                    class="art-result-page-success"
                  >
                    <template #content>
                      <p>如重新安装，请删除数据库配置文件。</p>
                    </template>
                  </ArtResultPage>
                </div>
              </div>
            </ElWatermark>
            <!-- 步骤按钮区 -->
            <div class="step-actions mt-2 flex justify-between px-4">
              <ElButton v-if="active > 0 && active < 4" @click="prev">上一步</ElButton>
              <div class="flex-1"></div>
              <ElButton v-if="active < 4" type="primary" :disabled="nextDisabled" @click="next">{{
                active === 3 ? '完成' : '下一步'
              }}</ElButton>
              <ElButton v-else type="primary" @click="finish">进入系统</ElButton>
            </div>
          </ElCard>
        </div>
      </div>

      <div class="text-wrap">
        <p>
          {{ systemConfig.systemInfo.copyright }}
        </p>
      </div>

      <!-- 几何装饰元素 -->
      <div class="geometric-decorations">
        <!-- 基础几何形状 -->
        <div
          class="geo-element circle-outline animate-fade-in-up"
          style="animation-delay: 0s"
        ></div>
        <div
          class="geo-element square-rotated animate-fade-in-left"
          style="animation-delay: 0s"
        ></div>
        <div
          class="geo-element circle-small animate-fade-in-up"
          style="animation-delay: 0.3s"
        ></div>

        <div
          class="geo-element square-bottom-right animate-fade-in-right"
          style="animation-delay: 0s"
        ></div>

        <!-- 背景泡泡 -->
        <div class="geo-element bg-bubble animate-scale-in" style="animation-delay: 0.5"></div>

        <!-- 太阳/月亮 -->
        <div
          class="geo-element circle-top-right animate-fade-in-down"
          style="animation-delay: 0.5"
          @click="themeAnimation"
        >
        </div>

        <!-- 装饰点 -->
        <div
          class="geo-element dot dot-top-left animate-bounce-in"
          style="animation-delay: 0s"
        ></div>
        <div
          class="geo-element dot dot-top-right animate-bounce-in"
          style="animation-delay: 0s"
        ></div>
        <div
          class="geo-element dot dot-center-right animate-bounce-in"
          style="animation-delay: 0s"
        ></div>

        <!-- 叠加方块组 -->
        <div class="squares-group">
          <i
            class="geo-element square square-blue animate-fade-in-left-rotated-blue"
            style="animation-delay: 0.2s"
          ></i>
          <i
            class="geo-element square square-pink animate-fade-in-left-rotated-pink"
            style="animation-delay: 0.4s"
          ></i>
          <i
            class="geo-element square square-purple animate-fade-in-left-no-rotation"
            style="animation-delay: 0.6s"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useSystemStore } from '@/store/modules/system'
  import request from '@/utils/http'
  import { themeAnimation } from '@/utils/ui/animation'
  import { useSettingStore } from '@/store/modules/setting'
  import NProgress from 'nprogress'

  const fetchLicense = async () => {
    return request.get({
      url: '/webniu/admin/install/license'
    })
  }
  const fetchDetection = async () => {
    return request.get({
      url: '/webniu/admin/install/detection'
    })
  }
  const fetchDatabase = async (dbForm: any) => {
    return request.post({
      url: '/webniu/admin/install/database',
      data: dbForm
    })
  }
  const fetchManager = async (dbForm: any) => {
    return request.post({
      url: '/webniu/admin/install/manager',
      data: dbForm
    })
  }

  const settingStore = useSettingStore()
  const { systemThemeColor } = storeToRefs(settingStore)
  const color = systemThemeColor
  const active = ref(0)
  const licenseChecked = ref(false)
  const licenseContent = ref('')
  const systemStore = useSystemStore()
  const systemConfig = systemStore.systemConfig

  onMounted(async () => {
    try {
      const response = await fetchLicense()
      licenseContent.value = response as string
    } catch (error) {
      console.error('获取许可协议失败', error)
    }
  })
  const dbForm = ref({
    host: 'localhost',
    port: '3306',
    user: '',
    password: '',
    database: '',
    prefix: 'wn_',
    overwrite: false
  })
  const detection = ref('1')
  const dbRules = {
    host: [{ required: true, message: '请输入数据库主机', trigger: 'blur' }],
    port: [{ required: true, message: '请输入数据库端口', trigger: 'blur' }],
    user: [{ required: true, message: '请输入数据库用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入数据库密码', trigger: 'blur' }],
    database: [{ required: true, message: '请输入数据库名称', trigger: 'blur' }],
    prefix: [{ required: true, message: '请输入数据库前缀', trigger: 'blur' }]
  }
  const dbFormRef = ref()
  const adminForm = ref({ username: '', password: '', password_confirm: '' })
  const adminRules = {
    username: [{ required: true, message: '请输入管理员用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    password_confirm: [
      { required: true, message: '两次输入密码不一致', trigger: 'blur' },
      {
        validator: (rule: any, value: string, callback: any) => {
          if (value !== adminForm.value.password) {
            callback(new Error('两次输入密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
  const adminFormRef = ref()
  const environment = ref<Api.Install.EnvironmentItem[]>()
  const catalogue = ref<Api.Install.CatalogueItem[]>()
  const nextDisabled = computed(() => {
    if (active.value === 0) return !licenseChecked.value
    return false
  })

  const next = async () => {
    if (active.value === 0) {
      if (!licenseChecked.value) return
      try {
        NProgress.start()
        const response = (await fetchDetection()) as Api.Install.DetectionResponse
        environment.value = response.environment
        catalogue.value = response.catalogue
        NProgress.done()
        active.value++
      } catch (error) {
        NProgress.done()
        active.value++
        ElMessage.error({
          message: `环境检查失败`,
          duration: 5000
        })
        console.error('环境监测失败', error)
      }
    } else if (active.value === 1) {
      NProgress.start()
      active.value++
      NProgress.done()
    } else if (active.value === 2) {
      dbFormRef.value?.validate(async (valid: boolean) => {
        if (!valid) return
        try {
          NProgress.start()
          await fetchDatabase(dbForm.value)
          NProgress.done()
          ElMessage.success({
            message: `数据库配置成功`,
            duration: 3000
          })
          active.value++
        } catch (error) {
          NProgress.done()
          console.error('数据库配置失败', error)
        }
      })
    } else if (active.value === 3) {
      adminFormRef.value?.validate(async (valid: boolean) => {
        if (!valid) {
          return
        }
        try {
          NProgress.start()
          await fetchManager(adminForm.value)
          NProgress.done()
          active.value += 2
        } catch (error) {
          NProgress.done()
          console.error('数据库配置失败', error)
        }
      })
    }
  }
  const prev = () => {
    if (active.value > 0) active.value--
  }
  const finish = () => {
    // 跳转或其他逻辑
    window.location.href = window.location.pathname
  }

  const handleLicenseScroll = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    if (textarea.scrollHeight - textarea.scrollTop <= textarea.clientHeight + 10) {
      licenseChecked.value = true
    }
  }
  // 定义 props
  defineProps<{
    hideContent?: boolean // 是否隐藏内容，只显示 logo
  }>()
</script>

<style lang="scss" scoped>
  .step-content {
    min-height: 260px;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 10px;
  }
  .license-box {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 6px;
    width: 100%;
    height: 300px;
    resize: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
  }
  :deep(.art-result-page-success) {
    border-top: 0 !important; /* 清除顶部边框 */
    border-right: 0 !important; /* 清除右侧边框 */
    border-bottom: 0 !important; /* 清除底部边框 */
    border-left: 0 !important; /* 清除左侧边框 */
  }
  :deep(.art-result-page-success .res) {
    padding: 10px;
  }
  :deep(.art-result-page-success .btn-group) {
    margin-top: 20px;
  }
  .color-dots {
    pointer-events: none;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 12px var(--art-gray-300);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
    transform: translateX(10px);
  }

  .color-dot {
    box-shadow: 0 2px 4px rgb(0 0 0 / 15%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: calc(var(--index) * 0.05s);
    transform: translateX(20px) scale(0.8);
  }

  .padding-4-10 {
    padding-left: 15px;
  }

  .color-dot:hover {
    box-shadow: 0 4px 8px rgb(0 0 0 / 20%);
    transform: translateX(0) scale(1.1);
  }

  .color-picker-expandable:hover .color-dots {
    pointer-events: auto;
    opacity: 1;
    transform: translateX(0);
  }

  .color-picker-expandable:hover .color-dot {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  .dark .color-dots {
    background-color: var(--art-gray-200);
    box-shadow: none;
  }

  .color-picker-expandable:hover .palette-btn :deep(.art-svg-icon) {
    color: v-bind(color);
  }

  :deep(.el-step__head.is-success) {
    border-color: v-bind(color);
    color: v-bind(color);
  }

  :deep(.el-step__title.is-success) {
    color: v-bind(color);
  }

  // 颜色变量定义
  $primary-light-7: var(--el-color-primary-light-7);
  $primary-light-8: var(--el-color-primary-light-8);
  $primary-light-9: var(--el-color-primary-light-9);
  $primary-base: var(--el-color-primary);
  $main-bg: var(--default-box-color);

  // 混合颜色函数
  $bg-mix-light-9: color-mix(in srgb, $primary-light-9 100%, $main-bg);
  $bg-mix-light-8: color-mix(in srgb, $primary-light-8 80%, $main-bg);
  $bg-mix-light-7: color-mix(in srgb, $primary-light-7 80%, $main-bg);

  .login-left-view {
    position: relative;
    box-sizing: border-box;
    width: 100vw;
    height: 100%;
    padding: 0px;
    overflow: hidden;
    background-color: $bg-mix-light-9;

    .logo {
      position: relative;
      z-index: 100;
      display: flex;
      top: 15px;
      left: 15px;
      align-items: center;

      .title {
        margin-left: 10px;
        font-size: 20px;
        font-weight: 400;
      }
    }

    .left-img {
      position: absolute;
      inset: 0 0 10.5%;
      z-index: 10;
      width: 70%;
      margin: 90px auto;
      animation: slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }

    .text-wrap {
      position: absolute;
      bottom: 80px;
      width: 100%;
      text-align: center;
      animation: slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

      h1 {
        font-size: 24px;
        font-weight: 400;
        color: var(--art-gray-900) !important;
      }

      p {
        margin-top: 10px;
        font-size: 14px;
        color: var(--art-gray-600) !important;
      }
    }

    .geometric-decorations {
      .geo-element {
        position: absolute;
        opacity: 0;
        animation-fill-mode: forwards;
        animation-duration: 0.8s;
        animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      // 动画 mixin
      @mixin fadeAnimation($direction: '', $rotation: 0deg) {
        from {
          opacity: 0;

          @if $direction == 'up' {
            transform: translateY(30px) rotate($rotation);
          } @else if $direction == 'down' {
            transform: translateY(-30px) rotate($rotation);
          } @else if $direction == 'left' {
            transform: translateX(-30px) rotate($rotation);
          } @else if $direction == 'right' {
            transform: translateX(30px) rotate($rotation);
          }
        }

        to {
          opacity: 1;

          @if $direction == 'up' or $direction == 'down' {
            transform: translateY(0) rotate($rotation);
          } @else {
            transform: translateX(0) rotate($rotation);
          }
        }
      }

      // 动画定义
      @keyframes fadeInUp {
        @include fadeAnimation('up');
      }

      @keyframes fadeInDown {
        @include fadeAnimation('down');
      }

      @keyframes fadeInLeft {
        @include fadeAnimation('left');
      }

      @keyframes fadeInLeftRotated {
        @include fadeAnimation('left', -25deg);
      }

      @keyframes fadeInRight {
        @include fadeAnimation('right');
      }

      @keyframes fadeInRightRotated {
        @include fadeAnimation('right', 45deg);
      }

      @keyframes fadeInLeftRotatedBlue {
        @include fadeAnimation('left', -10deg);
      }

      @keyframes fadeInLeftRotatedPink {
        @include fadeAnimation('left', 10deg);
      }

      @keyframes fadeInLeftNoRotation {
        @include fadeAnimation('left');
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }

        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes bounceIn {
        0% {
          opacity: 0;
          transform: scale(0.3);
        }

        50% {
          opacity: 1;
          transform: scale(1.05);
        }

        70% {
          transform: scale(0.9);
        }

        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes lineGrow {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }

        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      // 动画类
      .animate-fade-in-up {
        animation-name: fadeInUp;
      }

      .animate-fade-in-down {
        animation-name: fadeInDown;
      }

      .animate-fade-in-left {
        animation-name: fadeInLeft;
      }

      .animate-fade-in-right {
        animation-name: fadeInRight;
      }

      .animate-scale-in {
        animation-name: scaleIn;
        animation-duration: 1.2s;
      }

      .animate-bounce-in {
        animation-name: bounceIn;
        animation-duration: 0.6s;
      }

      .animate-fade-in-left-rotated-blue {
        animation-name: fadeInLeftRotatedBlue;
      }

      .animate-fade-in-left-rotated-pink {
        animation-name: fadeInLeftRotatedPink;
      }

      .animate-fade-in-left-no-rotation {
        animation-name: fadeInLeftNoRotation;
      }

      // 基础几何形状
      .circle-outline {
        top: 10%;
        left: 25%;
        width: 42px;
        height: 42px;
        border: 2px solid $primary-light-8;
        border-radius: 50%;
      }

      .square-rotated {
        top: 50%;
        left: 16%;
        width: 60px;
        height: 60px;
        background-color: $bg-mix-light-8;

        &.animate-fade-in-left {
          animation-name: fadeInLeftRotated;
        }
      }

      .circle-small {
        bottom: 26%;
        left: 30%;
        width: 18px;
        height: 18px;
        background-color: $primary-light-8;
        border-radius: 50%;
      }

      // 太阳/月亮效果
      .circle-top-right {
        top: 3%;
        right: 3%;
        z-index: 100;
        width: 50px;
        height: 50px;
        cursor: pointer;
        background: $bg-mix-light-7;
        border-radius: 50%;
        transition: all 0.3s;

        &::after {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          content: '';
          background: linear-gradient(to right, #fcbb04, #fffc00);
          border-radius: 50%;
          opacity: 0;
          transition: all 0.5s;
          transform: translate(-50%, -50%);
        }

        &:hover {
          box-shadow: 0 0 36px #fffc00;

          &::after {
            opacity: 1;
          }
        }
      }

      .square-bottom-right {
        right: 10%;
        bottom: 10%;
        width: 50px;
        height: 50px;
        background-color: $primary-light-8;

        &.animate-fade-in-right {
          animation-name: fadeInRightRotated;
        }
      }

      // 背景泡泡
      .bg-bubble {
        top: -120px;
        right: -120px;
        width: 360px;
        height: 360px;
        background-color: $bg-mix-light-8;
        border-radius: 50%;
      }

      // 装饰点
      .dot {
        width: 14px;
        height: 14px;
        background-color: $primary-light-7;
        border-radius: 50%;

        &.dot-top-left {
          top: 140px;
          left: 100px;
        }

        &.dot-top-right {
          top: 140px;
          right: 120px;
        }

        &.dot-center-right {
          top: 46%;
          right: 22%;
          background-color: $primary-light-8;
        }
      }

      // 叠加方块组
      .squares-group {
        position: absolute;
        bottom: 18px;
        left: 20px;
        width: 140px;
        height: 140px;
        pointer-events: none;

        .square {
          position: absolute;
          display: block;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgb(64 87 167 / 12%);

          &.square-blue {
            top: 12px;
            left: 30px;
            z-index: 2;
            width: 50px;
            height: 50px;
            background-color: rgb(from $primary-base r g b / 30%);
          }

          &.square-pink {
            top: 30px;
            left: 48px;
            z-index: 1;
            width: 70px;
            height: 70px;
            background-color: rgb(from $primary-base r g b / 15%);
          }

          &.square-purple {
            top: 66px;
            left: 86px;
            z-index: 3;
            width: 32px;
            height: 32px;
            background-color: rgb(from $primary-base r g b / 45%);
          }
        }

        // 装饰线条
        &::after {
          position: absolute;
          top: 86px;
          left: 72px;
          width: 80px;
          height: 1px;
          content: '';
          background: linear-gradient(90deg, var(--el-color-primary-light-6), transparent);
          opacity: 0;
          transform: rotate(50deg);
          animation: lineGrow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: 1.2s;
        }
      }
    }

    @media only screen and (width <=1600px) {
      width: 100vw;

      .text-wrap {
        bottom: 40px;
      }
    }
  }

  // 暗色主题
  .dark .login-left-view {
    background-color: color-mix(in srgb, $primary-light-9 60%, #070707);

    @media only screen and (width <=1180px) {
      background: transparent;
    }

    .geometric-decorations {
      // 月亮效果
      .circle-top-right {
        background-color: $bg-mix-light-8;
        box-shadow: 0 0 25px #333 inset;
        transition: all 0.3s ease-in-out 0.1s;
        rotate: -48deg;

        &::before {
          position: absolute;
          top: 0;
          left: 15px;
          width: 50px;
          height: 50px;
          content: '';
          background-color: $bg-mix-light-9;
          border-radius: 50%;
          transition: all 0.3s ease-in-out;
        }

        &:hover {
          background-color: transparent;
          box-shadow: 0 40px 25px #ddd inset;

          &::before {
            left: 18px;
          }

          &::after {
            opacity: 0;
          }
        }
      }

      .bg-bubble {
        background-color: $bg-mix-light-9;
      }

      // 其他元素颜色调整
      .square-rotated {
        background-color: $bg-mix-light-9;
      }

      .circle-small,
      .dot {
        background-color: $primary-light-8;
      }

      .square-bottom-right {
        background-color: $primary-light-9;
      }

      .dot.dot-top-right {
        background-color: $primary-light-8;
      }
    }

    // 方块组暗色调整
    .squares-group {
      .square {
        box-shadow: none;

        &.square-blue {
          background-color: rgb(from $primary-base r g b / 18%);
        }

        &.square-pink {
          background-color: rgb(from $primary-base r g b / 10%);
        }

        &.square-purple {
          background-color: rgb(from $primary-base r g b / 20%);
        }
      }

      &::after {
        background: linear-gradient(90deg, $primary-light-8, transparent);
      }
    }
  }
</style>
