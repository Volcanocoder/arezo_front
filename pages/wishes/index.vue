<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  // Keep this page public so visitors can explore approved wishes.
  // If the project uses a different public layout, change only the layout value.
  layout: 'default'
})

interface ApiWish {
  id: number
  title: string
  description?: string | null
  story?: string | null
  category?: string | null
  city?: string | null
  requested_amount?: number | string | null
  created_at?: string | null
  image_url?: string | null
}

interface Wish {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  createdAt: string
  imageUrl: string | null
}

const search = ref('')
const selectedCategory = ref('همه')
const selectedCity = ref('همه')
const sortBy = ref('جدیدترین')
const loading = ref(true)
const errorMessage = ref('')
const wishes = ref<Wish[]>([])
const failedImageIds = ref<number[]>([])

const handleWishImageError = (id: number) => {
  if (!failedImageIds.value.includes(id)) {
    failedImageIds.value = [...failedImageIds.value, id]
  }
}

const categories = [
  'همه',
  'تحصیلی',
  'درمانی',
  'وسایل',
  'آموزشی',
  'تجربه',
  'ضروری'
]

const cities = computed(() => ['همه', ...new Set(wishes.value.map((wish) => wish.city).filter(Boolean))])

const fetchWishes = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:8000/api/wishes', {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message?: unknown }).message || '')
          : ''
      throw new Error(message || `خطا در دریافت آرزوها (${response.status})`)
    }

    // Accept either a plain array or Laravel's paginator response.
    const records: ApiWish[] = Array.isArray(payload)
      ? payload as ApiWish[]
      : payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: ApiWish[] }).data
        : []

    wishes.value = records.map((item) => ({
      id: Number(item.id),
      title: item.title || 'آرزوی بدون عنوان',
      description: item.description || item.story || 'توضیحی برای این آرزو ثبت نشده است.',
      category: item.category || 'متفرقه',
      // Public list deliberately omits applicant name, phone, email and private files.
      city: item.city || 'ثبت نشده',
      amount: Math.max(0, Number(item.requested_amount) || 0),
      createdAt: item.created_at || '',
      imageUrl: item.image_url || null
    }))
  } catch (error) {
    console.error('Failed to load public wishes:', error)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'دریافت آرزوها با خطا مواجه شد. دوباره تلاش کن.'
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)

const clearFilters = () => {
  search.value = ''
  selectedCategory.value = 'همه'
  selectedCity.value = 'همه'
  sortBy.value = 'جدیدترین'
}

const filteredWishes = computed(() => {
  let result = [...wishes.value]

  if (search.value.trim()) {
    const query = search.value.trim().toLocaleLowerCase()
    result = result.filter((wish) =>
      `${wish.title} ${wish.description} ${wish.city} ${wish.category}`
        .toLocaleLowerCase()
        .includes(query)
    )
  }

  if (selectedCategory.value !== 'همه') {
    result = result.filter((wish) => wish.category === selectedCategory.value)
  }

  if (selectedCity.value !== 'همه') {
    result = result.filter((wish) => wish.city === selectedCity.value)
  }

  if (sortBy.value === 'کمترین مبلغ') {
    result.sort((a, b) => a.amount - b.amount)
  } else if (sortBy.value === 'بیشترین مبلغ') {
    result.sort((a, b) => b.amount - a.amount)
  } else {
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }

  return result
})

onMounted(fetchWishes)
</script>

<template>
  <main class="wishes-page">
    <section class="page-header">
      <div class="container">
        <span class="badge">شاید بتوانی یک آرزو را واقعی کنی</span>
        <h1>آرزوها</h1>
        <p>آرزویی را پیدا کن که می‌توانی برای برآورده شدنش قدمی برداری.</p>
      </div>
    </section>

    <section class="filters-section">
      <div class="container">
        <div class="filters">
          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input v-model="search" type="text" placeholder="جستجوی آرزو..." />
          </div>

          <select v-model="selectedCategory" aria-label="فیلتر دسته‌بندی">
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>

          <select v-model="selectedCity" aria-label="فیلتر شهر">
            <option v-for="city in cities" :key="city" :value="city">
              {{ city === 'همه' ? 'همه شهرها' : city }}
            </option>
          </select>

          <select v-model="sortBy" aria-label="مرتب‌سازی آرزوها">
            <option value="جدیدترین">جدیدترین</option>
            <option value="کمترین مبلغ">کمترین مبلغ</option>
            <option value="بیشترین مبلغ">بیشترین مبلغ</option>
          </select>
        </div>
      </div>
    </section>

    <section class="wishes-section">
      <div class="container">
        <div class="results-header">
          <div>
            <h2>آرزوهای تأییدشده</h2>
            <span>{{ loading ? 'در حال دریافت...' : `${filteredWishes.length} آرزو` }}</span>
          </div>
          <NuxtLink to="/create-wish" class="create-btn">+ ثبت آرزو</NuxtLink>
        </div>

        <div v-if="loading" class="feedback-state" role="status">
          <div class="spinner"></div>
          <p>در حال دریافت آرزوها...</p>
        </div>

        <div v-else-if="errorMessage" class="feedback-state error-state" role="alert">
          <h3>دریافت آرزوها ناموفق بود</h3>
          <p>{{ errorMessage }}</p>
          <button type="button" class="clear-filters-btn" @click="fetchWishes">تلاش دوباره</button>
        </div>

        <div v-else-if="filteredWishes.length" class="wishes-grid">
          <article v-for="wish in filteredWishes" :key="wish.id" class="wish-card">
            <div class="wish-image-wrapper">
              <img
                v-if="wish.imageUrl && !failedImageIds.includes(wish.id)"
                :src="wish.imageUrl"
                :alt="`تصویر آرزو: ${wish.title}`"
                class="wish-image"
                loading="lazy"
                decoding="async"
                @error="handleWishImageError(wish.id)"
              />
              <div
                v-else
                class="wish-image-placeholder"
                role="img"
                :aria-label="`تصویری برای ${wish.title} ثبت نشده است`"
              >
                <span>♡</span>
                <small>تصویری برای این آرزو ثبت نشده</small>
              </div>
            </div>
            <div class="wish-card-content">
              <div class="wish-card-top">
                <span class="category-chip">{{ wish.category }}</span>
                <span class="approved-chip">تأییدشده</span>
              </div>
              <h3>{{ wish.title }}</h3>
              <p class="wish-description">{{ wish.description }}</p>
              <div class="wish-meta"><span>⌖ {{ wish.city }}</span></div>
              <div class="wish-amount">
                <span>مبلغ موردنیاز</span>
                <strong>{{ formatPrice(wish.amount) }} <small>تومان</small></strong>
              </div>
              <NuxtLink :to="`/wishes/${wish.id}`" class="wish-detail-btn">مشاهده جزئیات آرزو</NuxtLink>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🔎</div>
          <h3>{{ wishes.length ? 'آرزویی پیدا نشد' : 'هنوز آرزوی تأییدشده‌ای ثبت نشده است' }}</h3>
          <p>{{ wishes.length ? 'عبارت جستجو یا فیلترهای انتخابی را تغییر بده.' : 'بعد از بررسی و تأیید آرزوها توسط مدیر، آن‌ها در این صفحه نمایش داده می‌شوند.' }}</p>
          <button v-if="wishes.length" type="button" class="clear-filters-btn" @click="clearFilters">
            پاک کردن فیلترها
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wishes-page { background: #fff; }
.container { width: min(1150px, 100%); margin: 0 auto; }
.page-header { padding: 90px 20px 70px; text-align: center; background: #f8f8fc; }
.badge { display: inline-flex; align-items: center; padding: 8px 15px; border-radius: 999px; background: #eceaff; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.page-header h1 { margin: 18px 0 10px; font-size: clamp(40px, 5vw, 58px); font-weight: 800; line-height: 1.3; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 16px; line-height: 2; }
.filters-section { position: sticky; top: 82px; z-index: 20; padding: 25px 20px; background: #fff; border-bottom: 1px solid #eee; }
.filters { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 12px; }
.search-box { height: 48px; display: flex; align-items: center; padding: 0 15px; border: 1px solid #e7e7eb; border-radius: 13px; background: #fff; }
.search-icon { margin-left: 10px; color: #888; font-size: 22px; }
.search-box input { width: 100%; height: 100%; border: 0; outline: 0; background: transparent; color: var(--color-text); font-size: 13px; font-family: inherit; }
.search-box input::placeholder { color: #a0a0a9; }
.filters select { height: 48px; padding: 0 14px; border: 1px solid #e7e7eb; border-radius: 13px; outline: 0; background: #fff; color: var(--color-text); font-size: 13px; font-family: inherit; cursor: pointer; }
.wishes-section { padding: 70px 20px 120px; }
.results-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 35px; }
.results-header > div { display: flex; align-items: baseline; gap: 12px; }
.results-header h2 { margin: 0; font-size: 28px; font-weight: 800; }
.results-header span { color: var(--color-muted); font-size: 13px; }
.create-btn { height: 44px; padding: 0 18px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 13px; font-weight: 700; transition: .2s ease; }
.create-btn:hover { background: var(--color-primary-dark); }
.wishes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.wish-card { min-width: 0; padding: 0; border: 1px solid #eee; border-radius: 20px; background: #fff; display: flex; flex-direction: column; overflow: hidden; transition: .2s ease; }
.wish-card:hover { border-color: #dcd7ff; box-shadow: 0 12px 30px rgba(40, 30, 100, .06); transform: translateY(-2px); }
.wish-image-wrapper { width: 100%; height: 205px; overflow: hidden; background: #f5f3ff; }
.wish-image { display: block; width: 100%; height: 100%; object-fit: cover; }
.wish-image-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #f3f1ff, #fafaff); color: var(--color-primary); }
.wish-image-placeholder span { font-size: 48px; line-height: 1; }
.wish-image-placeholder small { font-size: 11px; color: var(--color-muted); }
.wish-card-content { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.wish-card-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.category-chip, .approved-chip { padding: 6px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; }
.category-chip { background: #f0eeff; color: var(--color-primary); }
.approved-chip { background: #edf8f1; color: #278451; }
.wish-card h3 { margin: 0; font-size: 17px; line-height: 1.8; font-weight: 800; }
.wish-description { min-height: 68px; margin: 0; color: var(--color-muted); font-size: 12px; line-height: 2; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.wish-meta { color: var(--color-muted); font-size: 11px; }
.wish-amount { padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-radius: 12px; background: #f9f9fc; }
.wish-amount > span { color: var(--color-muted); font-size: 11px; }
.wish-amount strong { color: var(--color-text); font-size: 14px; white-space: nowrap; }
.wish-amount small { font-size: 10px; font-weight: 500; }
.wish-detail-btn { min-height: 42px; margin-top: auto; padding: 0 12px; display: flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; transition: .2s ease; }
.wish-detail-btn:hover { background: var(--color-primary-dark); }
.feedback-state, .empty-state { min-height: 240px; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed #ddd; border-radius: 24px; text-align: center; }
.feedback-state p, .empty-state p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 1.9; }
.feedback-state h3, .empty-state h3 { margin: 0; font-size: 20px; font-weight: 800; }
.error-state { border-color: #f1c5c9; }
.spinner { width: 30px; height: 30px; border: 3px solid #e8e5ff; border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { margin-bottom: 2px; font-size: 42px; }
.clear-filters-btn { min-height: 42px; padding: 0 18px; border: 0; border-radius: 11px; background: var(--color-surface); color: var(--color-text); font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: .2s ease; }
.clear-filters-btn:hover { background: var(--color-primary); color: #fff; }
@media (max-width: 950px) { .filters { grid-template-columns: 1fr 1fr; } .search-box { grid-column: 1 / -1; } .wishes-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 650px) { .page-header { padding: 60px 20px 50px; } .filters-section { position: static; } .filters { grid-template-columns: 1fr; } .search-box { grid-column: auto; } .results-header { align-items: flex-start; flex-direction: column; } .results-header > div { flex-wrap: wrap; } .wishes-grid { grid-template-columns: 1fr; } .wishes-section { padding-top: 50px; } }
</style>
