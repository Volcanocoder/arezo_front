<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const mobile = ref('')
const submitted = ref(false)

const submitRequest = () => {
  if (!mobile.value.trim()) {
    return
  }

  submitted.value = true
}

const backToLogin = () => {
  submitted.value = false
  mobile.value = ''
}
</script>

<template>
  <div class="auth-card">

    <!-- Request -->
    <template v-if="!submitted">

      <div class="auth-header">
        <span class="badge">
          بازیابی حساب
        </span>

        <h1>
          رمز عبورت را فراموش کردی؟
        </h1>

        <p>
          شماره موبایلی که با آن ثبت‌نام کرده‌ای را وارد کن تا مراحل بازیابی را شروع کنیم.
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="submitRequest"
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

        <button
          type="submit"
          class="submit-btn"
          :disabled="!mobile.trim()"
        >
          ارسال کد بازیابی
        </button>

      </form>

      <div class="back-login">
        <button
          type="button"
          @click="backToLogin"
        >
          ← بازگشت به ورود
        </button>
      </div>

    </template>

    <!-- Success -->
    <template v-else>

      <div class="success-icon">
        ✓
      </div>

      <div class="auth-header">
        <span class="badge success-badge">
          کد ارسال شد
        </span>

        <h1>
          کد بازیابی ارسال شد
        </h1>

        <p>
          کد تأیید به شماره
          <strong>{{ mobile }}</strong>
          ارسال می‌شود.
        </p>
      </div>

      <div class="code-box">
        <label for="code">
          کد تأیید
        </label>

        <input
          id="code"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="______"
        />
      </div>

      <button
        type="button"
        class="submit-btn"
        @click="$router.push('/login')"
      >
        ادامه
      </button>

      <p class="resend-text">
        کد را دریافت نکردی؟

        <button
          type="button"
          @click="submitted = false"
        >
          ارسال مجدد
        </button>
      </p>

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
</style>