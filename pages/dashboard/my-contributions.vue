<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

type DonationStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | string
type DonationFilter = 'همه' | 'پرداخت موفق' | 'در انتظار پرداخت' | 'ناموفق' | 'لغوشده'

interface ApiDonation {
  id: number | string
  wish_id: number | string
  amount: number | string
  status: DonationStatus
  created_at?: string | null
  paid_at?: string | null
  wish?: {
    id: number | string
    title?: string | null
    category?: string | null
    city?: string | null
    requested_amount?: number | string | null
    funded_amount?: number | string | null
    supporters_count?: number | string | null
    status?: string | null
  } | null
}

interface Contribution {
  id: number
  wishId: number
  wishTitle: string
  category: string
  city: string
  contribution: number
  totalFunded: number
  totalAmount: number
  status: DonationStatus
  date: string
}

const selectedStatus = ref<DonationFilter>('همه')
const search = ref('')
const contributions = ref<Contribution[]>([])
const loading = ref(true)
const errorMessage = ref('')

const statuses: DonationFilter[] = [
  'همه',
  'پرداخت موفق',
  'در انتظار پرداخت',
  'ناموفق',
  'لغوشده',
]

const statusLabels: Record<string, string> = {
  paid: 'پرداخت موفق',
  pending: 'در انتظار پرداخت',
  failed: 'ناموفق',
  cancelled: 'لغوشده',
}

const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)

const formatDate = (value?: string | null) => {
  if (!value) return 'تاریخ نامشخص'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'تاریخ نامشخص'
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const fetchContributions = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:8000/api/my/donations', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })

    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message || '')
        : ''
      if (response.status === 401) {
        throw new Error('نشست ورود معتبر نیست. یک بار از حساب خارج شو و دوباره وارد شو.')
      }
      throw new Error(message || `دریافت کمک‌ها ناموفق بود (${response.status}).`)
    }

    const records: ApiDonation[] = Array.isArray(payload)
      ? payload as ApiDonation[]
      : payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: ApiDonation[] }).data
        : []

    contributions.value = records
      .filter((item) => item && item.wish && Number(item.id) > 0)
      .map((item) => ({
        id: Number(item.id),
        wishId: Number(item.wish_id || item.wish?.id),
        wishTitle: item.wish?.title || 'آرزوی بدون عنوان',
        category: item.wish?.category || 'متفرقه',
        // برای حفظ حریم خصوصی، نام و مشخصات متقاضی در این فهرست نمایش داده نمی‌شود.
        city: item.wish?.city || 'ثبت نشده',
        contribution: Math.max(0, Number(item.amount) || 0),
        totalFunded: Math.max(0, Number(item.wish?.funded_amount) || 0),
        totalAmount: Math.max(0, Number(item.wish?.requested_amount) || 0),
        status: item.status || 'pending',
        date: formatDate(item.paid_at || item.created_at),
      }))
  } catch (error) {
    console.error('Failed to load user donations:', error)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'ارتباط با سرور برقرار نشد. دوباره تلاش کن.'
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (status: string) => statusLabels[status] || 'وضعیت نامشخص'

const getPercentage = (item: Contribution) => {
  if (item.totalAmount <= 0) return 0
  return Math.min(100, Math.round((item.totalFunded / item.totalAmount) * 100))
}

const clearFilters = () => {
  selectedStatus.value = 'همه'
  search.value = ''
}

const filteredContributions = computed(() => {
  let result = [...contributions.value]

  if (selectedStatus.value !== 'همه') {
    result = result.filter((item) => getStatusLabel(item.status) === selectedStatus.value)
  }

  if (search.value.trim()) {
    const query = search.value.trim().toLocaleLowerCase()
    result = result.filter((item) =>
      `${item.wishTitle} ${item.category} ${item.city}`.toLocaleLowerCase().includes(query),
    )
  }

  return result
})

const totalContributed = computed(() => contributions.value
  .filter((item) => item.status === 'paid')
  .reduce((sum, item) => sum + item.contribution, 0))

const paidCount = computed(() => contributions.value.filter((item) => item.status === 'paid').length)
const pendingCount = computed(() => contributions.value.filter((item) => item.status === 'pending').length)

onMounted(fetchContributions)
</script>

<template>
  <main class="contributions-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">پنل کاربری</span>
        <h1>کمک‌های من</h1>
        <p>وضعیت کمک‌هایی را که ثبت کرده‌ای پیگیری کن.</p>
      </div>
      <NuxtLink to="/wishes" class="find-wish-btn">پیدا کردن یک آرزو</NuxtLink>
    </header>

    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">🤝</div>
        <div><span>تعداد کمک‌های ثبت‌شده</span><strong>{{ contributions.length }}</strong></div>
      </div>
      <div class="summary-card">
        <div class="summary-icon money">تومان</div>
        <div><span>مجموع پرداخت‌های موفق</span><strong>{{ formatPrice(totalContributed) }}</strong></div>
      </div>
      <div class="summary-card">
        <div class="summary-icon success">✓</div>
        <div><span>پرداخت‌های موفق</span><strong>{{ paidCount }}</strong></div>
      </div>
      <div class="summary-card">
        <div class="summary-icon active">◔</div>
        <div><span>در انتظار پرداخت</span><strong>{{ pendingCount }}</strong></div>
      </div>
    </section>

    <section class="toolbar">
      <div class="tabs">
        <button
          v-for="status in statuses"
          :key="status"
          type="button"
          class="tab"
          :class="{ active: selectedStatus === status }"
          @click="selectedStatus = status"
        >{{ status }}</button>
      </div>
      <div class="search-box">
        <span>⌕</span>
        <input v-model="search" type="text" placeholder="جستجو در کمک‌ها..." />
      </div>
    </section>

    <section class="contributions-list">
      <div v-if="loading" class="state-card" role="status">
        <div class="spinner"></div>
        <p>در حال دریافت کمک‌های شما...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card error-state" role="alert">
        <h2>دریافت کمک‌ها ناموفق بود</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="clear-filters-btn" @click="fetchContributions">تلاش دوباره</button>
      </div>

      <div v-else-if="filteredContributions.length" class="cards">
        <article v-for="item in filteredContributions" :key="item.id" class="contribution-card">
          <div class="card-top">
            <div class="wish-icon">♡</div>
            <div class="wish-info">
              <div class="title-row">
                <h2>{{ item.wishTitle }}</h2>
                <span class="status" :class="{
                  success: item.status === 'paid',
                  pending: item.status === 'pending',
                  failed: item.status === 'failed' || item.status === 'cancelled',
                }">{{ getStatusLabel(item.status) }}</span>
              </div>
              <div class="meta">
                <span>{{ item.city }}</span><span>•</span><span>{{ item.category }}</span><span>•</span><span>{{ item.date }}</span>
              </div>
            </div>
          </div>

          <div class="amount-grid">
            <div class="amount-item"><span>مبلغ کمک ثبت‌شده</span><strong>{{ formatPrice(item.contribution) }} تومان</strong></div>
            <div class="amount-item"><span>مبلغ موردنیاز آرزو</span><strong>{{ formatPrice(item.totalAmount) }} تومان</strong></div>
            <div class="amount-item"><span>میزان تأمین‌شده</span><strong class="primary">{{ getPercentage(item) }}٪</strong></div>
          </div>

          <div class="progress-area">
            <div class="progress" role="progressbar" :aria-valuenow="getPercentage(item)" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :style="{ width: `${getPercentage(item)}%` }"></div>
            </div>
            <div class="progress-footer">
              <span>{{ formatPrice(item.totalFunded) }} تومان پرداخت موفق جمع شده</span>
              <span>از {{ formatPrice(item.totalAmount) }} تومان</span>
            </div>
          </div>

          <div class="card-actions">
            <NuxtLink :to="`/wishes/${item.wishId}`" class="view-btn">مشاهده آرزو</NuxtLink>
            <NuxtLink :to="`/dashboard/messages?wishId=${item.wishId}`" class="details-btn">گفتگو درباره آرزو</NuxtLink>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🤍</div>
        <h2>{{ contributions.length ? 'موردی پیدا نشد' : 'هنوز کمکی ثبت نکرده‌ای' }}</h2>
        <p>{{ contributions.length ? 'عبارت جستجو یا فیلتر انتخابی را تغییر بده.' : 'پس از راه‌اندازی ثبت کمک و پرداخت، کمک‌های واقعی تو در این صفحه نمایش داده می‌شوند.' }}</p>
        <button v-if="contributions.length" type="button" class="clear-filters-btn" @click="clearFilters">پاک کردن فیلترها</button>
        <NuxtLink v-else to="/wishes" class="view-btn empty-link">مشاهده آرزوها</NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.contributions-page { min-height: 100vh; padding: 35px 40px 70px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 25px; margin-bottom: 28px; }
.eyebrow { color: var(--color-primary); font-size: 11px; font-weight: 800; }
.page-header h1 { margin: 7px 0; font-size: 31px; font-weight: 800; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 12px; }
.find-wish-btn { min-height: 46px; padding: 0 18px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; transition: .2s ease; }
.find-wish-btn:hover { background: var(--color-primary-dark); }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
.summary-card { min-height: 94px; display: flex; align-items: center; gap: 13px; padding: 17px; border: 1px solid #eee; border-radius: 16px; background: #fff; }
.summary-icon { width: 43px; height: 43px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: #f0eeff; color: var(--color-primary); font-size: 18px; font-weight: 800; }
.summary-icon.money { font-size: 9px; }
.summary-icon.success { background: #eef8f2; color: #29915d; }
.summary-icon.active { background: #fff5e8; color: #d78a26; }
.summary-card > div:last-child { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.summary-card > div:last-child span { color: var(--color-muted); font-size: 10px; }
.summary-card strong { overflow: hidden; font-size: 19px; font-weight: 800; white-space: nowrap; text-overflow: ellipsis; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.tabs { display: flex; flex-wrap: wrap; gap: 7px; padding: 5px; border-radius: 12px; background: #eeeeF4; }
.tab { min-height: 36px; padding: 0 14px; flex-shrink: 0; border: 0; border-radius: 9px; background: transparent; color: #777782; font-family: inherit; font-size: 10px; font-weight: 700; cursor: pointer; transition: .2s ease; }
.tab.active { background: #fff; color: var(--color-primary); box-shadow: 0 2px 8px rgba(30, 25, 70, .07); }
.search-box { width: min(300px, 100%); height: 42px; display: flex; align-items: center; padding: 0 12px; border: 1px solid #eee; border-radius: 11px; background: #fff; }
.search-box > span { color: #92929d; font-size: 18px; }
.search-box input { width: 100%; height: 100%; padding: 0 8px; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 11px; }
.cards { display: flex; flex-direction: column; gap: 15px; }
.contribution-card { padding: 22px; border: 1px solid #eee; border-radius: 18px; background: #fff; }
.card-top { display: flex; align-items: flex-start; gap: 15px; }
.wish-icon { width: 65px; height: 65px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 16px; background: #f0eeff; color: var(--color-primary); font-size: 32px; }
.wish-info { flex: 1; min-width: 0; }
.title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; }
.title-row h2 { margin: 0; font-size: 16px; font-weight: 800; }
.status { flex-shrink: 0; padding: 6px 9px; border-radius: 999px; background: #fff5e8; color: #d78a26; font-size: 9px; font-weight: 700; }
.status.success { background: #eef8f2; color: #29915d; }
.status.pending { background: #fff5e8; color: #b97718; }
.status.failed { background: #fff0f1; color: #c94452; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; color: var(--color-muted); font-size: 9px; }
.amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 22px; }
.amount-item { padding: 14px 15px; border-radius: 13px; background: #f9f9fc; min-width: 0; }
.amount-item span { display: block; margin-bottom: 6px; color: var(--color-muted); font-size: 9px; }
.amount-item strong { font-size: 12px; font-weight: 800; }
.amount-item strong.primary { color: var(--color-primary); }
.progress-area { margin-top: 15px; }
.progress { width: 100%; height: 7px; overflow: hidden; border-radius: 999px; background: #e5e5ed; }
.progress-bar { height: 100%; border-radius: inherit; background: var(--color-primary); transition: width .4s ease; }
.progress-footer { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-top: 8px; color: var(--color-muted); font-size: 9px; }
.card-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.view-btn, .details-btn { min-height: 38px; padding: 0 14px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-family: inherit; font-size: 10px; font-weight: 700; cursor: pointer; transition: .2s ease; }
.view-btn { background: var(--color-primary); color: #fff; }
.view-btn:hover { background: var(--color-primary-dark); }
.details-btn { border: 1px solid #eee; background: #fff; color: var(--color-text); }
.details-btn:hover { color: var(--color-primary); border-color: #ddd9ff; }
.state-card, .empty-state { min-height: 240px; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed #ddd; border-radius: 18px; background: #fff; text-align: center; }
.state-card p, .empty-state p { margin: 0; color: var(--color-muted); font-size: 12px; line-height: 2; }
.state-card h2, .empty-state h2 { margin: 0; font-size: 19px; }
.error-state { border-color: #f1c5c9; }
.spinner { width: 30px; height: 30px; border: 3px solid #e8e5ff; border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 42px; }
.clear-filters-btn { min-height: 40px; padding: 0 15px; border: 0; border-radius: 10px; background: var(--color-surface); color: var(--color-text); font-family: inherit; font-size: 10px; font-weight: 700; cursor: pointer; }
.empty-link { margin-top: 4px; }
@media (max-width: 1050px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 850px) { .contributions-page { padding: 28px 25px 60px; } }
@media (max-width: 650px) { .contributions-page { padding: 22px 15px 50px; } .page-header { align-items: flex-start; flex-direction: column; } .find-wish-btn { width: 100%; } .summary-grid { grid-template-columns: 1fr; } .toolbar { align-items: stretch; flex-direction: column; } .search-box { width: 100%; } .title-row { align-items: flex-start; flex-direction: column; } .amount-grid { grid-template-columns: 1fr; } .card-actions { flex-wrap: wrap; } }
</style>
