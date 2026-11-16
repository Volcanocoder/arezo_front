<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({ title: 'ویرایش آگهی | دیوار مهربانی' })

interface Mine {
  id: number
  title: string
  category: string
  description: string
  condition: string
  city: string
  status: string
  review_note: string | null
  image_url: string | null
}

const route = useRoute()
const router = useRouter()
const { api } = useApi()

const item = ref<Mine | null>(null)
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const error = ref('')
const done = ref('')

onMounted(async () => {
  try {
    item.value = (await api<{ data: Mine }>(`/api/my/kindness/items/${route.params.id}`)).data
  } catch (e) {
    loadError.value = apiErrorMessage(e, 'آگهی پیدا نشد.')
  } finally {
    loading.value = false
  }
})

const locked = computed(() => !!item.value && !['pending', 'approved', 'rejected'].includes(item.value.status))

async function submit(body: FormData) {
  if (busy.value || !item.value) return

  busy.value = true
  error.value = ''

  try {
    const res = await api<{ message: string }>(`/api/my/kindness/items/${item.value.id}`, { method: 'POST', body })
    done.value = res.message
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="edit-page">
    <div class="container">
      <NuxtLink to="/dashboard/kindness" class="back">← آگهی‌های من</NuxtLink>
      <h1>ویرایش آگهی</h1>

      <p v-if="loading" class="state">در حال دریافت...</p>
      <p v-else-if="loadError" class="state bad">{{ loadError }}</p>
      <p v-else-if="locked" class="state">آگهی رزروشده یا تحویل‌شده قابل ویرایش نیست.</p>

      <div v-else-if="done" class="ok">
        {{ done }}
        <NuxtLink to="/dashboard/kindness">بازگشت به آگهی‌های من</NuxtLink>
      </div>

      <template v-else-if="item">
        <p v-if="item.status === 'rejected' && item.review_note" class="note">دلیل رد قبلی: {{ item.review_note }}</p>
        <p class="lead">بعد از ذخیره، آگهی دوباره برای بررسی مدیر ارسال می‌شود و تا تأیید نمایش داده نمی‌شود.</p>

        <div class="card">
          <KindnessItemForm
            :initial="item"
            :image-url="item.image_url"
            submit-label="ذخیره و ارسال برای بررسی"
            :busy="busy"
            :error="error"
            @submit="submit"
            @cancel="router.back()"
          />
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.edit-page { padding: 36px 0 80px; }
.container { width: min(680px, 100% - 32px); margin-inline: auto; }
.back { display: inline-block; margin-bottom: 14px; color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: 14px; }
h1 { margin: 0 0 6px; font-size: 28px; }
.lead { margin: 0 0 18px; color: var(--color-muted); line-height: 2; }
.card { padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 20px; }
.state { padding: 26px; text-align: center; background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; color: var(--color-muted); }
.state.bad { color: #b91c1c; background: #fef2f2; }
.note { margin: 0 0 12px; padding: 10px 14px; border-radius: 12px; background: #fff7ed; color: #b45309; font-size: 13px; }
.ok { padding: 18px; border-radius: 16px; background: #ecfdf3; color: #15803d; display: grid; gap: 8px; line-height: 2; }
.ok a { color: var(--color-primary); font-weight: 800; }
@media (max-width: 600px) { .card { padding: 18px 14px; } }
</style>
