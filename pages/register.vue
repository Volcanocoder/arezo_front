
<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
})

const { register, pending } = useAuth()

const fullName = ref('')
const email = ref('')
const mobile = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const agree = ref(false)

const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

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
      || 'ثبت‌نام انجام نشد. دوباره تلاش کن.'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

async function submitRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!agree.value) {
    errorMessage.value = 'لطفاً قوانین سایت را بپذیر.'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'رمز عبور و تکرار آن یکسان نیستند.'
    return
  }

  try {
    const result = await register({
      name: fullName.value.trim(),
      email: email.value.trim(),
      mobile: normalizeMobile(mobile.value),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    successMessage.value = result.message
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}
</script>

<template>
  <div class="auth-card">

    <div class="auth-header">
      <span class="badge">
        به آرزو خوش آمدی ❤️
      </span>

      <h1>
        ساخت حساب کاربری
      </h1>

      <p>
        برای ثبت آرزو یا کمک به دیگران حساب خودت را بساز.
      </p>
    </div>

    <form
      class="auth-form"
      @submit.prevent="submitRegister"
    >

      <div class="field">
        <label for="fullName">
          نام و نام خانوادگی
        </label>

        <input
          id="fullName"
          v-model="fullName"
          type="text"
          autocomplete="name"
          placeholder="مثلاً علی نامی"
        />
      </div>
      <div class="field">
        <label for="email">
    ایمیل
        </label>

        <input
    id="email"
    v-model="email"
    type="email"
    autocomplete="email"
    placeholder="مثلاً ali@example.com"
    required
        />
      </div>

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
        <label for="password">
          رمز عبور
        </label>

        <div class="password-input">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="حداقل ۸ کاراکتر"
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

      <div class="field">
        <label for="passwordConfirmation">
          تکرار رمز عبور
        </label>

        <div class="password-input">
          <input
            id="passwordConfirmation"
            v-model="passwordConfirmation"
            :type="
              showPasswordConfirmation
                ? 'text'
                : 'password'
            "
            autocomplete="new-password"
            placeholder="رمز عبور را دوباره وارد کنید"
          />

          <button
            type="button"
            class="show-password"
            @click="
              showPasswordConfirmation =
                !showPasswordConfirmation
            "
          >
            {{
              showPasswordConfirmation
                ? 'مخفی'
                : 'نمایش'
            }}
          </button>
        </div>
      </div>

      <label class="terms">
        <input
          v-model="agree"
          type="checkbox"
        />

        <span>
          قوانین و شرایط استفاده از سایت را می‌پذیرم.
        </span>
      </label>
      <p v-if="errorMessage" class="form-error" role="alert">
  {{ errorMessage }}
</p>

<p v-if="successMessage" class="form-success" role="status">
  {{ successMessage }}
</p> 
    <button
  type="submit"
  class="submit-btn"
  :disabled="!agree || pending"
>
  {{ pending ? 'در حال ساخت حساب...' : 'ساخت حساب' }}
    </button>

    </form>

    <div class="divider">
      <span>یا</span>
    </div>

    <p class="login-text">
      قبلاً حساب ساخته‌ای؟

      <NuxtLink to="/login">
        وارد شو
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

.auth-header {
  margin-bottom: 30px;
  text-align: center;
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

  font-size: 29px;
  font-weight: 800;
}

.auth-header p {
  margin: 0;

  color: var(--color-muted);

  font-size: 12px;
  line-height: 2;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 17px;
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

/* Terms */

.terms {
  display: flex;
  align-items: flex-start;

  gap: 9px;

  color: var(--color-muted);

  font-size: 10px;
  line-height: 1.9;

  cursor: pointer;
}

.terms input {
  margin-top: 2px;

  accent-color: var(--color-primary);

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

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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

.divider span {
  position: relative;
  z-index: 1;

  padding: 0 12px;

  background: #ffffff;

  color: #9999a3;

  font-size: 10px;
}

.form-error,
.form-success {
  padding: 12px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.9;
}

.form-error {
  color: #b42318;
  background: #fef3f2;
}

.form-success {
  color: #067647;
  background: #ecfdf3;
}

.login-text {
  margin: 0;

  color: var(--color-muted);

  font-size: 12px;
  text-align: center;
}

.login-text a {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 500px) {
  .auth-card {
    padding: 28px 20px;
  }

  .auth-header h1 {
    font-size: 26px;
  }
}
</style>