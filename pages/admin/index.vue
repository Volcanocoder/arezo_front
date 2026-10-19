
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

type WishStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'
type FilterStatus = 'all' | WishStatus

interface ApiWish {
  id: number
  title: string
  category: string
  city: string
  requested_amount: number
  applicant_name: string
  status: WishStatus
  created_at: string
}

interface AdminWish {
  id: number
  title: string
  owner: string
  category: string
  city: string
  amount: number
  submittedAt: string
  status: WishStatus
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  current_page: number
  last_page: number
}

interface AdminDashboardStats {
  users: {
    total: number
    today: number
  }
  wishes: {
    total: number
    pending: number
    approved: number
    rejected: number
    needs_info: number
    today: number
  }
  donations: {
    paid_count: number
    paid_amount: number
  }
  daily_activity: {
    date: string
    users: number
    wishes: number
  }[]
}

const API_BASE = 'http://localhost:8000'

const number = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(value)

const activeFilter = ref<FilterStatus>('pending')
const search = ref('')
const feedbackMessage = ref('')
const loadError = ref('')
const isLoading = ref(true)
const isUpdatingWishId = ref<number | null>(null)

const wishes = ref<AdminWish[]>([])
const apiTotal = ref(0)

const dashboardStats = ref<AdminDashboardStats>({
  users: {
    total: 0,
    today: 0,
  },
  wishes: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_info: 0,
    today: 0,
  },
  donations: {
    paid_count: 0,
    paid_amount: 0,
  },
  daily_activity: [],
})

const statsLoading = ref(true)
const statsError = ref('')

const statusLabels: Record<WishStatus, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_info: 'نیازمند اطلاعات بیشتر',
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  )

  const formatNumber = (value: number) =>
  new Intl.NumberFormat('fa-IR').format(value)


  const formatPrice = (amount: number) => formatNumber(amount)
  const chartDays = computed(() =>
  dashboardStats.value.daily_activity.map((item) => {
    const date = new Date(`${item.date}T12:00:00`)

    return {
      ...item,
      label: Number.isNaN(date.getTime())
        ? item.date
        : new Intl.DateTimeFormat('fa-IR', {
            weekday: 'short',
          }).format(date),
      dateLabel: Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('fa-IR', {
            day: 'numeric',
            month: 'short',
          }).format(date),
    }
  }),
)



function barHeight(value: number): string {
  if (value <= 0) return '0%'

  return `${Math.max(6, (value / maxDailyActivity.value) * 100)}%`
}

const maxDailyActivity = computed(() =>
  Math.max(
    1,
    ...dashboardStats.value.daily_activity.flatMap((day) => [
      day.users,
      day.wishes,
    ]),
  ),
)

function barHeight(value: number): string {
  if (value <= 0) return '0%'

  return `${Math.max(6, (value / maxDailyActivity.value) * 100)}%`
}


  if (minutes < 1) return 'لحظاتی پیش'
  if (minutes < 60) return `${number(minutes)} دقیقه پیش`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${number(hours)} ساعت پیش`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${number(days)} روز پیش`

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
  }).format(date)
}

function mapWish(wish: ApiWish): AdminWish {
  return {
    id: wish.id,
    title: wish.title,
    owner: wish.applicant_name,
    category: wish.category,
    city: wish.city,
    amount: Number(wish.requested_amount),
    submittedAt: formatSubmittedAt(wish.created_at),
    status: wish.status,
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
      message?: string
    }

    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(' ')
    }

    return err.data?.message
      || err.message
      || 'خطای نامشخص در ارتباط با سرور'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

async function fetchWishes() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await $fetch<PaginatedResponse<ApiWish>>(
      `${API_BASE}/api/admin/wishes`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    wishes.value = response.data.map(mapWish)
    apiTotal.value = response.total
  } catch (error) {
    loadError.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function fetchDashboardStats() {
  statsLoading.value = true
  statsError.value = ''

  try {
    dashboardStats.value = await $fetch<AdminDashboardStats>(
      `${API_BASE}/api/admin/dashboard/stats`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      },
    )
  } catch (error) {
    statsError.value = getErrorMessage(error)
  } finally {
    statsLoading.value = false
  }
}


function getXsrfToken(): string {
  const match = document.cookie.match(
    /(?:^|;\s*)XSRF-TOKEN=([^;]+)/,
  )

  return match ? decodeURIComponent(match[1]) : ''
}

  async function updateWishStatus(
  id: number,
  newStatus: WishStatus,
) {
  const wish = wishes.value.find((item) => item.id === id)

  if (!wish || isUpdatingWishId.value !== null) {
    return
  }

  let reviewNote = ''

  if (newStatus === 'rejected') {
    const answer = window.prompt(
      'دلیل رد این درخواست را وارد کن:',
    )

    if (answer === null) return

    reviewNote = answer.trim()

    if (!reviewNote) {
      loadError.value = 'برای رد درخواست باید دلیل آن را وارد کنی.'
      return
    }
  }

  feedbackMessage.value = ''
  loadError.value = ''
  isUpdatingWishId.value = id

  try {
    // ابتدا کوکی CSRF را از Laravel دریافت می‌کنیم.
    await $fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })

    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'توکن امنیتی دریافت نشد. اتصال و تنظیمات کوکی را بررسی کن.',
      )
    }

    const result = await $fetch<{
      message: string
      wish: ApiWish
    }>(`${API_BASE}/api/admin/wishes/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: {
        status: newStatus,
        ...(newStatus === 'rejected'
          ? { review_note: reviewNote }
          : {}),
      },
    })

    const index = wishes.value.findIndex(
      (item) => item.id === id,
    )

    if (index !== -1) {
      wishes.value[index] = mapWish(result.wish)
    }

    feedbackMessage.value = result.message
  } catch (error) {
    loadError.value = getErrorMessage(error)
  } finally {
    isUpdatingWishId.value = null
  }
}

const counts = computed(() => ({
  all: dashboardStats.value.wishes.total,
  pending: dashboardStats.value.wishes.pending,
  approved: dashboardStats.value.wishes.approved,
  rejected: dashboardStats.value.wishes.rejected,
  needs_info: dashboardStats.value.wishes.needs_info,
}))

const filteredWishes = computed(() => {
  let result = [...wishes.value]

  if (activeFilter.value !== 'all') {
    result = result.filter(
      (wish) => wish.status === activeFilter.value,
    )
  }

  const query = search.value.trim().toLowerCase()

  if (query) {
    result = result.filter((wish) => {
      const text = [
        wish.title,
        wish.owner,
        wish.category,
        wish.city,
      ].join(' ').toLowerCase()

      return text.includes(query)
    })
  }

  return result
})

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fa-IR').format(amount)

const clearSearch = () => {
  search.value = ''
}

onMounted(() => {
  void Promise.all([
    fetchWishes(),
    fetchDashboardStats(),
  ])
})
</script>

<template>
  <div class="admin-dashboard">

    <!-- Header -->
    <header class="page-header">
      <div>
        <span class="eyebrow">مرکز مدیریت</span>

        <h1>نمای کلی</h1>

        <p>
          وضعیت آرزوها و فعالیت‌های سایت را از اینجا مدیریت کن.
        </p>
      </div>

      <div class="header-date">
        <span class="date-dot"></span>
        پنل مدیریت آرزو
      </div>
    </header>

    <div v-if="statsError" class="stats-error" role="alert">
  دریافت آمار داشبورد ناموفق بود:
  {{ statsError }}

  <button type="button" @click="fetchDashboardStats">
    تلاش مجدد
  </button>
</div>

    <!-- نمودار فعالیت و دسترسی‌های سریع -->
<section class="dashboard-insights">
  <article class="insight-panel chart-panel">
    <header class="insight-heading">
      <div>
        <h2>روند فعالیت سایت</h2>
        <p>مقایسه ثبت‌نام کاربران و ثبت آرزوها</p>
      </div>
      <span class="period-label">۷ روز اخیر</span>
    </header>

    <div class="chart-legend">
      <span>
        <i class="legend-dot users-color"></i>
        ثبت‌نام کاربران
      </span>
      <span>
        <i class="legend-dot wishes-color"></i>
        آرزوهای جدید
      </span>
    </div>

    <div v-if="statsLoading" class="chart-state">
      در حال دریافت اطلاعات نمودار...
    </div>

    <div
      v-else-if="!chartDays.length"
      class="chart-state"
    >
      هنوز اطلاعاتی برای نمایش نمودار وجود ندارد.
    </div>

    <div v-else class="chart-bars">
      <div
        v-for="day in chartDays"
        :key="day.date"
        class="chart-day"
      >
        <div class="bar-pair">
          <div
            class="bar-column"
            :title="`ثبت‌نام کاربران: ${formatNumber(day.users)}`"
          >
            <div
              class="bar users-bar"
              :style="{ height: barHeight(day.users) }"
            ></div>
          </div>

          <div
            class="bar-column"
            :title="`آرزوهای جدید: ${formatNumber(day.wishes)}`"
          >
            <div
              class="bar wishes-bar"
              :style="{ height: barHeight(day.wishes) }"
            ></div>
          </div>
        </div>

        <strong class="chart-day-label">
          {{ day.label }}
        </strong>

        <small class="chart-date-label">
          {{ day.dateLabel }}
        </small>

        <div class="chart-day-values">
          <span class="users-text">
            {{ formatNumber(day.users) }}
          </span>
          <span class="wishes-text">
            {{ formatNumber(day.wishes) }}
          </span>
        </div>
      </div>
    </div>

    <p class="chart-footnote">
      اعداد بر اساس زمان ثبت اطلاعات در دیتابیس محاسبه می‌شوند.
    </p>
  </article>

  <article class="insight-panel quick-panel">
    <header class="insight-heading">
      <div>
        <h2>دسترسی‌های سریع</h2>
        <p>بخش‌های پرکاربرد مدیریت سایت</p>
      </div>
    </header>

    <nav class="quick-links">
      <NuxtLink to="/admin/wishes" class="quick-link">
        <span class="quick-icon purple-icon">♡</span>
        <span class="quick-link-text">
          <strong>بررسی آرزوها</strong>
          <small>مشاهده و تعیین وضعیت درخواست‌ها</small>
        </span>
        <span class="quick-arrow">←</span>
      </NuxtLink>

      <NuxtLink to="/admin/users" class="quick-link">
        <span class="quick-icon blue-icon">♙</span>
        <span class="quick-link-text">
          <strong>مدیریت کاربران</strong>
          <small>مشاهده کاربران و نقش‌های دسترسی</small>
        </span>
        <span class="quick-arrow">←</span>
      </NuxtLink>

      <NuxtLink to="/admin/categories" class="quick-link">
        <span class="quick-icon green-icon">▦</span>
        <span class="quick-link-text">
          <strong>دسته‌بندی‌ها</strong>
          <small>ورود به بخش دسته‌بندی آرزوها</small>
        </span>
        <span class="quick-arrow">←</span>
      </NuxtLink>

      <NuxtLink to="/admin/settings" class="quick-link">
        <span class="quick-icon orange-icon">⚙</span>
        <span class="quick-link-text">
          <strong>تنظیمات سایت</strong>
          <small>ورود به تنظیمات مدیریت</small>
        </span>
        <span class="quick-arrow">←</span>
      </NuxtLink>
    </nav>
  </article>
</section>
    <!-- Stats -->
    <section class="stats-grid">
  <article class="stat-card">
    <div class="stat-icon purple">♙</div>
    <div class="stat-info">
      <span>کل کاربران</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.users.total) }}
      </strong>
      <small>
        امروز: {{ statsLoading ? '…' : formatNumber(dashboardStats.users.today) }} ثبت‌نام
      </small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon purple">♡</div>
    <div class="stat-info">
      <span>کل آرزوها</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.total) }}
      </strong>
      <small>
        امروز: {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.today) }} آرزو
      </small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon orange">◷</div>
    <div class="stat-info">
      <span>در انتظار بررسی</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.pending) }}
      </strong>
      <small>نیازمند اقدام مدیر</small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon green">✓</div>
    <div class="stat-info">
      <span>آرزوهای تأییدشده</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.approved) }}
      </strong>
      <small>آرزوهای منتشرشده</small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon green">♥</div>
    <div class="stat-info">
      <span>مجموع کمک‌های پرداخت‌شده</span>
      <strong class="amount-value">
        {{ statsLoading ? '…' : formatNumber(dashboardStats.donations.paid_amount) }}
      </strong>
      <small>تومان</small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon blue">↗</div>
    <div class="stat-info">
      <span>تعداد پرداخت‌های موفق</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.donations.paid_count) }}
      </strong>
      <small>پرداخت‌های دارای تاریخ پرداخت</small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon red">×</div>
    <div class="stat-info">
      <span>آرزوهای ردشده</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.rejected) }}
      </strong>
      <small>در صورت نیاز قابل بازبینی</small>
    </div>
  </article>

  <article class="stat-card">
    <div class="stat-icon blue">⋯</div>
    <div class="stat-info">
      <span>نیازمند اطلاعات بیشتر</span>
      <strong>
        {{ statsLoading ? '…' : formatNumber(dashboardStats.wishes.needs_info) }}
      </strong>
      <small>منتظر تکمیل اطلاعات</small>
    </div>
  </article>
</section>

    <!-- Review Section -->
    <section class="review-panel">

      <div class="panel-header">
        <div>
          <h2>مدیریت آرزوها</h2>
          <p>
            آرزوها را بررسی کن و برای هرکدام تصمیم بگیر.
          </p>
        </div>

        <span class="total-badge">
          {{ filteredWishes.length }} مورد
        </span>
      </div>

      <!-- Feedback -->
      <div
        v-if="feedbackMessage"
        class="feedback"
        role="status"
      >
        <span>✓</span>
        <p>{{ feedbackMessage }}</p>

        <button
          type="button"
          aria-label="بستن پیام"
          @click="feedbackMessage = ''"
        >
          ×
        </button>
      </div>

      <!-- Filters -->
      <div class="toolbar">

        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: activeFilter === 'pending' }"
            @click="activeFilter = 'pending'"
          >
            در انتظار
            <span>{{ counts.pending }}</span>
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: activeFilter === 'approved' }"
            @click="activeFilter = 'approved'"
          >
            تأیید شده
            <span>{{ counts.approved }}</span>
          </button>

          <button
            type="button"
            class="tab"
            :class="{ active: activeFilter === 'rejected' }"
            @click="activeFilter = 'rejected'"
          >
            رد شده
            <span>{{ counts.rejected }}</span>
          </button>
          <button
  type="button"
  class="tab"
  :class="{ active: activeFilter === 'needs_info' }"
  @click="activeFilter = 'needs_info'"
>
  نیازمند اطلاعات بیشتر
  <span>{{ counts.needs_info }}</span>
        </button>
          <button
            type="button"
            class="tab"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            همه
          </button>
        </div>

        <label class="search-box">
          <span>⌕</span>

          <input
            v-model="search"
            type="text"
            placeholder="جستجو در آرزوها..."
          />

          <button
            v-if="search"
            type="button"
            aria-label="پاک کردن جستجو"
            @click="clearSearch"
          >
            ×
          </button>
        </label>

      </div>

      <div v-if="isLoading" class="empty-state">
  <h3>در حال دریافت آرزوها...</h3>
  <p>درخواست‌ها از دیتابیس دریافت می‌شوند.</p>
</div>

<div v-else-if="loadError" class="empty-state">
  <h3>دریافت اطلاعات ناموفق بود</h3>
  <p>{{ loadError }}</p>
  <button type="button" @click="fetchWishes">
    تلاش دوباره
  </button>
</div>

      <!-- Table -->
      <div
       v-else-if="filteredWishes.length"
       class="table-wrapper"
      >
        <table>
          <thead>
            <tr>
              <th>آرزو و ثبت‌کننده</th>
              <th>دسته‌بندی</th>
              <th>شهر</th>
              <th>مبلغ تقریبی</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="wish in filteredWishes"
              :key="wish.id"
            >
              <td>
                <div class="wish-cell">
                  <div class="wish-avatar">♡</div>

                  <div>
                    <strong>{{ wish.title }}</strong>
                    <span>{{ wish.owner }}</span>
                    <small>{{ wish.submittedAt }}</small>
                  </div>
                </div>
              </td>

              <td>
                <span class="category-label">
                  {{ wish.category }}
                </span>
              </td>

              <td class="city-cell">{{ wish.city }}</td>

              <td class="amount-cell">
                {{ formatPrice(wish.amount) }} تومان
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="wish.status"
                >
                  {{ statusLabels[wish.status] }}
                </span>
              </td>

              <td>
                <div class="row-actions">

                  <button
                    v-if="wish.status !== 'approved'"
                    type="button"
                    class="approve-btn"
                    @click="updateWishStatus(wish.id, 'approved')"
                  >
                    تأیید
                  </button>

                  <NuxtLink
  :to="`/admin/wishes/${wish.id}`"
  class="details-btn"
>
  بررسی پرونده
</NuxtLink>

                  <button
                    v-if="wish.status !== 'rejected'"
                    type="button"
                    class="reject-btn"
                    @click="updateWishStatus(wish.id, 'rejected')"
                  >
                    رد کردن
                  </button>

                  <button
                    v-if="wish.status !== 'pending'"
                    type="button"
                    class="reset-btn"
                    @click="updateWishStatus(wish.id, 'pending')"
                  >
                    بازگردانی
                  </button>

                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">⌕</div>

        <h3>موردی پیدا نشد</h3>

        <p>
          جستجو یا فیلتر انتخاب‌شده نتیجه‌ای ندارد.
        </p>

        <button
          type="button"
          @click="activeFilter = 'all'; search = ''"
        >
          نمایش همه آرزوها
        </button>
      </div>

    </section>

    <p class="demo-note">
  اطلاعات از دیتابیس دریافت می‌شوند و تغییر وضعیت پرونده‌ها
  از طریق API ذخیره می‌شود. در حال حاضر اولین ۱۵ درخواست بارگذاری می‌شوند.
</p>

  </div>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  padding: 35px 35px 60px;
}

/* Header */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
}

.page-header h1 {
  margin: 7px 0;
  font-size: 30px;
  font-weight: 800;
}

.amount-value {
  overflow-wrap: anywhere;
  font-size: 21px !important;
  line-height: 1.8;
}

.stat-icon.blue {
  background: #eef5ff;
  color: #3978cf;
}

.stats-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 13px 16px;
  border-radius: 12px;
  background: #fff0f1;
  color: #b8404e;
  font-size: 11px;
  line-height: 1.9;
}

.stats-error button {
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  color: #b8404e;
  font-family: inherit;
  cursor: pointer;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 2;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  background: #ffffff;
  color: #696976;
  font-size: 10px;
  white-space: nowrap;
}

.date-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #36b777;
}

/* Stats */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  min-width: 0;
  min-height: 125px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 20px;
  border: 1px solid #eeeeee;
  border-radius: 17px;
  background: #ffffff;
}

.stat-icon {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  font-size: 21px;
  font-weight: 800;
}

.stat-icon.purple {
  background: #f0eeff;
  color: #6d5dfc;
}

.stat-icon.orange {
  background: #fff4e5;
  color: #d78a26;
}

.stat-icon.green {
  background: #eaf8f0;
  color: #29915d;
}

.stat-icon.red {
  background: #fff0f1;
  color: #d45b68;
}

.stat-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-info > span {
  color: var(--color-muted);
  font-size: 10px;
}

.stat-info strong {
  font-size: 26px;
  font-weight: 800;
}

.stat-info small {
  color: #9a9aa4;
  font-size: 9px;
  line-height: 1.8;
}

/* Review panel */

.review-panel {
  overflow: hidden;
  border: 1px solid #eeeeee;
  border-radius: 20px;
  background: #ffffff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 24px 25px;
}

.panel-header h2 {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 800;
}

.panel-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.total-badge {
  flex-shrink: 0;
  padding: 7px 11px;
  border-radius: 9px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 700;
}

/* Feedback */

.feedback {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 25px 18px;
  padding: 12px 14px;
  border: 1px solid #d9eee1;
  border-radius: 11px;
  background: #f1faf4;
  color: #267b4c;
}

.feedback > span {
  font-size: 15px;
  font-weight: 800;
}

.feedback p {
  flex: 1;
  margin: 0;
  font-size: 10px;
  line-height: 1.9;
}

.feedback button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
}

.status-badge.needs_info {
  background: #f0eeff;
  color: var(--color-primary);
}

/* Toolbar */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 25px 20px;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 12px;
  background: #f0f0f5;
}

/* نمودار فعالیت و دسترسی‌های سریع */
.dashboard-insights {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.9fr);
  gap: 20px;
  margin-bottom: 25px;
}

.insight-panel {
  min-width: 0;
  padding: 22px;
  border: 1px solid #eeeeee;
  border-radius: 18px;
  background: #ffffff;
}

.insight-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.insight-heading h2 {
  margin: 0 0 7px;
  font-size: 16px;
  font-weight: 800;
}

.insight-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.period-label {
  flex-shrink: 0;
  padding: 7px 9px;
  border-radius: 8px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 23px;
  color: #777782;
  font-size: 10px;
}

.chart-legend > span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.users-color {
  background: #7566e8;
}

.wishes-color {
  background: #46b889;
}

.chart-bars {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 7px;
  min-height: 225px;
  margin-top: 18px;
  padding: 15px 0 0;
  border-bottom: 1px solid #eeeeee;
}

.chart-day {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.bar-pair {
  width: 100%;
  height: 145px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 5px;
}

.bar-column {
  width: min(35%, 25px);
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  border-radius: 6px 6px 2px 2px;
  transition: height 0.3s ease;
}

.users-bar {
  background: #7566e8;
}

.wishes-bar {
  background: #46b889;
}

.chart-day-label {
  color: #555563;
  font-size: 9px;
}

.chart-date-label {
  color: #9999a3;
  font-size: 9px;
  white-space: nowrap;
}

.chart-day-values {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 7px;
  padding-bottom: 10px;
  font-size: 9px;
}

.users-text {
  color: #7566e8;
}

.wishes-text {
  color: #299b70;
}

.chart-footnote {
  margin: 13px 0 0;
  color: #9999a3;
  font-size: 9px;
  line-height: 1.9;
}

.chart-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-size: 11px;
  text-align: center;
  line-height: 2;
}

.quick-links {
  display: flex;
  flex-direction: column;
  margin-top: 18px;
}

.quick-link {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f3;
  color: var(--color-text);
  transition: background 0.2s ease;
}

.quick-link:last-child {
  border-bottom: 0;
}

.quick-link:hover {
  background: #fafaff;
}

.quick-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 18px;
}

.purple-icon {
  background: #f0eeff;
  color: #7566e8;
}

.blue-icon {
  background: #eef5ff;
  color: #3978cf;
}

.green-icon {
  background: #eaf8f0;
  color: #29915d;
}

.orange-icon {
  background: #fff4e5;
  color: #d78a26;
}

.quick-link-text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quick-link-text strong {
  font-size: 11px;
  font-weight: 800;
}

.quick-link-text small {
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.8;
}

.quick-arrow {
  flex-shrink: 0;
  color: #9999a3;
  font-size: 17px;
}

@media (max-width: 1100px) {
  .dashboard-insights {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 650px) {
  .insight-panel {
    padding: 17px 12px;
  }

  .chart-bars {
    gap: 3px;
  }

  .bar-pair {
    gap: 3px;
    height: 120px;
  }

  .chart-day-label,
  .chart-date-label,
  .chart-day-values {
    font-size: 8px;
  }
}

.tab {
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #71717d;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.2s ease;
}

.tab span {
  min-width: 19px;
  height: 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 6px;
  background: rgba(120, 120, 140, 0.1);
  font-size: 9px;
}

.tab.active {
  background: #ffffff;
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(30, 25, 70, 0.06);
}

.search-box {
  width: min(260px, 100%);
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border: 1px solid #e8e8ee;
  border-radius: 11px;
  background: #ffffff;
}

.search-box > span {
  color: #9999a3;
  font-size: 18px;
}

.search-box input {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 10px;
}

.search-box button {
  border: 0;
  background: transparent;
  color: #888892;
  font-size: 18px;
  cursor: pointer;
}

/* Table */

.table-wrapper {
  overflow-x: auto;
  border-top: 1px solid #eeeeee;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  text-align: right;
}

thead {
  background: #fafafd;
}

th {
  padding: 15px 17px;
  color: #888894;
  font-size: 10px;
  font-weight: 700;
}

td {
  padding: 16px 17px;
  border-top: 1px solid #f0f0f3;
  font-size: 10px;
}

tbody tr:hover {
  background: #fdfdff;
}

.wish-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.wish-avatar {
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 19px;
}

.wish-cell > div:last-child {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.wish-cell strong {
  max-width: 230px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
}

.wish-cell span {
  color: #777782;
  font-size: 10px;
}

.wish-cell small {
  color: #a1a1aa;
  font-size: 9px;
}

.category-label {
  display: inline-flex;
  padding: 6px 9px;
  border-radius: 8px;
  background: #f5f5f9;
  color: #666673;
  font-size: 9px;
}

.city-cell {
  color: #696975;
}

.amount-cell {
  font-weight: 700;
}

/* Status */

.status-badge {
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
}

.status-badge.pending {
  background: #fff4e5;
  color: #c57a1b;
}

.status-badge.approved {
  background: #eaf8f0;
  color: #278750;
}

.status-badge.rejected {
  background: #fff0f1;
  color: #c24f5c;
}

/* Row actions */

.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.details-btn {
  min-height: 31px;
  padding: 0 9px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #ded9ff;
  border-radius: 8px;

  background: #f0eeff;
  color: var(--color-primary);

  font-family: inherit;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;

  transition: background 0.2s ease;
}

.details-btn:hover {
  background: #e5e1ff;
}

.approve-btn,
.reject-btn,
.reset-btn {
  min-height: 31px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.approve-btn {
  background: #eaf8f0;
  color: #278750;
}

.approve-btn:hover {
  background: #d9f1e3;
}

.reject-btn {
  background: #fff0f1;
  color: #c24f5c;
}

.reject-btn:hover {
  background: #ffe1e4;
}

.reset-btn {
  background: #f0eeff;
  color: var(--color-primary);
}

.reset-btn:hover {
  background: #e5e1ff;
}

/* Empty state */

.empty-state {
  padding: 70px 20px;
  border-top: 1px solid #eeeeee;
  text-align: center;
}

.empty-icon {
  margin-bottom: 12px;
  color: #aaaab4;
  font-size: 35px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 17px;
}

.empty-state p {
  margin: 0 0 18px;
  color: var(--color-muted);
  font-size: 11px;
}

.empty-state button {
  min-height: 39px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: #f0eeff;
  color: var(--color-primary);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.demo-note {
  margin: 18px 0 0;
  color: #9999a3;
  font-size: 10px;
  line-height: 2;
  text-align: center;
}

/* Responsive */

@media (max-width: 1100px) {
  .admin-dashboard {
    padding: 28px 22px 50px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }
}

@media (max-width: 650px) {
  .admin-dashboard {
    padding: 22px 12px 40px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-header {
    padding: 20px 15px;
  }

  .toolbar {
    padding: 0 15px 17px;
  }

  .tabs {
    overflow-x: auto;
  }

  .tab {
    padding-inline: 10px;
  }

  th,
  td {
    padding: 13px 12px;
  }
}
</style>