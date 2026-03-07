<template>
  <div class="login-container">
    <div class="background-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div ref="loginCard" class="login-card">
      <div class="login-header">
        <h1 class="login-title">Vue3 Vite7 App</h1>
        <p class="login-subtitle">欢迎回来，请登录您的账号</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        label-position="top"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>

        <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">登 录</el-button>
      </el-form>

      <div class="social-login">
        <p class="social-text">或者使用以下方式登录</p>
        <div class="social-icons">
          <div class="social-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="social-icon">
            <el-icon><Share /></el-icon>
          </div>
          <div class="social-icon">
            <el-icon><Connection /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { useUserStore } from '@/store/modules/user'
import { showToast } from '@/utils/toast'

const router = useRouter()
const userStore = useUserStore()

const loginCard = ref(null)
const loginFormRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.loginAction(loginForm)
        showToast('登录成功', 'success')
        router.push('/')
      } catch (error) {
        console.error(error)
        // 错误已经在 request.js 中通过 toast 提示
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  // 页面加载动画
  gsap.from('.login-card', {
    duration: 1,
    y: 100,
    opacity: 0,
    ease: 'power3.out'
  })

  gsap.from('.shape', {
    duration: 2,
    scale: 0,
    opacity: 0,
    stagger: 0.2,
    ease: 'elastic.out(1, 0.3)'
  })

  gsap.from('.login-title, .login-subtitle', {
    duration: 1,
    x: -50,
    opacity: 0,
    stagger: 0.1,
    delay: 0.5,
    ease: 'power2.out'
  })

  gsap.from('.el-form-item', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    stagger: 0.1,
    delay: 0.8,
    ease: 'power2.out'
  })
})
</script>

<style lang="scss" scoped>
@import 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;600&display=swap';

.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: 'Open Sans', sans-serif;
  background-color: #fdf2f8;
}

.background-shapes {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;

  .shape {
    position: absolute;
    filter: blur(40px);
    border-radius: 50%;
  }

  .shape-1 {
    top: -10%;
    right: -5%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #db2777 0%, rgb(219 39 119 / 0%) 70%);
    opacity: 0.4;
  }

  .shape-2 {
    bottom: -10%;
    left: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #f472b6 0%, rgb(244 114 182 / 0%) 70%);
    opacity: 0.3;
  }

  .shape-3 {
    top: 40%;
    left: 15%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #ca8a04 0%, rgb(202 138 4 / 0%) 70%);
    opacity: 0.2;
  }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  padding: 48px;
  background: rgb(255 255 255 / 70%);
  backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 5%);
}

.login-header {
  margin-bottom: 32px;
  text-align: center;

  .login-title {
    margin: 0 0 8px;
    font-family: Poppins, sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #831843;
    background: linear-gradient(135deg, #831843 0%, #db2777 100%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .login-subtitle {
    margin: 0;
    font-size: 16px;
    color: #9d174d;
    opacity: 0.8;
  }
}

.login-form {
  :deep(.el-form-item__label) {
    margin-bottom: 4px;
    font-weight: 600;
    color: #831843;
  }

  :deep(.el-input__wrapper) {
    padding: 8px 12px;
    background-color: rgb(255 255 255 / 50%);
    border: 1px solid rgb(219 39 119 / 10%);
    border-radius: 12px;
    box-shadow: none !important;
    transition: all 0.3s ease;

    &.is-focus {
      background-color: #fff;
      border-color: #db2777;
      box-shadow: 0 0 0 4px rgb(219 39 119 / 10%) !important;
    }
  }

  :deep(.el-input__inner) {
    height: 40px;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  :deep(.el-checkbox__label) {
    color: #831843;
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #db2777;
    border-color: #db2777;
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
  border: none;
  border-radius: 12px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #f472b6 0%, #db2777 100%);
    box-shadow: 0 4px 12px rgb(219 39 119 / 30%);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.social-login {
  margin-top: 32px;
  text-align: center;

  .social-text {
    position: relative;
    margin-bottom: 20px;
    font-size: 14px;
    color: #9d174d;
    opacity: 0.6;

    &::before,
    &::after {
      position: absolute;
      top: 50%;
      width: 20%;
      height: 1px;
      content: '';
      background: rgb(219 39 119 / 20%);
    }

    &::before {
      left: 0;
    }

    &::after {
      right: 0;
    }
  }

  .social-icons {
    display: flex;
    gap: 16px;
    justify-content: center;

    .social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      font-size: 20px;
      color: #db2777;
      cursor: pointer;
      background: rgb(255 255 255 / 50%);
      border: 1px solid rgb(219 39 119 / 10%);
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        color: #fff;
        background: #db2777;
        transform: scale(1.1);
      }
    }
  }
}

// 响应式调整
@media (width <= 480px) {
  .login-card {
    padding: 32px 24px;
    margin: 20px;
  }

  .login-header .login-title {
    font-size: 28px;
  }
}
</style>
