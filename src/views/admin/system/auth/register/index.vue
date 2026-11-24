<!-- 注册页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form wn-gicai-register">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>
          <ElForm
            class="mt-7.5"
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
          >
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                v-model.trim="formData.username"
                :placeholder="$t('register.placeholder.username')"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder.password')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                class="custom-height"
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder.confirmPassword')"
                type="password"
                autocomplete="off"
                @keyup.enter="register"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="nickname">
              <ElInput
                class="custom-height"
                v-model.trim="formData.nickname"
                placeholder="请输入昵称"
              />
            </ElFormItem>

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

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                {{ $t('register.agreeText') }}
                <RouterLink
                  style="color: var(--theme-color); text-decoration: none"
                  to="/privacy-policy"
                  >{{ $t('register.privacyPolicy') }}</RouterLink
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-g-600">
              <span>{{ $t('register.hasAccount') }}</span>
              <RouterLink class="text-theme" :to="{ name: 'Login' }">{{
                $t('register.toLogin')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { FormInstance, FormRules } from 'element-plus'
  import { post } from '@/api/common-request'
  import { useSystemStore } from '@/store/modules/system'

  // 验证码基础 URL（可配置化）
  const CAPTCHA_URL = '/app/webniu/account/captcha/image-register'
  // 生成带时间戳的验证码 URL（防止缓存）
  const getCaptchaSrc = () => `${CAPTCHA_URL}?v=${Date.now()}`
  // 验证码图片源
  const captchaSrc = ref(getCaptchaSrc())
  // 切换验证码
  const switchCaptcha = () => {
    captchaSrc.value = getCaptchaSrc()
  }

  defineOptions({ name: 'Register' })

  interface RegisterForm {
    username: string
    password: string
    nickname: string
    email: string
    mobile: string
    confirmPassword: string
    agreement: boolean
    captcha: string
  }
  const systemStore = useSystemStore()
  const systemConfig = systemStore.systemConfig
  const USERNAME_MAX_LENGTH = 20
  const REDIRECT_DELAY = 1000

  const { t, locale } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()

  const loading = ref(false)
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const formData = reactive<RegisterForm>({
    username: '',
    password: '',
    nickname: '',
    email: '',
    mobile: '',
    confirmPassword: '',
    agreement: false,
    captcha: ''
  })

  /**
   * 验证密码
   * 当密码输入后，如果确认密码已填写，则触发确认密码的验证
   */
  const validatePassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.placeholder.password')))
      return
    }

    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }

    callback()
  }

  /**
   * 验证确认密码
   * 检查确认密码是否与密码一致
   */
  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error(t('register.rule.confirmPasswordRequired')))
      return
    }

    if (value !== formData.password) {
      callback(new Error(t('register.rule.passwordMismatch')))
      return
    }

    callback()
  }

  /**
   * 验证用户协议
   * 确保用户已勾选同意协议
   */
  const validateAgreement = (_rule: any, value: boolean, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule.agreementRequired')))
      return
    }
    callback()
  }
  const email = computed(() => systemConfig.systemSetting.forgetPassword || false)
  const mobile = computed(() => systemConfig.systemSetting.m_phone_verify || false)
  const rules = computed<FormRules<RegisterForm>>(() => ({
    username: [
      { required: true, message: t('register.placeholder.username'), trigger: 'blur' },
      {
        min: 6,
        max: USERNAME_MAX_LENGTH,
        message: '用户名长度必须在6到20个字符之间',
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, validator: validatePassword, trigger: 'blur' },
      { min: 6, message: '密码长度必须在6到20个字符之间', trigger: 'blur' }
    ],
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      {
        min: 2,
        max: USERNAME_MAX_LENGTH,
        message: '昵称长度必须在2到20个字符之间',
        trigger: 'blur'
      }
    ],
    email: [
      {
        required: email.value,
        message: '请输入邮箱',
        trigger: 'blur'
      },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    mobile: [
      {
        required: mobile.value,
        message: '请输入手机号',
        trigger: 'blur'
      },
      //验证手机号格式是否正确
      {
        validator: (rule: any, value: string, callback: (error?: Error) => void) => {
          if (!/^1[3456789]\d{9}$/.test(value)) {
            callback(new Error('请输入正确的手机号格式'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
    captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    agreement: [{ validator: validateAgreement, trigger: 'change' }]
  }))

  /**
   * 注册用户
   * 验证表单后提交注册请求
   */
  const register = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    try {
      loading.value = true
      await post('/webniu/admin/account/register', formData)
      loading.value = false
      ElMessage.success('注册成功')
      toLogin()
    } catch (error) {
      switchCaptcha()
      console.error('表单验证失败:', error)
      loading.value = false
    }
  }

  /**
   * 跳转到登录页面
   */
  const toLogin = () => {
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, REDIRECT_DELAY)
  }
</script>

<style scoped>
  @import '../login/style.css';
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
