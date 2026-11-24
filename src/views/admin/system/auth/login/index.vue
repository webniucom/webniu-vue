<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>
            <div class="mt-4 wn-gicai-login" v-if="isShowCaptcha">
              <ElFormItem prop="captcha">
                <ElInput
                  v-model.trim="formData.captcha"
                  class="custom-height switchCaptcha"
                  placeholder="请输入验证码"
                >
                  <template #append
                    ><img class="codeImage" :src="captchaSrc" @click="switchCaptcha"
                  /></template>
                </ElInput>
              </ElFormItem>
            </div>
            <!-- 推拽验证 -->
            <div class="relative pb-5 mt-6" v-if="isShowDragVerify">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-700)"
                  :successText="$t('login.sliderSuccessText')"
                  progressBarBg="var(--main-color)"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink
                class="text-theme"
                v-if="systemConfig.systemSetting.forgetPassword"
                :to="{ name: 'ForgetPassword' }"
                >{{ $t('login.forgetPwd') }}</RouterLink
              >
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600" v-if="systemConfig.systemSetting.isRegister">
              <span>{{ $t('login.noAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">{{
                $t('login.register')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'
  import { useSystemStore } from '@/store/modules/system'

  defineOptions({ name: 'Login' })

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)
  const { t, locale } = useI18n()
  const formKey = ref(0)
  const systemStore = useSystemStore()
  const systemConfig = systemStore.systemConfig
  // 验证码基础 URL（可配置化）
  const CAPTCHA_URL = '/app/webniu/account/captcha/image-login'
  // 生成带时间戳的验证码 URL（防止缓存）
  const getCaptchaSrc = () => `${CAPTCHA_URL}?v=${Date.now()}`
  // 验证码图片源
  const captchaSrc = ref(getCaptchaSrc())
  // 切换验证码
  const switchCaptcha = () => {
    captchaSrc.value = getCaptchaSrc()
  }
  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const dragVerify = ref()

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const isPassing = ref(false)
  const isClickPass = ref(false)
  const isShowCaptcha = ref(systemConfig.systemSetting.isCaptcha)
  const isShowDragVerify = ref(!systemConfig.systemSetting.isCaptcha)

  const systemName = ref('')
  const formRef = ref<FormInstance>()

  const formData = reactive({
    account: '',
    username: '',
    password: '',
    captcha: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }],
    captcha: [{ required: true, message: t('login.placeholder.captcha'), trigger: 'blur' }]
  }))

  const loading = ref(false)

  onMounted(() => {})

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      // 拖拽验证
      if (isShowDragVerify.value && !isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      // 登录请求
      const { username, password } = formData

      const { token, refreshToken, nickname, redirection } = await fetchLogin({
        username: username,
        password,
        captcha: formData.captcha
      })
      systemName.value = nickname
      // 验证token
      if (!token) {
        throw new Error('Login failed - no token received')
      }

      // 存储 token 和登录状态
      userStore.setToken(token, refreshToken)
      userStore.setLoginStatus(true)

      // 登录成功处理
      showLoginSuccessNotice()

      // 获取 redirect 参数，如果存在则跳转到指定页面，否则跳转到首页
      const redirect = route.query.redirect as string
      if (redirection) {
        if (/^https?:\/\//.test(redirection)) {
          window.location.href = redirection
        } else {
          router.push(redirection)
        }
      } else {
        if (redirect && /^https?:\/\//.test(redirect)) {
          window.location.href = redirect
        } else {
          router.push(redirect || '/')
        }
      }
    } catch (error) {
      // 处理 HttpError
      if (error instanceof HttpError) {
        switchCaptcha()
      } else {
        // 处理非 HttpError
        ElMessage.error('登录失败，请稍后重试')
        console.error('[Login] Unexpected error:', error)
        switchCaptcha()
      }
    } finally {
      loading.value = false
      if (isShowDragVerify.value) {
        resetDragVerify()
      }
    }
  }

  // 重置拖拽验证
  const resetDragVerify = () => {
    dragVerify.value.reset()
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName.value}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
  .codeImage {
    width: 120px;
    border-radius: 0px 5px 5px 0px;
    height: 38px;
    margin-right: 1px;
    cursor: pointer;
  }
</style>
<style>
  .switchCaptcha .el-input-group__append {
    padding: 0px !important;
  }
</style>
