<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { forgotPassword, resetPassword, pending } = useAuth()

type Step = 'request' | 'reset' | 'done'

const step = ref<Step>('request')
const mobile = ref('')
const code = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const RESEND_SECONDS = 60

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s-]/g, '')
}

const normalizedMobile = computed(() => normalizeDigits(mobile.value))
const isValidMobile = computed(() => /^09\d{9}$/.test(normalizedMobile.value))

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: { message?: string, errors?: Record<string, string[]> }
      message?: string
    }

    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(' ')
    }

    return err.data?.message || err.message || 'درخواست انجام نشد. دوباره تلاش کن.'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

function startCooldown() {
  cooldown.value = RESEND_SECONDS

  if (timer) clearInterval(timer)

  timer = setInterval(() => {
    cooldown.value -= 1

    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function requestCode() {
  errorMessage.value = ''

  if (!isValidMobile.value) {
    errorMessage.value = 'شماره موبایل را به شکل 09123456789 وارد کن.'
    return
  }

  try {
    await forgotPassword(normalizedMobile.value)
    step.value = 'reset'
    startCooldown()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

async function resendCode() {
  if (cooldown.value > 0) return

  errorMessage.value = ''

  try {
    await forgotPassword(normalizedMobile.value)
    startCooldown()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

async function submitReset() {
  errorMessage.value = ''

  const normalizedCode = normalizeDigits(code.value)

  if (!/^\d{6}$/.test(normalizedCode)) {
    errorMessage.value = 'کد تأیید ۶ رقمی را کامل وارد کن.'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'رمز عبور و تکرار آن یکسان نیست.'
    return
  }

  try {
    await resetPassword({
      mobile: normalizedMobile.value,
      code: normalizedCode,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    step.value = 'done'
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

function changeMobile() {
  step.value = 'request'
  code.value = ''
  password.value = ''
  passwordConfirmation.value = ''
  errorMessage.value = ''
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="auth-card">

    <!-- مرحله ۱: شماره موبایل -->
    <template v-if="step === 'request'">

      <div class="auth-header">
        <span class="badge">
          بازیابی حساب
        </span>

        <h1>
          رمز عبورت را فراموش کردی؟
        </h1>

        <p>
          شماره موبایلی که با آن ثبت‌نام کرده‌ای را وارد کن تا کد بازیابی برایت پیامک شود.
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="requestCode"
      >

        <div class="field">
          <label for="mobile">
            شماره موبایل
          </label>

          <input
            id="mobile"
            v-model="mobile"
            type="tel"
            dir="ltr"
            inputmode="numeric"
            autocomplete="tel"
            placeholder="09123456789"
          />
        </div>

        <p v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="submit-btn"
          :disabled="!mobile.trim() || pending"
        >
          {{ pending ? 'در حال ارسال...' : 'ارسال کد بازیابی' }}
        </button>

      </form>

      <div class="back-login">
        <NuxtLink to="/login">
          ← بازگشت به ورود
        </NuxtLink>
      </div>

    </template>

    <!-- مرحله ۲: کد و رمز جدید -->
    <template v-else-if="step === 'reset'">

      <div class="auth-header">
        <span class="badge success-badge">
          کد ارسال شد
        </span>

        <h1>
          رمز جدید را بساز
        </h1>

        <p>
          اگر این شماره در آرزو ثبت شده باشد، کد ۶ رقمی به
          <strong dir="ltr">{{ normalizedMobile }}</strong>
          پیامک می‌شود.
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="submitReset"
      >

        <div class="field">
          <label for="code">
            کد تأیید
          </label>

          <input
            id="code"
            v-model="code"
            type="text"
            dir="ltr"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="______"
          />
        </div>

        <div class="field">
          <label for="password">
            رمز عبور جدید
          </label>

          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="حداقل ۸ کاراکتر"
          />
        </div>

        <div class="field">
          <label for="passwordConfirmation">
            تکرار رمز عبور
          </label>

          <input
            id="passwordConfirmation"
            v-model="passwordConfirmation"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="رمز را دوباره وارد کن"
          />
        </div>

        <label class="show-password-row">
          <input v-model="showPassword" type="checkbox" />
          نمایش رمز عبور
        </label>

        <p v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="submit-btn"
          :disabled="pending"
        >
          {{ pending ? 'در حال ذخیره...' : 'تغییر رمز عبور' }}
        </button>

      </form>

      <p class="resend-text">
        کد را دریافت نکردی؟

        <button
          type="button"
          :disabled="cooldown > 0 || pending"
          @click="resendCode"
        >
          {{ cooldown > 0 ? `ارسال مجدد تا ${cooldown} ثانیه دیگر` : 'ارسال مجدد' }}
        </button>
      </p>

      <p class="resend-text">
        <button type="button" @click="changeMobile">
          شماره را اشتباه وارد کردم
        </button>
      </p>

    </template>

    <!-- مرحله ۳: پایان -->
    <template v-else>

      <div class="success-icon">
        ✓
      </div>

      <div class="auth-header">
        <span class="badge success-badge">
          انجام شد
        </span>

        <h1>
          رمز عبور تغییر کرد
        </h1>

        <p>
          حالا می‌توانی با رمز جدید وارد حسابت شوی.
        </p>
      </div>

      <NuxtLink to="/login" class="submit-btn done-link">
        رفتن به صفحه ورود
      </NuxtLink>

    </template>

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

.success-badge {
  background: #eef8f2;
  color: #29915d;
}

.auth-header h1 {
  margin: 15px 0 10px;

  font-size: 27px;
  line-height: 1.5;
  font-weight: 800;
}

.auth-header p {
  margin: 0;

  color: var(--color-muted);

  font-size: 12px;
  line-height: 2;
}

.auth-header strong {
  color: var(--color-text);
  direction: ltr;
  display: inline-block;
}

/* Form */

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label,
.code-box label {
  margin-bottom: 8px;

  font-size: 12px;
  font-weight: 700;
}

.field input,
.code-box input {
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

.field input:focus,
.code-box input:focus {
  border-color: var(--color-primary);

  box-shadow:
    0 0 0 3px rgba(109, 93, 252, 0.08);
}

.field input::placeholder {
  color: #aaaab3;
}

/* Button */

.submit-btn {
  width: 100%;
  height: 50px;

  border: 0;
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

/* Back */

.back-login {
  margin-top: 25px;
  text-align: center;
}

.back-login a,
.back-login button {
  border: 0;

  background: transparent;
  color: var(--color-primary);

  font-family: inherit;
  font-size: 11px;
  font-weight: 700;

  cursor: pointer;
}

/* Success */

.success-icon {
  width: 72px;
  height: 72px;

  margin: 0 auto 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #eef8f2;
  color: #29915d;

  font-size: 30px;
  font-weight: 800;
}

/* Code */

.code-box {
  margin-bottom: 18px;
}

.code-box input {
  text-align: center;
  letter-spacing: 7px;
  font-size: 20px;
  font-weight: 700;
}

/* Resend */

.resend-text {
  margin: 20px 0 0;

  color: var(--color-muted);

  font-size: 11px;
  text-align: center;
}

.resend-text button {
  border: 0;

  padding: 0;

  background: transparent;
  color: var(--color-primary);

  font-family: inherit;
  font-size: inherit;
  font-weight: 700;

  cursor: pointer;
}

@media (max-width: 500px) {
  .auth-card {
    padding: 28px 20px;
  }

  .auth-header h1 {
    font-size: 24px;
  }
}

.form-error {
  margin: 0;
  padding: 10px 12px;

  border-radius: 10px;

  background: #fff1f1;
  color: #c0392b;

  font-size: 12px;
  line-height: 1.8;
}

.show-password-row {
  display: flex;
  align-items: center;
  gap: 8px;

  color: var(--color-muted);
  font-size: 12px;
  cursor: pointer;
}

.show-password-row input {
  width: auto;
  height: auto;
}

.resend-text button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.done-link {
  display: flex;
  align-items: center;
  justify-content: center;

  text-decoration: none;
}
</style>