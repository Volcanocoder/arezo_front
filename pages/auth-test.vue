<script setup lang="ts">
type User = {
  id: number
  name: string
  email: string
  role: string
}

type AuthResponse = {
  message: string
  user: User
}

const apiUrl = 'http://localhost:8000'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')

const currentUser = ref<User | null>(null)
const message = ref('')
const busy = ref(false)

function getXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

async function prepareCsrf(): Promise<string> {
  await $fetch(`${apiUrl}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  const token = getXsrfToken()

  if (!token) {
    throw new Error(
      'توکن CSRF پیدا نشد. تنظیمات کوکی و CORS را بررسی کن.'
    )
  }

  return token
}

async function postAuth(
  path: string,
  body: Record<string, string>,
): Promise<AuthResponse> {
  const token = await prepareCsrf()

  return await $fetch<AuthResponse>(`${apiUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': token,
    },
    body,
  })
}

function showError(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
      message?: string
    }

    if (err.data?.errors) {
      message.value = Object.values(err.data.errors).flat().join('، ')
      return
    }

    message.value =
      err.data?.message || err.message || 'خطای نامشخص'
    return
  }

  message.value = 'ارتباط با سرور برقرار نشد.'
}

async function register() {
  busy.value = true
  message.value = ''

  try {
    const result = await postAuth('/api/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    currentUser.value = result.user
    message.value = result.message
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

async function login() {
  busy.value = true
  message.value = ''

  try {
    const result = await postAuth('/api/auth/login', {
      email: email.value,
      password: password.value,
    })

    currentUser.value = result.user
    message.value = result.message
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

async function getMe() {
  busy.value = true
  message.value = ''

  try {
    const result = await $fetch<{ user: User }>(
      `${apiUrl}/api/auth/me`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      },
    )

    currentUser.value = result.user
    message.value = 'اطلاعات حساب با موفقیت دریافت شد.'
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

async function logout() {
  busy.value = true
  message.value = ''

  try {
    const token = await prepareCsrf()

    const result = await $fetch<{ message: string }>(
      `${apiUrl}/api/auth/logout`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': token,
        },
      },
    )

    currentUser.value = null
    message.value = result.message
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main dir="rtl" class="auth-test">
    <h1>تست احراز هویت آرزو</h1>

    <label>
      نام و نام خانوادگی
      <input v-model="name" autocomplete="name">
    </label>

    <label>
      ایمیل
      <input
        v-model="email"
        type="email"
        autocomplete="email"
      >
    </label>

    <label>
      رمز عبور
      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
      >
    </label>

    <label>
      تکرار رمز عبور
      <input
        v-model="passwordConfirmation"
        type="password"
        autocomplete="new-password"
      >
    </label>

    <div class="actions">
      <button :disabled="busy" @click="register">
        ثبت‌نام
      </button>

      <button :disabled="busy" @click="login">
        ورود
      </button>

      <button :disabled="busy" @click="getMe">
        بررسی حساب فعلی
      </button>

      <button :disabled="busy" @click="logout">
        خروج
      </button>
    </div>

    <p v-if="busy">در حال پردازش...</p>
    <p v-if="message" role="status">{{ message }}</p>

    <section v-if="currentUser">
      <h2>کاربر واردشده</h2>
      <p>نام: {{ currentUser.name }}</p>
      <p>ایمیل: {{ currentUser.email }}</p>
      <p>نقش: {{ currentUser.role }}</p>
    </section>
  </main>
</template>

<style scoped>
.auth-test {
  max-width: 560px;
  margin: 40px auto;
  padding: 24px;
  font-family: sans-serif;
}

label {
  display: block;
  margin: 16px 0;
}

input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  margin-top: 6px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0;
}

button {
  padding: 10px 16px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>