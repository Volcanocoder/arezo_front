<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface KItem {
  id: number
  title: string
  category: string
  description: string
  condition_label: string
  city: string
  status: string
  image_url: string | null
}

const route = useRoute()
const apiBase = useApiBase()
const { api } = useApi()
const { user } = useAuth()

const { data: item, error } = await useAsyncData<KItem | null>(`kindness-${route.params.id}`, async () => {
  try {
    const res = await $fetch<{ data: KItem }>(`${apiBase}/api/kindness/${route.params.id}`, {
      headers: { Accept: 'application/json' },
    })
    return res.data
  } catch {
    return null
  }
})

useSeoMeta({
  title: () => (item.value ? `${item.value.title} | دیوار مهربانی` : 'آگهی پیدا نشد | هم‌آرزو'),
  description: () => item.value?.description?.slice(0, 150) ?? '',
})

const message = ref('')
const sending = ref(false)
const feedback = ref('')
const feedbackBad = ref(false)
const done = ref(false)

async function sendRequest() {
  if (!item.value || sending.value) return

  sending.value = true
  feedback.value = ''

  try {
    const res = await api<{ message: string }>(`/api/kindness/${item.value.id}/requests`, {
      method: 'POST',
      body: { message: message.value.trim() },
    })
    feedback.value = res.message
    feedbackBad.value = false
    done.value = true
  } catch (e) {
    feedback.value = apiErrorMessage(e)
    feedbackBad.value = true
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <main class="detail">
    <div class="container">
      <NuxtLink to="/kindness" class="back">← دیوار مهربانی</NuxtLink>

      <div v-if="error || !item" class="state">این آگهی پیدا نشد یا دیگر نمایش داده نمی‌شود.</div>

      <article v-else class="layout">
        <div class="photo">
          <img v-if="item.image_url" :src="item.image_url" :alt="item.title">
          <span v-else class="ph">🎁</span>
        </div>

        <div class="info">
          <h1>{{ item.title }}</h1>
          <p class="meta">{{ item.category }} · {{ item.condition_label }} · {{ item.city }}</p>
          <p class="desc">{{ item.description }}</p>

          <div v-if="item.status === 'reserved'" class="box reserved">این کالا برای یک درخواست رزرو شده است.</div>

          <!-- ورود فقط سمت مرورگر مشخص می‌شود؛ بدون ClientOnly کاربر واردشده لحظه‌ای کادر ورود را می‌بیند. -->
          <ClientOnly v-else>
            <div v-if="!user" class="gate">
              <span class="gate-icon" aria-hidden="true">🎁</span>
              <h2>برای درخواست این کالا وارد شو</h2>
              <p>درخواست‌ها فقط از حساب کاربری ثبت می‌شود تا تیم هم‌آرزو بتواند برای هماهنگی تحویل با تو تماس بگیرد.</p>
              <div class="gate-actions">
                <NuxtLink :to="{ path: '/login', query: { redirect: route.fullPath } }" class="btn primary">ورود</NuxtLink>
                <NuxtLink :to="{ path: '/register', query: { redirect: route.fullPath } }" class="btn ghost">ثبت‌نام</NuxtLink>
              </div>
            </div>

            <form v-else-if="!done" class="form" @submit.prevent="sendRequest">
              <label for="msg">چرا به این کالا نیاز داری؟</label>
              <textarea id="msg" v-model="message" required minlength="5" maxlength="1000" rows="4" placeholder="کوتاه توضیح بده..." />
              <button type="submit" class="btn primary" :disabled="sending">{{ sending ? 'در حال ارسال...' : 'ثبت درخواست' }}</button>
              <p v-if="feedback" class="fb" :class="{ bad: feedbackBad }">{{ feedback }}</p>
              <p class="hint">درخواستت پس از بررسی مدیر تأیید می‌شود و تیم هم‌آرزو برای هماهنگی تحویل با تو تماس می‌گیرد.</p>
            </form>

            <div v-else class="box ok">
              {{ feedback }}
              <NuxtLink to="/dashboard/kindness">درخواست‌های من</NuxtLink>
            </div>

            <template #fallback><div class="skeleton" aria-hidden="true" /></template>
          </ClientOnly>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
.detail { padding: 36px 0 80px; }
.container { width: min(1000px, 100% - 32px); margin-inline: auto; }
.back { display: inline-block; margin-bottom: 18px; color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: 14px; }
.state { padding: 40px; text-align: center; background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; color: var(--color-muted); }
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
.photo { border-radius: 22px; overflow: hidden; background: #f5f3ff; min-height: 260px; display: flex; align-items: center; justify-content: center; }
.photo img { width: 100%; display: block; }
.ph { font-size: 64px; }
h1 { margin: 0 0 6px; font-size: 28px; }
.meta { margin: 0 0 14px; color: #94a3b8; font-size: 13px; }
.desc { margin: 0 0 20px; line-height: 2.1; white-space: pre-line; color: #334155; }
.box { display: grid; gap: 10px; padding: 18px; background: #f8f8fc; border: 1px solid #eee; border-radius: 18px; line-height: 2; }
.box a { color: var(--color-primary); font-weight: 800; }
.gate { display: grid; justify-items: center; gap: 8px; padding: 26px 20px; text-align: center; background: linear-gradient(180deg, #f5f3ff, #fff); border: 1px solid #e4defc; border-radius: 20px; }
.gate-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: #ede9fe; font-size: 26px; }
.gate h2 { margin: 4px 0 0; font-size: 18px; }
.gate p { margin: 0; max-width: 360px; color: var(--color-muted); font-size: 13px; line-height: 2; }
.gate-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 28px; border-radius: 14px; font: inherit; font-weight: 800; text-decoration: none; cursor: pointer; }
.btn.primary { border: 0; background: var(--color-primary); color: #fff; }
.btn.ghost { border: 1px solid #ddd6fe; background: #fff; color: var(--color-primary); }
.form { display: grid; gap: 10px; padding: 18px; background: #f8f8fc; border: 1px solid #eee; border-radius: 20px; }
.skeleton { height: 150px; border-radius: 20px; background: #f1f0fa; }
.box.reserved { background: #fff7ed; color: #c2410c; }
.box.ok { background: #ecfdf3; color: #15803d; }
label { font-weight: 800; font-size: 14px; }
textarea { width: 100%; padding: 12px; border: 1px solid #e3e3ea; border-radius: 14px; font: inherit; font-size: 16px; background: #fff; }
button:disabled { opacity: .6; cursor: wait; }
.fb { margin: 0; color: #15803d; font-size: 13px; }
.fb.bad { color: #b91c1c; }
.hint { margin: 0; color: #94a3b8; font-size: 12px; }
@media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
</style>
