<script setup lang="ts">
useSeoMeta({
  title: 'تماس با ما | آرزو',
  description: 'پیشنهاد، انتقاد یا سؤالی داری؟ از این صفحه برای تیم آرزو پیام بفرست.',
})

const config = useRuntimeConfig()
const email = String(config.public.contactEmail || '')

const { api } = useApi()

const form = reactive({ name: '', contact: '', subject: '', message: '', website: '' })
const sending = ref(false)
const done = ref(false)
const error = ref('')

async function submit() {
  sending.value = true
  error.value = ''

  try {
    await api('/api/contact', { method: 'POST', body: { ...form } })
    done.value = true
  } catch (e) {
    error.value = apiErrorMessage(e, 'ارسال پیام انجام نشد.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <main class="contact">
    <div class="wrap">
      <header>
        <span class="eyebrow">تماس با ما</span>
        <h1>برامون بنویس</h1>
        <p>پیشنهاد، گزارش مشکل یا سؤالی داری؟ پیامت را بنویس تا تیم آرزو بخواند و جواب بدهد.</p>
      </header>

      <div v-if="done" class="done" role="status">
        <span>✓</span>
        <strong>پیامت ارسال شد</strong>
        <p>در اولین فرصت از طریق همان راه تماسی که نوشتی پاسخ می‌دهیم.</p>
        <NuxtLink to="/" class="btn">بازگشت به خانه</NuxtLink>
      </div>

      <form v-else class="form" @submit.prevent="submit">
        <label>
          نام
          <input v-model="form.name" type="text" maxlength="100" required autocomplete="name">
        </label>
        <label>
          ایمیل یا شماره موبایل
          <input v-model="form.contact" type="text" maxlength="150" required dir="ltr" autocomplete="email">
        </label>
        <label>
          موضوع (اختیاری)
          <input v-model="form.subject" type="text" maxlength="150">
        </label>
        <label>
          پیام
          <textarea v-model="form.message" rows="6" minlength="10" maxlength="3000" required />
        </label>

        <!-- تله‌ی ربات؛ کاربر واقعی آن را نمی‌بیند -->
        <input v-model="form.website" class="hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button type="submit" class="btn" :disabled="sending">{{ sending ? 'در حال ارسال...' : 'ارسال پیام' }}</button>
      </form>

      <p v-if="email" class="alt">یا مستقیم ایمیل بزن: <a :href="`mailto:${email}`" dir="ltr">{{ email }}</a></p>
    </div>
  </main>
</template>

<style scoped>
.contact { background: #f8f8fc; padding: 56px 20px 90px; }
.wrap { width: min(620px, 100%); margin: 0 auto; display: grid; gap: 22px; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 13px; }
h1 { margin: 6px 0; font-size: 32px; }
header p { margin: 0; color: var(--color-muted); line-height: 2; }
.form { background: #fff; border: 1px solid #eee; border-radius: 24px; padding: 28px; display: grid; gap: 16px; }
label { display: grid; gap: 6px; font-weight: 700; font-size: 14px; }
input, textarea { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; font-family: inherit; font-size: 14px; background: #fff; }
input:focus, textarea:focus { outline: 2px solid #c4b5fd; border-color: transparent; }
.hp { position: absolute; inset-inline-start: -9999px; width: 1px; height: 1px; opacity: 0; }
.btn { border: 0; background: var(--color-primary); color: #fff; padding: 14px 22px; border-radius: 14px; font-family: inherit; font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none; text-align: center; }
.btn:disabled { opacity: .6; }
.error { margin: 0; color: #b91c1c; background: #fef2f2; border-radius: 12px; padding: 10px 14px; font-size: 14px; }
.done { background: #fff; border: 1px solid #eee; border-radius: 24px; padding: 38px 28px; text-align: center; display: grid; gap: 10px; justify-items: center; }
.done > span { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: #dcfce7; color: #166534; font-size: 26px; }
.done p { margin: 0; color: var(--color-muted); }
.alt { text-align: center; color: var(--color-muted); font-size: 14px; }
.alt a { color: var(--color-primary); }
</style>
