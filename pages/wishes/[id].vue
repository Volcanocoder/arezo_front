<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: 'default'
})

interface ApiWish {
  id: number
  title?: string | null
  description?: string | null
  story?: string | null
  category?: string | null
  city?: string | null
  requested_amount?: number | string | null
  created_at?: string | null
  image_url?: string | null
  funded_amount?: number | string | null
  supporters_count?: number | string | null
}

interface Wish {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  createdAt: string
  story: string
  imageUrl: string | null
  fundedAmount: number
  supportersCount: number
}

const route = useRoute()
const wish = ref<Wish | null>(null)

const loading = ref(true)
const notFound = ref(false)
const errorMessage = ref('')
const imageFailed = ref(false)

const siteUrl = useRuntimeConfig().public.siteUrl
useSeoMeta({
  title: () => `${wish.value?.title || 'جزئیات آرزو'} | آرزو`,
  description: () => (wish.value?.description || 'جزئیات آرزو در پلتفرم آرزو').slice(0, 160),
  ogTitle: () => wish.value?.title || 'جزئیات آرزو',
  ogDescription: () => (wish.value?.description || '').slice(0, 160),
  ogImage: () => wish.value?.imageUrl || undefined,
  robots: () => (notFound.value ? 'noindex' : 'index, follow'),
})
useHead({ link: [{ rel: 'canonical', href: () => `${siteUrl}/wishes/${route.params.id}` }] })

const wishId = computed(() => {
  const param = route.params.id
  return String(Array.isArray(param) ? param[0] ?? '' : param ?? '').trim()
})

const formatDate = (value?: string | null) => {
  if (!value) return 'تاریخ ثبت نامشخص'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'تاریخ ثبت نامشخص'

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const fetchWish = async () => {
  loading.value = true
  notFound.value = false
  errorMessage.value = ''
  wish.value = null
  imageFailed.value = false

  if (!/^\d+$/.test(wishId.value)) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const response = await fetch(`${useApiBase()}/api/wishes/${encodeURIComponent(wishId.value)}`, {
      headers: { Accept: 'application/json' }
    })

    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (response.status === 404) {
      notFound.value = true
      return
    }

    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message || '')
        : ''
      throw new Error(message || `دریافت جزئیات آرزو با خطا مواجه شد (${response.status}).`)
    }

    const item = payload as ApiWish
    if (!item || typeof item !== 'object' || !Number(item.id)) {
      throw new Error('پاسخ دریافتی از سرور معتبر نیست.')
    }

    wish.value = {
      id: Number(item.id),
      title: item.title || 'آرزوی بدون عنوان',
      description: item.description || item.story || 'توضیحی برای این آرزو ثبت نشده است.',
      category: item.category || 'متفرقه',
      city: item.city || 'ثبت نشده',
      amount: Math.max(0, Number(item.requested_amount) || 0),
      createdAt: formatDate(item.created_at),
      story: item.story || item.description || 'جزئیات بیشتری برای این آرزو ثبت نشده است.',
      imageUrl: item.image_url || null,
      fundedAmount: Math.max(0, Number(item.funded_amount) || 0),
      supportersCount: Math.max(0, Number(item.supporters_count) || 0)
    }
  } catch (error) {
    console.error('Failed to load wish details:', error)
    errorMessage.value = error instanceof Error
      ? error.message
      : 'ارتباط با سرور برقرار نشد. دوباره تلاش کن.'
  } finally {
    loading.value = false
  }
}

const percentage = computed(() => {
  if (!wish.value || wish.value.amount <= 0) return 0
  return Math.min(100, Math.round((wish.value.fundedAmount / wish.value.amount) * 100))
})

const remainingAmount = computed(() => {
  if (!wish.value) return 0
  return Math.max(0, wish.value.amount - wish.value.fundedAmount)
})

// Donation modal state. Actual payment is not enabled until a gateway is connected.
const showDonationModal = ref(false)
const donationMode = ref<'partial' | 'full'>('partial')
const partialAmount = ref<number | null>(null)

const selectedDonationAmount = computed(() => {
  if (!wish.value) return 0
  if (donationMode.value === 'full') return remainingAmount.value
  const value = Number(partialAmount.value)
  return Number.isFinite(value) ? Math.floor(value) : 0
})

const donationAmountIsValid = computed(() => {
  return remainingAmount.value > 0
    && selectedDonationAmount.value >= 1000
    && selectedDonationAmount.value <= remainingAmount.value
})

const openDonationModal = (mode: 'partial' | 'full') => {
  if (remainingAmount.value <= 0) return
  donationMode.value = mode
  partialAmount.value = null
  showDonationModal.value = true
}

const closeDonationModal = () => {
  showDonationModal.value = false
}

const setSuggestedAmount = (amount: number) => {
  if (remainingAmount.value <= 0) return
  partialAmount.value = Math.min(amount, remainingAmount.value)
}

const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)

// پرداخت آنلاین
interface PublicGateway { id: number, title: string, is_default: boolean }
const gateways = ref<PublicGateway[]>([])
const selectedGatewayId = ref<number | null>(null)
const { api } = useApi()
const paying = ref(false)
const payError = ref('')
const paymentEnabled = computed(() => gateways.value.length > 0)

const loadGateways = async () => {
  try {
    const res = await $fetch<{ data: PublicGateway[] }>(`${useApiBase()}/api/payments/gateways`, {
      headers: { Accept: 'application/json' },
    })
    gateways.value = res.data
    selectedGatewayId.value = res.data.find(g => g.is_default)?.id ?? res.data[0]?.id ?? null
  } catch {
    gateways.value = []
  }
}

const startPayment = async () => {
  if (!donationAmountIsValid.value || paying.value || !wish.value) return

  paying.value = true
  payError.value = ''

  try {
    const res = await api<{ payment_url: string }>(`/api/wishes/${wish.value.id}/donate`, {
      method: 'POST',
      body: { amount: selectedDonationAmount.value, gateway_id: selectedGatewayId.value },
    })
    window.location.href = res.payment_url
  } catch (error) {
    payError.value = apiErrorMessage(error, 'شروع پرداخت انجام نشد. دوباره تلاش کن.')
    paying.value = false
  }
}

onMounted(() => {
  fetchWish()
  loadGateways()
})
watch(wishId, () => {
  void fetchWish()
})
</script>

<template>
  <main class="wish-page">
    <section v-if="loading" class="message-state" aria-live="polite">
      <div class="state-icon">⌛</div>
      <h1>در حال دریافت اطلاعات آرزو...</h1>
      <p>چند لحظه صبر کن.</p>
    </section>

    <section v-else-if="errorMessage" class="message-state" aria-live="polite">
      <div class="state-icon">!</div>
      <h1>دریافت اطلاعات ناموفق بود</h1>
      <p>{{ errorMessage }}</p>
      <button type="button" class="back-btn" @click="fetchWish">تلاش دوباره</button>
      <NuxtLink to="/wishes" class="back-text">بازگشت به آرزوها</NuxtLink>
    </section>

    <section v-else-if="notFound || !wish" class="not-found">
      <div class="not-found-icon">🔎</div>
      <h1>آرزو پیدا نشد</h1>
      <p>این آرزو وجود ندارد، تأیید نشده یا از سایت حذف شده است.</p>
      <NuxtLink to="/wishes" class="back-btn">بازگشت به آرزوها</NuxtLink>
    </section>

    <template v-else>
      <section class="wish-top">
        <div class="container">
          <NuxtLink to="/wishes" class="back-link">← بازگشت به آرزوها</NuxtLink>
          <div class="breadcrumb">
            <NuxtLink to="/wishes">آرزوها</NuxtLink>
            <span>/</span>
            {{ wish.category }}
          </div>
        </div>
      </section>

      <section class="wish-content-section">
        <div class="container">
          <div class="wish-layout">
            <div class="main-column">
              <div class="wish-image">
                <img
                  v-if="wish.imageUrl && !imageFailed"
                  :src="wish.imageUrl"
                  :alt="`تصویر آرزو: ${wish.title}`"
                  decoding="async"
                  @error="imageFailed = true"
                />
                <div v-else class="image-placeholder" aria-label="تصویری برای این آرزو موجود نیست">
                  <span>♡</span>
                  <small>تصویری برای این آرزو ثبت نشده</small>
                </div>
                <span class="category-badge">{{ wish.category }}</span>
                <span class="status-badge">تأییدشده</span>
              </div>

              <article class="story-card">
                <div class="author">
                  <div class="avatar">آ</div>
                  <div>
                    <strong>متقاضی آرزو</strong>
                    <span>{{ wish.city }} · {{ wish.createdAt }}</span>
                  </div>
                </div>

                <h1>{{ wish.title }}</h1>
                <p class="short-description">{{ wish.description }}</p>
                <div class="divider"></div>
                <h2>داستان این آرزو</h2>
                <p class="story">{{ wish.story }}</p>
              </article>

              <section class="contact-owner-card" aria-label="گفتگو با صاحب آرزو">
                <div class="contact-owner-icon" aria-hidden="true">💬</div>
                <div class="contact-owner-copy">
                  <h2>سؤالی درباره این آرزو داری؟</h2>
                  <p>می‌توانی پیش از تصمیم‌گیری، درباره جزئیات آرزو با متقاضی گفتگو کنی.</p>
                </div>
                <NuxtLink
                  :to="`/dashboard/messages?wish_id=${wish.id}`"
                  class="contact-owner-button"
                >
                  گفتگو با صاحب آرزو
                </NuxtLink>
              </section>
            </div>

            <aside class="side-column">
              <div class="donation-card">
                <div class="card-header">
                  <span>مبلغ موردنیاز</span>
                  <strong>{{ formatPrice(wish.amount) }} تومان</strong>
                </div>

                <div class="funding-progress">
                  <div class="progress-header">
                    <span>{{ formatPrice(wish.fundedAmount) }} تومان تأمین‌شده</span>
                    <strong>{{ percentage }}٪</strong>
                  </div>
                  <div
                    class="progress-track"
                    role="progressbar"
                    :aria-valuenow="percentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`درصد تأمین آرزو ${percentage} درصد`"
                  >
                    <div class="progress-bar" :style="{ width: `${percentage}%` }"></div>
                  </div>
                  <div class="progress-footer">
                    <span>باقی‌مانده</span>
                    <strong>{{ formatPrice(remainingAmount) }} تومان</strong>
                  </div>
                  <div class="supporters-count">
                    <span>تعداد کمک‌های موفق ثبت‌شده</span>
                    <strong>{{ new Intl.NumberFormat('fa-IR').format(wish.supportersCount) }}</strong>
                  </div>
                </div>

                <div class="funding-notice">
                  <span class="notice-icon">ⓘ</span>
                  <p>مجموع بالا فقط کمک‌هایی را حساب می‌کند که پرداختشان توسط درگاه تأیید و در سرور ثبت شده باشد.</p>
                </div>

                <div class="donation-actions">
                  <button
                    type="button"
                    class="primary-action"
                    :disabled="remainingAmount <= 0"
                    @click="openDonationModal('partial')"
                  >
                    می‌خواهم کمک جزئی کنم
                  </button>
                  <button
                    type="button"
                    class="full-amount-action"
                    :disabled="remainingAmount <= 0"
                    @click="openDonationModal('full')"
                  >
                    پرداخت کل مبلغ باقی‌مانده
                  </button>
                  <NuxtLink to="/wishes" class="secondary-action">
                    مشاهده آرزوهای دیگر
                  </NuxtLink>
                </div>

                <p v-if="remainingAmount <= 0" class="notice">
                  مبلغ موردنیاز این آرزو تأمین شده است.
                </p>
                <p v-else class="notice">
                  مبلغ دلخواهت را انتخاب کن؛ پرداخت از طریق درگاه امن انجام می‌شود.
                </p>
              </div>

              <div class="trust-card">
                <h3>درباره امنیت</h3>
                <div class="trust-item">
                  <span>✓</span>
                  <p>فقط آرزوهای تأییدشده برای عموم نمایش داده می‌شوند.</p>
                </div>
                <div class="trust-item">
                  <span>✓</span>
                  <p>اطلاعات تماس و مدارک خصوصی متقاضی منتشر نمی‌شوند.</p>
                </div>
                <div class="trust-item">
                  <span>✓</span>
                  <p>هر درخواست پیش از انتشار توسط مدیر بررسی می‌شود.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </template>

    <!-- Donation amount modal: selection only; payment gateway is not connected yet. -->
    <div
      v-if="showDonationModal && wish"
      class="modal-backdrop"
      role="presentation"
      @click.self="closeDonationModal"
    >
      <section
        class="donation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-modal-title"
      >
        <header class="modal-header">
          <div>
            <span class="modal-eyebrow">همراهی با یک آرزو</span>
            <h2 id="donation-modal-title">انتخاب مبلغ کمک</h2>
          </div>
          <button type="button" class="modal-close" aria-label="بستن پنجره" @click="closeDonationModal">×</button>
        </header>

        <p class="modal-wish-title">{{ wish.title }}</p>

        <div class="modal-amount-summary">
          <span>مبلغ باقی‌مانده</span>
          <strong>{{ formatPrice(remainingAmount) }} تومان</strong>
        </div>

        <div class="donation-mode-options" role="group" aria-label="نوع کمک">
          <button
            type="button"
            class="mode-option"
            :class="{ selected: donationMode === 'partial' }"
            :aria-pressed="donationMode === 'partial'"
            @click="donationMode = 'partial'"
          >
            <span class="mode-option-title">کمک با مبلغ دلخواه</span>
            <small>هر مبلغی تا سقف مبلغ باقی‌مانده</small>
          </button>
          <button
            type="button"
            class="mode-option"
            :class="{ selected: donationMode === 'full' }"
            :aria-pressed="donationMode === 'full'"
            @click="donationMode = 'full'"
          >
            <span class="mode-option-title">تأمین کل مبلغ باقی‌مانده</span>
            <small>تکمیل مبلغ موردنیاز این آرزو</small>
          </button>
        </div>

        <div v-if="donationMode === 'partial'" class="modal-field">
          <label for="partial-donation-amount">مبلغ کمک (تومان)</label>
          <input
            id="partial-donation-amount"
            v-model.number="partialAmount"
            type="number"
            inputmode="numeric"
            min="1000"
            step="1000"
            :max="remainingAmount"
            placeholder="مثلاً ۲۰۰۰۰۰"
          />
          <div class="suggested-amounts">
            <button
              v-for="amount in [50000, 100000, 200000]"
              :key="amount"
              type="button"
              :disabled="amount > remainingAmount"
              @click="setSuggestedAmount(amount)"
            >
              {{ formatPrice(amount) }} تومان
            </button>
          </div>
          <p v-if="partialAmount !== null && !donationAmountIsValid" class="amount-error" role="alert">
            مبلغ باید حداقل ۱٬۰۰۰ تومان و بیشتر از مبلغ باقی‌مانده نباشد.
          </p>
        </div>

        <div v-else class="full-amount-summary">
          <span>مبلغ انتخاب‌شده برای تأمین کامل</span>
          <strong>{{ formatPrice(remainingAmount) }} تومان</strong>
        </div>

        <div v-if="!paymentEnabled" class="gateway-notice" role="status">
          <span aria-hidden="true">ⓘ</span>
          <p>پرداخت آنلاین فعلاً فعال نیست و هیچ وجهی دریافت نمی‌شود. بعد از فعال‌شدن درگاه، همین‌جا می‌توانی پرداخت کنی.</p>
        </div>

        <div v-else class="modal-field">
          <label v-if="gateways.length > 1" for="gateway-select">درگاه پرداخت</label>
          <select v-if="gateways.length > 1" id="gateway-select" v-model="selectedGatewayId">
            <option v-for="g in gateways" :key="g.id" :value="g.id">{{ g.title }}</option>
          </select>
          <p class="gateway-hint">پس از زدن دکمه، به صفحه امن درگاه پرداخت منتقل می‌شوی.</p>
        </div>

        <p v-if="payError" class="amount-error" role="alert">{{ payError }}</p>

        <footer class="modal-actions">
          <button type="button" class="modal-secondary" @click="closeDonationModal">بستن</button>
          <button
            type="button"
            class="modal-primary"
            :disabled="!paymentEnabled || !donationAmountIsValid || paying"
            @click="startPayment"
          >
            {{ paying ? 'در حال انتقال به درگاه...' : paymentEnabled ? `پرداخت ${donationAmountIsValid ? formatPrice(selectedDonationAmount) + ' تومان' : ''}` : 'پرداخت فعلاً فعال نیست' }}
          </button>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.gateway-hint { margin: 6px 0 0; color: var(--color-muted); font-size: 12px; }
.wish-page { min-height: 100vh; background: #f8f8fc; }
.container { width: min(1150px, 100%); margin: 0 auto; }
.wish-top { padding: 28px 20px; background: #fff; border-bottom: 1px solid #eee; }
.back-link { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 15px; color: var(--color-muted); font-size: 13px; transition: .2s ease; }
.back-link:hover, .back-text:hover { color: var(--color-primary); }
.breadcrumb { display: flex; align-items: center; gap: 10px; color: #9999a3; font-size: 12px; }
.breadcrumb a { color: inherit; }
.breadcrumb span { color: #ccccd1; }
.wish-content-section { padding: 55px 20px 110px; }
.wish-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(330px, .85fr); gap: 28px; align-items: start; }
.main-column { min-width: 0; }
.wish-image { position: relative; height: 430px; overflow: hidden; border-radius: 28px; background: linear-gradient(135deg, #efedff, #fff); margin-bottom: 24px; }
.wish-image > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.image-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--color-primary); background: linear-gradient(135deg, #efedff, #fff); }
.image-placeholder span { font-size: 100px; line-height: 1; }
.image-placeholder small { color: var(--color-muted); font-size: 12px; }
.category-badge, .status-badge { position: absolute; top: 20px; padding: 9px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.category-badge { right: 20px; background: rgba(255,255,255,.92); color: var(--color-primary); }
.status-badge { left: 20px; background: rgba(38,160,100,.92); color: #fff; }
.story-card { padding: 30px; border-radius: 24px; background: #fff; border: 1px solid #eee; }
.author { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.avatar { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #eeeaff; color: var(--color-primary); font-size: 17px; font-weight: 800; }
.author > div:last-child { display: flex; flex-direction: column; gap: 4px; }
.author strong { font-size: 14px; }
.author span { color: var(--color-muted); font-size: 11px; }
.story-card h1 { margin: 0 0 14px; color: var(--color-text); font-size: clamp(28px, 4vw, 40px); line-height: 1.5; font-weight: 800; }
.short-description { margin: 0; color: var(--color-muted); font-size: 15px; line-height: 2.1; white-space: pre-line; }
.divider { height: 1px; margin: 30px 0; background: #eee; }
.story-card h2 { margin: 0 0 14px; font-size: 20px; font-weight: 800; }
.story { margin: 0; color: #565663; font-size: 14px; line-height: 2.3; white-space: pre-line; }
.side-column { display: flex; flex-direction: column; gap: 18px; position: sticky; top: 105px; }
.donation-card { padding: 25px; border: 1px solid #eee; border-radius: 22px; background: #fff; }
.card-header { display: flex; flex-direction: column; gap: 7px; margin-bottom: 20px; }
.card-header span { color: var(--color-muted); font-size: 12px; }
.card-header strong { font-size: 25px; font-weight: 800; }
.funding-progress { padding: 18px; border-radius: 16px; background: #f8f8fc; }
.progress-header, .progress-footer, .supporters-count { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.progress-header { margin-bottom: 10px; }
.progress-header span, .progress-footer span, .supporters-count span { color: var(--color-muted); font-size: 11px; }
.progress-header strong { color: var(--color-primary); font-size: 12px; }
.progress-track { height: 8px; overflow: hidden; border-radius: 999px; background: #e7e7ef; }
.progress-bar { height: 100%; border-radius: inherit; background: var(--color-primary); transition: width .4s ease; }
.progress-footer { margin-top: 12px; }
.progress-footer strong { font-size: 11px; }
.supporters-count { margin-top: 14px; padding-top: 12px; border-top: 1px solid #e8e8f0; }
.supporters-count strong { font-size: 12px; }
.funding-notice { display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; padding: 14px; border-radius: 14px; background: #f8f8fc; }
.notice-icon { flex-shrink: 0; color: var(--color-primary); font-size: 18px; }
.funding-notice p { margin: 0; color: var(--color-muted); font-size: 11px; line-height: 2; }
.donation-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.primary-action, .full-amount-action, .secondary-action { width: 100%; min-height: 48px; padding: 12px 16px; display: flex; align-items: center; justify-content: center; border-radius: 13px; text-align: center; font-family: inherit; font-size: 12px; font-weight: 700; transition: .2s ease; cursor: pointer; }
.primary-action { border: 0; background: var(--color-primary); color: #fff; }
.primary-action:hover:not(:disabled) { background: var(--color-primary-dark); }
.full-amount-action { border: 1px solid #dcd6ff; background: #f4f2ff; color: var(--color-primary); }
.full-amount-action:hover:not(:disabled) { background: #eae6ff; }
.primary-action:disabled, .full-amount-action:disabled { opacity: .5; cursor: not-allowed; }
.secondary-action { border: 1px solid #eee; background: #fff; color: var(--color-text); text-decoration: none; }
.secondary-action:hover { background: var(--color-surface); }
.notice { margin: 15px 0 0; color: #9999a3; font-size: 10px; line-height: 1.9; text-align: center; }
.contact-owner-card { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 18px; padding: 20px; border: 1px solid #eae7ff; border-radius: 18px; background: linear-gradient(135deg, #fff, #f8f7ff); }
.contact-owner-icon { width: 44px; height: 44px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 13px; background: #eeeaff; font-size: 21px; }
.contact-owner-copy { flex: 1; min-width: 180px; }
.contact-owner-copy h2 { margin: 0 0 5px; font-size: 14px; font-weight: 800; }
.contact-owner-copy p { margin: 0; color: var(--color-muted); font-size: 11px; line-height: 1.9; }
.contact-owner-button { min-height: 42px; padding: 0 15px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 700; transition: .2s ease; }
.contact-owner-button:hover { background: var(--color-primary-dark); }
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(23, 20, 45, .48); backdrop-filter: blur(5px); }
.donation-modal { width: min(100%, 520px); max-height: min(90vh, 760px); overflow-y: auto; padding: 24px; border: 1px solid rgba(255,255,255,.65); border-radius: 24px; background: #fff; box-shadow: 0 24px 80px rgba(20, 15, 50, .2); }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; }
.modal-eyebrow { color: var(--color-primary); font-size: 10px; font-weight: 800; }
.modal-header h2 { margin: 6px 0 0; font-size: 22px; font-weight: 800; }
.modal-close { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid #eee; border-radius: 10px; background: #fff; color: #666; font-size: 24px; cursor: pointer; }
.modal-wish-title { margin: 18px 0; color: var(--color-muted); font-size: 12px; line-height: 1.9; }
.modal-amount-summary, .full-amount-summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; border-radius: 13px; background: #f8f7ff; }
.modal-amount-summary span, .full-amount-summary span { color: var(--color-muted); font-size: 11px; }
.modal-amount-summary strong, .full-amount-summary strong { color: var(--color-primary); font-size: 15px; }
.donation-mode-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 18px 0; }
.mode-option { min-height: 86px; padding: 13px; border: 1px solid #e8e7ef; border-radius: 14px; background: #fff; text-align: right; cursor: pointer; transition: .2s ease; }
.mode-option.selected { border-color: var(--color-primary); background: #f6f4ff; box-shadow: 0 0 0 2px rgba(109,93,252,.08); }
.mode-option-title { display: block; margin-bottom: 7px; color: var(--color-text); font-size: 12px; font-weight: 800; }
.mode-option small { color: var(--color-muted); font-size: 10px; line-height: 1.8; }
.modal-field { margin-top: 14px; }
.modal-field label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; }
.modal-field input { width: 100%; height: 46px; padding: 0 13px; border: 1px solid #dedde8; border-radius: 11px; outline: 0; color: var(--color-text); font-family: inherit; font-size: 13px; }
.modal-field input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(109,93,252,.08); }
.suggested-amounts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.suggested-amounts button { padding: 7px 9px; border: 1px solid #e9e6ff; border-radius: 9px; background: #f8f7ff; color: var(--color-primary); font-family: inherit; font-size: 10px; cursor: pointer; }
.suggested-amounts button:disabled { opacity: .4; cursor: not-allowed; }
.amount-error { margin: 8px 0 0; color: #bc3f50; font-size: 10px; }
.full-amount-summary { margin-top: 14px; }
.gateway-notice { display: flex; align-items: flex-start; gap: 10px; margin-top: 18px; padding: 13px; border-radius: 13px; background: #fff8e9; color: #78531d; }
.gateway-notice > span { flex-shrink: 0; font-size: 17px; }
.gateway-notice p { margin: 0; font-size: 10px; line-height: 2; }
.modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; }
.modal-secondary, .modal-primary { min-height: 42px; padding: 0 15px; border-radius: 10px; font-family: inherit; font-size: 11px; font-weight: 700; }
.modal-secondary { border: 1px solid #e6e5ed; background: #fff; color: var(--color-text); cursor: pointer; }
.modal-primary { border: 0; background: #eeedf3; color: #85838e; cursor: not-allowed; }
.trust-card { padding: 23px; border-radius: 20px; background: #fff; border: 1px solid #eee; }
.trust-card h3 { margin: 0 0 18px; font-size: 15px; font-weight: 800; }
.trust-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
.trust-item:last-child { margin-bottom: 0; }
.trust-item span { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #eef8f2; color: #29915d; font-size: 11px; font-weight: 800; }
.trust-item p { margin: 0; color: var(--color-muted); font-size: 11px; line-height: 1.9; }
.not-found, .message-state { min-height: 70vh; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.not-found-icon, .state-icon { margin-bottom: 15px; font-size: 55px; color: var(--color-primary); }
.not-found h1, .message-state h1 { margin: 0 0 10px; font-size: 28px; font-weight: 800; }
.not-found p, .message-state p { max-width: 620px; margin: 0 0 25px; color: var(--color-muted); font-size: 14px; line-height: 2; }
.back-btn { min-height: 46px; padding: 0 20px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 12px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.back-text { margin-top: 14px; color: var(--color-muted); font-size: 12px; }
@media (max-width: 900px) { .wish-layout { grid-template-columns: 1fr; } .side-column { position: static; } .wish-image { height: 350px; } }
@media (max-width: 600px) { .wish-content-section { padding-top: 30px; } .wish-image { height: 270px; border-radius: 20px; } .story-card { padding: 22px; border-radius: 20px; } .donation-card { padding: 20px; } .contact-owner-card { align-items: stretch; } .contact-owner-button { width: 100%; } .donation-modal { padding: 18px; border-radius: 19px; } .donation-mode-options { grid-template-columns: 1fr; } .modal-actions { flex-direction: column-reverse; } .modal-secondary, .modal-primary { width: 100%; } }
</style>
