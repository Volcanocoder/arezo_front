<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

type ApiWishStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'
type DisplayStatus =
  | 'در انتظار بررسی'
  | 'تأیید شده'
  | 'رد شده'
  | 'نیازمند تکمیل اطلاعات'
type WishStatus = 'همه' | DisplayStatus

interface ApiWish {
  id: number
  title: string
  description?: string | null
  category: string
  city: string
  requested_amount: number | string
  status: ApiWishStatus
  review_note?: string | null
  created_at: string
}

interface PaginatedWishes {
  data?: ApiWish[]
  current_page?: number
  last_page?: number
  message?: string
}

interface MyWish {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  status: DisplayStatus
  createdAt: string
  reviewNote: string
}

const API_BASE = 'http://localhost:8000'

const statusLabels: Record<ApiWishStatus, DisplayStatus> = {
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_info: 'نیازمند تکمیل اطلاعات',
}

const statuses: WishStatus[] = [
  'همه',
  'در انتظار بررسی',
  'تأیید شده',
  'رد شده',
  'نیازمند تکمیل اطلاعات',
]

const selectedStatus = ref<WishStatus>('همه')
const search = ref('')
const wishes = ref<MyWish[]>([])
const isLoading = ref(false)
const loadError = ref('')

const clearFilters = () => {
  selectedStatus.value = 'همه'
  search.value = ''
}

const fetchWishes = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const allRows: ApiWish[] = []
    let page = 1

    // دریافت همه صفحات؛ API به‌صورت صفحه‌بندی‌شده پاسخ می‌دهد.
    while (page <= 100) {
      const response = await fetch(`${API_BASE}/api/my/wishes?page=${page}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })

      const payload = (await response.json().catch(() => null)) as PaginatedWishes | null

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('نشست کاربری معتبر نیست؛ دوباره وارد حساب کاربری شوید.')
        }
        throw new Error(payload?.message || 'دریافت آرزوها با خطا روبه‌رو شد.')
      }

      const rows = Array.isArray(payload?.data) ? payload.data : []
      allRows.push(...rows)

      const currentPage = Number(payload?.current_page ?? page)
      const lastPage = Number(payload?.last_page ?? currentPage)
      if (rows.length === 0 || currentPage >= lastPage) break
      page += 1
    }

    wishes.value = allRows.map((item) => ({
      id: Number(item.id),
      title: item.title || 'آرزوی بدون عنوان',
      description: item.description || '',
      category: item.category || 'بدون دسته‌بندی',
      city: item.city || 'ثبت نشده',
      amount: Number(item.requested_amount || 0),
      status: statusLabels[item.status] || 'در انتظار بررسی',
      createdAt: item.created_at,
      reviewNote: item.review_note || '',
    }))
  } catch (error) {
    loadError.value = error instanceof Error
      ? error.message
      : 'ارتباط با سرور برقرار نشد. اتصال بک‌اند را بررسی کن.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWishes)

const pendingCount = computed(
  () => wishes.value.filter((wish) => wish.status === 'در انتظار بررسی').length,
)
const approvedCount = computed(
  () => wishes.value.filter((wish) => wish.status === 'تأیید شده').length,
)

const filteredWishes = computed(() => {
  let result = [...wishes.value]

  if (selectedStatus.value !== 'همه') {
    result = result.filter((wish) => wish.status === selectedStatus.value)
  }

  if (search.value.trim()) {
    const query = search.value.trim().toLocaleLowerCase('fa-IR')
    result = result.filter((wish) =>
      `${wish.title} ${wish.description} ${wish.category} ${wish.city} ${wish.status}`
        .toLocaleLowerCase('fa-IR')
        .includes(query),
    )
  }

  return result
})

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fa-IR').format(price)

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'تاریخ نامشخص'
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
</script>

<template>

  <main class="my-wishes-page">

    <!-- Header -->

    <header class="page-header">

      <div>

        <span class="eyebrow">

          پنل کاربری

        </span>

        <h1>

          آرزوهای من

        </h1>

        <p>

          آرزوهایی که ثبت کرده‌ای را مدیریت و وضعیتشان را پیگیری کن.

        </p>

      </div>

      <NuxtLink

        to="/create-wish"

        class="create-btn"

      >

        + ثبت آرزوی جدید

      </NuxtLink>

    </header>

    <!-- Stats -->

    <section class="summary-grid">

      <div class="summary-card">

        <span class="summary-icon">

          ♡

        </span>

        <div>

          <span>

            مجموع آرزوها

          </span>

          <strong>

            {{ wishes.length }}

          </strong>

        </div>

      </div>

      <div class="summary-card">

        <span class="summary-icon">

          ◔

        </span>

        <div>

          <span>

            در انتظار بررسی

          </span>

          <strong>

            {{

              wishes.filter(

                (wish) => wish.status === 'در انتظار بررسی'

              ).length

            }}

          </strong>

        </div>

      </div>

      <div class="summary-card">

        <span class="summary-icon success">

          ✓

        </span>

        <div>

          <span>

            تأیید شده

          </span>

          <strong>

            {{

              wishes.filter(

                (wish) => wish.status === 'تأیید شده'

              ).length

            }}

          </strong>

        </div>

      </div>

    </section>

    <!-- Filters -->

    <section class="toolbar">

      <div class="tabs">

        <button

          v-for="status in statuses"

          :key="status"

          type="button"

          class="tab"

          :class="{

            active: selectedStatus === status

          }"

          @click="selectedStatus = status"

        >

          {{ status }}

        </button>

      </div>

      <div class="search-box">

        <span>

          ⌕

        </span>

        <input

          v-model="search"

          type="text"

          placeholder="جستجوی آرزو..."

        />

      </div>

    </section>

    <!-- List -->

    <section class="wishes-list">
      <div v-if="isLoading && !wishes.length" class="state-message">
        در حال دریافت آرزوهای ثبت‌شده...
      </div>
      <div v-else-if="loadError" class="error-state">
        <p>{{ loadError }}</p>
        <button type="button" @click="fetchWishes">تلاش دوباره</button>
      </div>
      <div v-else-if="filteredWishes.length" class="cards">

        <article

          v-for="wish in filteredWishes"

          :key="wish.id"

          class="wish-card"

        >

          <!-- Top -->

          <div class="wish-top">

            <div class="wish-image">

              ❤️

            </div>

            <div class="wish-main">

              <div class="title-row">

                <h2>

                  {{ wish.title }}

                </h2>

                <span

                  class="status"
                  :class="{
                    success: wish.status === 'تأیید شده',
                    rejected: wish.status === 'رد شده',
                    'needs-info': wish.status === 'نیازمند تکمیل اطلاعات'
                  }"

                >

                  {{ wish.status }}

                </span>

              </div>

              <div class="meta">

                <span>

                  {{ wish.category }}

                </span>

                <span>

                  •

                </span>

                <span>

                  {{ wish.city }}

                </span>

                <span>

                  •

                </span>

                <span>

                  {{ formatDate(wish.createdAt) }}

                </span>

              </div>

              <p>

                {{ wish.description }}

              </p>

            </div>

          </div>

          <!-- Requested amount -->
          <div class="amount-section">
            <span>مبلغ درخواستی</span>
            <strong>{{ formatPrice(wish.amount) }} تومان</strong>
          </div>
          <div v-if="wish.reviewNote" class="review-note">
            <strong>پیام بررسی:</strong>
            {{ wish.reviewNote }}
          </div>

          <!-- Actions -->

          <div class="wish-actions">

            <NuxtLink

              :to="`/wishes/${wish.id}`"

              class="secondary-action"

            >

              مشاهده آرزو

            </NuxtLink>

            <!-- <button

              type="button"

              class="secondary-action"

              @click="console.log('Edit wish:', wish.id)"

            >

              ویرایش

            </button> -->

          </div>

        </article>

      </div>

      <!-- Empty -->

      <div

        v-else

        class="empty-state"

      >

        <div class="empty-icon">

          🔎

        </div>

        <h2>

          آرزویی پیدا نشد

        </h2>

        <p>

          فیلتر یا عبارت جستجو را تغییر بده.

        </p>

        <button

            type="button"

            @click="clearFilters"

            >

            پاک کردن فیلترها

        </button>

      </div>

    </section>

  </main>

</template>

<style scoped>

.my-wishes-page {

  min-height: 100vh;

  padding: 35px 40px 70px;

}

/* =========================

   Header

\========================= */

.page-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  margin-bottom: 28px;

}

.eyebrow {

  color: var(--color-primary);

  font-size: 11px;

  font-weight: 800;

}

.page-header h1 {

  margin: 7px 0;

  font-size: 31px;

  font-weight: 800;

}

.page-header p {

  margin: 0;

  color: var(--color-muted);

  font-size: 12px;

}

.create-btn {

  height: 46px;

  padding: 0 18px;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-shrink: 0;

  border-radius: 12px;

  background: var(--color-primary);

  color: #ffffff;

  font-size: 12px;

  font-weight: 700;

  transition: 0.2s ease;

}

.create-btn:hover {

  background: var(--color-primary-dark);

}

/* =========================

   Summary

\========================= */

.summary-grid {

  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 15px;

  margin-bottom: 25px;

}

.summary-card {

  min-height: 90px;

  display: flex;

  align-items: center;

  gap: 13px;

  padding: 17px;

  border: 1px solid #eeeeee;

  border-radius: 16px;

  background: #ffffff;

}

.summary-icon {

  width: 43px;

  height: 43px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 12px;

  background: #f0eeff;

  color: var(--color-primary);

  font-size: 19px;

  font-weight: 800;

}

.summary-icon.success {

  background: #eef8f2;

  color: #29915d;

}

.summary-card > div {

  display: flex;

  flex-direction: column;

  gap: 4px;

}

.summary-card span:not(.summary-icon) {

  color: var(--color-muted);

  font-size: 10px;

}

.summary-card strong {

  font-size: 21px;

  font-weight: 800;

}

/* =========================

   Toolbar

\========================= */

.toolbar {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 20px;

}

.tabs {

  display: flex;

  gap: 7px;

  padding: 5px;

  border-radius: 12px;

  background: #eeeeF4;

}

.tab {

  min-height: 36px;

  padding: 0 14px;

  border: 0;

  border-radius: 9px;

  background: transparent;

  color: #777782;

  font-family: inherit;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.2s ease;

}

.tab.active {

  background: #ffffff;

  color: var(--color-primary);

  box-shadow:

    0 2px 8px rgba(30, 25, 70, 0.07);

}

.search-box {

  width: min(300px, 100%);

  height: 42px;

  display: flex;

  align-items: center;

  padding: 0 12px;

  border: 1px solid #eeeeee;

  border-radius: 11px;

  background: #ffffff;

}

.search-box span {

  color: #92929d;

  font-size: 18px;

}

.search-box input {

  width: 100%;

  height: 100%;

  padding: 0 8px;

  border: 0;

  outline: 0;

  background: transparent;

  font-family: inherit;

  font-size: 11px;

}

/* =========================

   Cards

\========================= */

.cards {

  display: flex;

  flex-direction: column;

  gap: 15px;

}

.wish-card {

  padding: 22px;

  border: 1px solid #eeeeee;

  border-radius: 18px;

  background: #ffffff;

}

.wish-top {

  display: flex;

  align-items: flex-start;

  gap: 15px;

}

.wish-image {

  width: 74px;

  height: 74px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 17px;

  background: #f0eeff;

  font-size: 31px;

}

.wish-main {

  flex: 1;

  min-width: 0;

}

.title-row {

  display: flex;

  align-items: flex-start;

  justify-content: space-between;

  gap: 15px;

}

.title-row h2 {

  margin: 0;

  font-size: 16px;

  font-weight: 800;

}

.status {

  flex-shrink: 0;

  padding: 6px 9px;

  border-radius: 999px;

  background: #fff5e8;

  color: #d78a26;

  font-size: 9px;

  font-weight: 700;

}

.status.rejected {
  background: #fff0f0;
  color: #c94343;
}

.status.needs-info {
  background: #eef4ff;
  color: #3569b8;
}

.status.success {

  background: #eef8f2;

  color: #29915d;

}

.meta {

  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin-top: 7px;

  color: var(--color-muted);

  font-size: 9px;

}

.wish-main p {

  margin: 9px 0 0;

  color: var(--color-muted);

  font-size: 10px;

  line-height: 1.9;

}

/* =========================

   Progress

\========================= */

.progress-section {

  margin-top: 22px;

  padding: 16px;

  border-radius: 14px;

  background: #f9f9fc;

}

.progress-top {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  margin-bottom: 9px;

}

.progress-top > div {

  display: flex;

  align-items: center;

  gap: 7px;

}

.progress-top span {

  color: var(--color-muted);

  font-size: 9px;

}

.progress-top strong {

  font-size: 10px;

}

.percentage {

  color: var(--color-primary);

}

.progress {

  width: 100%;

  height: 7px;

  overflow: hidden;

  border-radius: 999px;

  background: #e4e4ec;

}

.progress-bar {

  height: 100%;

  border-radius: inherit;

  background: var(--color-primary);

  transition: width 0.4s ease;

}

.progress-bottom {

  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-top: 9px;

  gap: 15px;

  color: var(--color-muted);

  font-size: 9px;

}

/* =========================

   Actions

\========================= */

.wish-actions {

  display: flex;

  align-items: center;

  gap: 8px;

  margin-top: 17px;

}

.secondary-action,

.danger-action {

  min-height: 38px;

  padding: 0 13px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 10px;

  font-family: inherit;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.2s ease;

}

.secondary-action {

  border: 1px solid #eeeeee;

  background: #ffffff;

  color: var(--color-text);

}

.secondary-action:hover {

  border-color: #ded9ff;

  color: var(--color-primary);

}

.danger-action {

  margin-right: auto;

  border: 0;

  background: #fff1f2;

  color: #dc5f6a;

}

.danger-action:hover {

  background: #ffe4e7;

}

/* =========================

   Empty

\========================= */

.empty-state {

  padding: 80px 20px;

  display: flex;

  flex-direction: column;

  align-items: center;

  border: 1px dashed #dddddf;

  border-radius: 18px;

  background: #ffffff;

  text-align: center;

}

.empty-icon {

  margin-bottom: 12px;

  font-size: 42px;

}

.empty-state h2 {

  margin: 0 0 7px;

  font-size: 19px;

}

.empty-state p {

  margin: 0 0 18px;

  color: var(--color-muted);

  font-size: 11px;

}

.empty-state button {

  min-height: 40px;

  padding: 0 15px;

  border: 0;

  border-radius: 10px;

  background: var(--color-surface);

  color: var(--color-text);

  font-family: inherit;

  font-size: 10px;

  font-weight: 700;

  cursor: pointer;

}

/* =========================

   Responsive

\========================= */

@media (max-width: 850px) {

  .my-wishes-page {

    padding: 28px 25px 60px;

  }

}

@media (max-width: 650px) {

  .my-wishes-page {

    padding: 22px 15px 50px;

  }

  .page-header {

    align-items: flex-start;

    flex-direction: column;

  }

  .create-btn {

    width: 100%;

  }

  .summary-grid {

    grid-template-columns: 1fr;

  }

  .toolbar {

    align-items: stretch;

    flex-direction: column;

  }

  .tabs {

    overflow-x: auto;

  }

  .tab {

    white-space: nowrap;

  }

  .search-box {

    width: 100%;

  }

  .wish-top {

    align-items: flex-start;

  }

  .title-row {

    align-items: flex-start;

    flex-direction: column;

  }

  .wish-actions {

    flex-wrap: wrap;

  }

  .danger-action {

    margin-right: 0;

  }

}

</style>