<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface ApiWish {
  id: number | string
  title?: string | null
  description?: string | null
  story?: string | null
  category?: string | null
  city?: string | null
  requested_amount?: number | string | null
  image_url?: string | null
  urgency?: string | null
}

interface PriorityWish {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  imageUrl: string | null
  urgency: 'urgent' | 'important'
}

const wishes = ref<PriorityWish[]>([])
const loading = ref(true)
const errorMessage = ref('')

const fetchPriorityWishes = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:8000/api/wishes/priority', {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })

    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const serverMessage =
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message?: unknown }).message || '')
          : ''
      throw new Error(serverMessage || `خطا در دریافت آرزوهای مهم (${response.status})`)
    }

    const records: ApiWish[] = Array.isArray(payload)
      ? payload as ApiWish[]
      : payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: ApiWish[] }).data
        : []

    wishes.value = records
      .filter((item) => item.urgency === 'urgent' || item.urgency === 'important')
      .map((item) => ({
        id: Number(item.id),
        title: item.title || 'آرزوی بدون عنوان',
        description: item.description || item.story || 'توضیحی برای این آرزو ثبت نشده است.',
        category: item.category || 'متفرقه',
        city: item.city || 'ثبت نشده',
        amount: Math.max(0, Number(item.requested_amount) || 0),
        imageUrl: item.image_url || null,
        urgency: item.urgency as 'urgent' | 'important'
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0)
      .slice(0, 3)
  } catch (error) {
    console.error('Failed to load priority wishes:', error)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'دریافت آرزوهای مهم با خطا مواجه شد. دوباره تلاش کن.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPriorityWishes)
</script>

<template>
  <section class="priority-wishes" aria-labelledby="priority-wishes-title">
    <div class="container">
      <div class="section-top">
        <div class="heading-copy">
          <span class="section-badge"><span aria-hidden="true">✦</span> اولویت با نیازهای مهم‌تر</span>
          <h2 id="priority-wishes-title">آرزوهایی که به توجه بیشتری نیاز دارند</h2>
          <p>آرزوهایی که ثبت‌کننده، نیازشان را مهم یا فوری مشخص کرده است.</p>
        </div>
        <NuxtLink to="/wishes" class="all-wishes">مشاهده همه آرزوها <span aria-hidden="true">←</span></NuxtLink>
      </div>

      <p class="trust-note">
        <span aria-hidden="true">✓</span>
        همه آرزوهای این بخش پیش از انتشار عمومی توسط مدیر بررسی و تأیید شده‌اند؛ اولویت بر اساس انتخاب هنگام ثبت آرزو است.
      </p>

      <div v-if="loading" class="feedback-state" role="status" aria-live="polite">
        <div class="spinner"></div>
        <p>در حال دریافت آرزوهای مهم و فوری...</p>
      </div>

      <div v-else-if="errorMessage" class="feedback-state error-state" role="alert">
        <h3>دریافت آرزوها ناموفق بود</h3>
        <p>{{ errorMessage }}</p>
        <button type="button" class="retry-btn" @click="fetchPriorityWishes">تلاش دوباره</button>
      </div>

      <div v-else-if="wishes.length" class="wishes-grid">
        <WishCard v-for="wish in wishes" :key="wish.id" :wish="wish" />
      </div>

      <div v-else class="feedback-state empty-state">
        <div class="empty-icon" aria-hidden="true">♡</div>
        <h3>فعلاً آرزوی مهم یا فوریِ تأییدشده‌ای نداریم</h3>
        <p>با تأیید آرزوهایی که ثبت‌کننده آن‌ها را مهم یا فوری مشخص کرده، این بخش به‌روز می‌شود.</p>
        <NuxtLink to="/wishes" class="retry-btn">مشاهده همه آرزوها</NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.priority-wishes {
  padding: 88px 20px 94px;
  background: linear-gradient(180deg, #f8f7ff 0%, #fff 100%);
  border-top: 1px solid #f0edff;
  border-bottom: 1px solid #f0edff;
}
.container { width: min(1150px, 100%); margin: 0 auto; }
.section-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: 18px; }
.heading-copy { max-width: 750px; }
.section-badge { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 999px; background: #eeebff; color: var(--color-primary); font-size: 12px; font-weight: 800; }
.section-badge span { font-size: 14px; }
h2 { margin: 16px 0 8px; color: #27243e; font-size: clamp(27px, 3.4vw, 40px); line-height: 1.55; font-weight: 850; }
.section-top p { margin: 0; color: var(--color-muted); font-size: 14px; line-height: 2; }
.all-wishes { flex-shrink: 0; display: inline-flex; align-items: center; gap: 9px; padding: 13px 17px; border-radius: 12px; background: #fff; border: 1px solid #e9e5ff; color: var(--color-text); font-size: 12px; font-weight: 750; transition: .2s ease; }
.all-wishes:hover { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.trust-note { display: flex; align-items: flex-start; gap: 8px; margin: 20px 0 26px; color: #767286; font-size: 11px; line-height: 1.9; }
.trust-note span { flex-shrink: 0; color: #298657; font-weight: 900; }
.wishes-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.feedback-state { min-height: 190px; padding: 42px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed #ded9f6; border-radius: 22px; background: rgba(255,255,255,.75); text-align: center; }
.feedback-state h3 { margin: 0; font-size: 18px; font-weight: 800; }
.feedback-state p { max-width: 630px; margin: 0; color: var(--color-muted); font-size: 12px; line-height: 1.9; }
.spinner { width: 29px; height: 29px; border: 3px solid #e9e5ff; border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { color: var(--color-primary); font-size: 36px; line-height: 1; }
.retry-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 12px; font-weight: 750; cursor: pointer; }
.retry-btn:hover { background: var(--color-primary-dark); }
.error-state { border-color: #f0c9ce; }
@media (max-width: 950px) { .wishes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .priority-wishes { padding: 65px 16px 70px; } .section-top { align-items: flex-start; flex-direction: column; } .wishes-grid { grid-template-columns: 1fr; } .all-wishes { width: 100%; justify-content: center; } .trust-note { margin-top: 16px; } }
</style>
