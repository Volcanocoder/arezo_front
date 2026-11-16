<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({ title: 'ثبت آگهی | دیوار مهربانی' })

const { api } = useApi()
const router = useRouter()
const busy = ref(false)
const error = ref('')
const done = ref(false)

async function submit(body: FormData) {
  if (busy.value) return

  busy.value = true
  error.value = ''

  try {
    await api('/api/kindness', { method: 'POST', body })
    done.value = true
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="new-page">
    <div class="container">
      <NuxtLink to="/kindness" class="back">← دیوار مهربانی</NuxtLink>
      <h1>ثبت آگهی</h1>
      <p class="lead">وسیله سالمی که دیگر لازم نداری را معرفی کن. آگهی بعد از تأیید تیم هم‌آرزو نمایش داده می‌شود.</p>

      <div v-if="done" class="ok">
        آگهی ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.
        <NuxtLink to="/dashboard/kindness">آگهی‌های من</NuxtLink>
      </div>

      <div v-else class="card">
        <KindnessItemForm submit-label="ثبت آگهی" :busy="busy" :error="error" @submit="submit" @cancel="router.back()" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.new-page { padding: 36px 0 80px; }
.container { width: min(680px, 100% - 32px); margin-inline: auto; }
.back { display: inline-block; margin-bottom: 14px; color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: 14px; }
h1 { margin: 0 0 6px; font-size: 28px; }
.lead { margin: 0 0 20px; color: var(--color-muted); line-height: 2; }
.card { padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 20px; }
.ok { padding: 18px; border-radius: 16px; background: #ecfdf3; color: #15803d; display: grid; gap: 8px; line-height: 2; }
.ok a { color: var(--color-primary); font-weight: 800; }
@media (max-width: 600px) { .card { padding: 18px 14px; } }
</style>
