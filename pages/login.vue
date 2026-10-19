<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
})

const { login, pending } = useAuth()

const mobile = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')

function normalizeMobile(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)),
    )
    .replace(/[٠-٩]/g, digit =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
    )
    .replace(/[\s-]/g, '')
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
      message?: string
    }

    if (err.data?.errors) {
      return Object.values(err.data.errors)
        .flat()
        .join(' ')
    }

    return err.data?.message
      || err.message
      || 'ورود انجام نشد. دوباره تلاش کن.'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

async function submitLogin() {
  errorMessage.value = ''

  try {
    const result = await login({
      mobile: normalizeMobile(mobile.value),
      password: password.value,
    })

    if (
      result.user.role === 'admin' ||
      result.user.role === 'super_admin'
    ) {
      await navigateTo('/admin')
    } else {
      await navigateTo('/dashboard')
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}
</script>

<template>
  <div class="auth-card">

    <div class="auth-header">
      <span class="badge">
        خوش برگشتی 👋
      </span>

      <h1>
        ورود به حساب
      </h1>

      <p>
        برای ادامه وارد حساب کاربری خودت شو.
      </p>
    </div>

    <form
      class="auth-form"
      @submit.prevent="submitLogin"
    >

      <div class="field">
        <label for="mobile">
          شماره موبایل
        </label>

        <input
          id="mobile"
          v-model="mobile"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="مثلاً 09123456789"
        />
      </div>

      <div class="field">
        <div class="label-row">
          <label for="password">
            رمز عبور
          </label>

            <NuxtLink
                to="/forgot-password"
                class="forgot-link"
                >
                رمز عبور را فراموش کرده‌ام
            </NuxtLink>
        </div>

        <div class="password-input">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="رمز عبور"
          />

          <button
            type="button"
            class="show-password"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'مخفی' : 'نمایش' }}
          </button>
        </div>
      </div>
        <p
  v-if="errorMessage"
  class="form-error"
  role="alert"
>
  {{ errorMessage }}
      </p>

      <button
  type="submit"
  class="submit-btn"
  :disabled="pending"
>
  {{ pending ? 'در حال ورود...' : 'ورود' }}
      </button>

    </form>

    <div class="divider">
      <span>یا</span>
    </div>

    <p class="register-text">
      حساب کاربری نداری؟

      <NuxtLink to="/register">
        ثبت‌نام کن
      </NuxtLink>
    </p>

  </div>
</template>

<style scoped>
.auth-card {
  width: min(440px, 100%);

  padding: 38px;

  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 26px;

  box-shadow:
    0 25px 70px rgba(30, 25, 70, 0.08);
}

/* Header */

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.badge {
  display: inline-flex;

  padding: 7px 13px;

  border-radius: 999px;

  background: #f0eeff;
  color: var(--color-primary);

  font-size: 11px;
  font-weight: 700;
}

.auth-header h1 {
  margin: 15px 0 8px;

  font-size: 30px;
  font-weight: 800;
}

.auth-header p {
  margin: 0;

  color: var(--color-muted);

  font-size: 12px;
  line-height: 2;
}

/* Form */

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label {
  margin-bottom: 8px;

  font-size: 12px;
  font-weight: 700;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.forgot-link {
  color: var(--color-primary);

  font-size: 10px;
}

.field input {
  width: 100%;
  height: 50px;

  padding: 0 14px;

  border: 1px solid #e3e3ea;
  border-radius: 13px;

  outline: none;

  background: #ffffff;
  color: var(--color-text);

  font-family: inherit;
  font-size: 13px;

  transition: 0.2s ease;
}

.field input:focus {
  border-color: var(--color-primary);

  box-shadow:
    0 0 0 3px rgba(109, 93, 252, 0.08);
}

.field input::placeholder {
  color: #aaaab3;
}

/* Password */

.password-input {
  position: relative;
}

.password-input input {
  padding-left: 65px;
}

.show-password {
  position: absolute;

  left: 10px;
  top: 50%;

  transform: translateY(-50%);

  padding: 5px 7px;

  border-radius: 7px;

  background: transparent;
  color: var(--color-primary);

  font-family: inherit;
  font-size: 10px;
  font-weight: 700;

  cursor: pointer;
}

/* Submit */

.submit-btn {
  width: 100%;
  height: 50px;

  border-radius: 13px;

  background: var(--color-primary);
  color: #ffffff;

  font-family: inherit;
  font-size: 13px;
  font-weight: 700;

  cursor: pointer;

  transition: 0.2s ease;
}

.submit-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Divider */

.divider {
  position: relative;

  margin: 28px 0;

  text-align: center;
}

.divider::before {
  content: '';

  position: absolute;

  top: 50%;
  right: 0;

  width: 100%;
  height: 1px;

  background: #eeeeee;
}
.form-error {
  padding: 12px;
  border-radius: 10px;
  background: #fef3f2;
  color: #b42318;
  font-size: 12px;
  line-height: 1.9;
}

.divider span {
  position: relative;
  z-index: 1;

  padding: 0 12px;

  background: #ffffff;

  color: #9999a3;

  font-size: 10px;
}

.register-text {
  margin: 0;

  color: var(--color-muted);

  font-size: 12px;
  text-align: center;
}

.register-text a {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 500px) {
  .auth-card {
    padding: 28px 20px;
  }

  .auth-brand {
    padding: 20px;
  }
}
</style>