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
  created_at?: string | null
}

interface WishCardItem {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  imageUrl: string | null
}

const wishes = ref<WishCardItem[]>([])
const loading = ref(true)
const errorMessage = ref('')

const fetchLatestWishes = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:8000/api/wishes', {
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
      throw new Error(serverMessage || `خطا در دریافت آرزوها (${response.status})`)
    }

    // Support both a plain array and Laravel's paginated response.
    const records: ApiWish[] = Array.isArray(payload)
      ? payload as ApiWish[]
      : payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: ApiWish[] }).data
        : []

    // The public API already returns approved wishes, newest first.
    wishes.value = records
      .map((item) => ({
        id: Number(item.id),
        title: item.title || 'آرزوی بدون عنوان',
        description: item.description || item.story || 'توضیحی برای این آرزو ثبت نشده است.',
        category: item.category || 'متفرقه',
        city: item.city || 'ثبت نشده',
        amount: Math.max(0, Number(item.requested_amount) || 0),
        imageUrl: item.image_url || null,
        createdAt: item.created_at || ''
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0)
      .slice(0, 3)
      .map(({ createdAt: _createdAt, ...wish }) => wish)
  } catch (error) {
    console.error('Failed to load latest wishes:', error)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'دریافت آخرین آرزوها با خطا مواجه شد. دوباره تلاش کن.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLatestWishes)
</script>

<template>
  <section class="latest-wishes">
    <div class="container">
      <div class="section-top">
        <div>
          <span class="section-badge">
            شاید یکی از این‌ها آرزوی تو باشد
          </span>
          <h2>آخرین آرزوها</h2>
          <p>شاید بتوانی قدمی برای واقعی شدن یکی از این آرزوها برداری.</p>
        </div>

        <NuxtLink to="/wishes" class="all-wishes">
          مشاهده همه آرزوها
        </NuxtLink>
      </div>

      <div v-if="loading" class="feedback-state" role="status" aria-live="polite">
        <div class="spinner"></div>
        <p>در حال دریافت آخرین آرزوها...</p>
      </div>

      <div v-else-if="errorMessage" class="feedback-state error-state" role="alert">
        <h3>دریافت آرزوها ناموفق بود</h3>
        <p>{{ errorMessage }}</p>
        <button type="button" class="retry-btn" @click="fetchLatestWishes">
          تلاش دوباره
        </button>
      </div>

      <div v-else-if="wishes.length" class="wishes-grid">
        <WishCard
          v-for="wish in wishes"
          :key="wish.id"
          :wish="wish"
        />
      </div>

      <div v-else class="feedback-state empty-state">
        <div class="empty-icon">♡</div>
        <h3>هنوز آرزوی تأییدشده‌ای وجود ندارد</h3>
        <p>بعد از تأیید آرزوها توسط مدیر، جدیدترین موارد در این بخش نمایش داده می‌شوند.</p>
        <NuxtLink to="/wishes" class="retry-btn">مشاهده همه آرزوها</NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.latest-wishes {
  padding: 120px 20px;
  background: #ffffff;
}

.container {
  width: min(1150px, 100%);
  margin: 0 auto;
}

.section-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 45px;
}

.section-badge {
  display: inline-flex;
  padding: 8px 15px;
  border-radius: 999px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.section-top h2 {
  margin: 16px 0 8px;
  font-size: clamp(32px, 4vw, 46px);
  font-weight: 800;
}

.section-top p {
  margin: 0;
  color: var(--color-muted);
  font-size: 15px;
  line-height: 2;
}

.all-wishes {
  flex-shrink: 0;
  padding: 13px 18px;
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
}

.all-wishes:hover {
  background: var(--color-primary);
  color: #ffffff;
}

.wishes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.feedback-state {
  min-height: 220px;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed #dddddf;
  border-radius: 24px;
  text-align: center;
}

.feedback-state h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
}

.feedback-state p {
  max-width: 620px;
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.9;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e8e5ff;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  color: var(--color-primary);
  font-size: 44px;
  line-height: 1;
}

.retry-btn {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 11px;
  background: var(--color-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.retry-btn:hover {
  background: var(--color-primary-dark);
}

.error-state {
  border-color: #f1c5c9;
}

@media (max-width: 950px) {
  .wishes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .section-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .wishes-grid {
    grid-template-columns: 1fr;
  }

  .latest-wishes {
    padding: 80px 20px;
  }
}
</style>
