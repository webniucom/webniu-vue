<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">重置密码</h3>
          <p class="sub-title">请输入新密码和验证码，重置密码</p>
          <div class="mt-5">
            <span class="input-label" v-if="showInputLabel">账号</span>
            <ElInput
              class="custom-height"
              type="password"
              placeholder="请输入新密码"
              v-model.trim="password"
            />

            <ElInput
              class="custom-height mt-4"
              type="password"
              placeholder="请确认新密码"
              v-model.trim="confirm_password"
            />

            <ElInput
              v-model.trim="captcha"
              class="custom-height mt-4 switchCaptcha"
              placeholder="请输入验证码"
            >
              <template #append
                ><img class="codeImage" :src="captchaSrc" @click="switchCaptcha"
              /></template>
            </ElInput>
          </div>

          <div style="margin-top: 15px">
            <ElButton
              class="w-full custom-height"
              type="primary"
              @click="resetPassword"
              :loading="loading"
              v-ripple
            >
              {{ $t('forgetPassword.submitBtnText') }}
            </ElButton>
          </div>

          <div style="margin-top: 15px">
            <ElButton class="w-full custom-height" plain @click="toLogin">
              {{ $t('forgetPassword.backBtnText') }}
            </ElButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { post } from '@/api/common-request'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'ForgetPassword' })

  const router = useRouter()
  const showInputLabel = ref(false)

  // 验证码基础 URL（可配置化）
  const CAPTCHA_URL = '/app/webniu/account/captcha/image-reset'
  // 生成带时间戳的验证码 URL（防止缓存）
  const getCaptchaSrc = () => `${CAPTCHA_URL}?v=${Date.now()}`
  // 验证码图片源
  const captchaSrc = ref(getCaptchaSrc())
  // 切换验证码
  const switchCaptcha = () => {
    captchaSrc.value = getCaptchaSrc()
  }

  const password = ref('')
  const confirm_password = ref('')
  const captcha = ref('')
  const loading = ref(false)

  const resetPassword = async () => {
    if (!password.value) {
      ElMessage.error('请输入新密码')
      return
    }
    if (!confirm_password.value) {
      ElMessage.error('请确认新密码')
      return
    }
    if (password.value !== confirm_password.value) {
      ElMessage.error('两次输入密码不一致')
      return
    }
    if (!captcha.value) {
      ElMessage.error('请输入验证码')
      return
    }
    loading.value = true
    try {
      await post('/webniu/admin/account/reset', {
        password: password.value,
        captcha: captcha.value,
        confirm_password: confirm_password.value,
        token: router.currentRoute.value.query.token as string
      })
      ElMessage.success('重置密码成功')
      router.push({ name: 'Login' })
    } catch (error: any) {
      switchCaptcha()
      return error.message
    } finally {
      loading.value = false
    }
  }
  const toLogin = () => {
    router.push({ name: 'Login' })
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
