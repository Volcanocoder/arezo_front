
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'
interface ApiWish {
  id: number
  title: string
  category: string
  city: string
  requested_amount: number | string
  urgency: string
  created_at: string
  description: string | null
  story: string
  status: ReviewStatus
  applicant_name: string
  applicant_mobile: string
  applicant_email: string | null
  applicant_relation: string | null
  identity_document_path: string | null
  evidence_document_path: string | null
  wish_image_path: string | null
  review_note: string | null
  reviewed_at: string | null
}

interface ReviewDocument {
  type: 'image' | 'identity' | 'evidence'
  title: string
  description: string
  status: 'pending' | 'verified' | 'missing'
}

interface WishCase {
  id: number
  title: string
  category: string
  city: string
  amount: number
  urgency: string
  submittedAt: string
  description: string
  story: string
  status: ReviewStatus
  applicant: {
    fullName: string
    mobile: string
    email: string
    nationalId: string
    birthDate: string
    city: string
    address: string
    registeredAt: string
    previousWishes: number | string
  }
  documents: ReviewDocument[]
}

const route = useRoute()
const API_BASE = useApiBase()

const wish = ref<WishCase | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref('')
const decisionNote = ref('')
const feedback = ref('')
const feedbackType = ref<'success' | 'error' | 'info'>('info')

const verification = reactive({
  phone: false,
  identity: false,
  need: false,
  amount: false,
})

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_info: 'نیازمند اطلاعات بیشتر',
}

const verificationItems = computed(() => [
  {
    key: 'phone',
    title: 'شماره موبایل تأیید شده است',
    done: verification.phone,
  },
  {
    key: 'identity',
    title: 'هویت با مدرک معتبر تطبیق داده شده است',
    done: verification.identity,
  },
  {
    key: 'need',
    title: 'شواهد مرتبط با نیاز بررسی شده‌اند',
    done: verification.need,
  },
  {
    key: 'amount',
    title: 'مبلغ درخواست بررسی شده است',
    done: verification.amount,
  },
])

const completedChecks = computed(
  () => verificationItems.value.filter(item => item.done).length,
)

const allChecksCompleted = computed(
  () => completedChecks.value === verificationItems.value.length,
)

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fa-IR').format(amount)

function formatSubmittedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'تاریخ نامشخص'
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function mapDocument(
  title: string,
  path: string | null,
  type: ReviewDocument['type'],
): ReviewDocument {
  return {
    type,
    title,
    description: path
      ? 'فایل بارگذاری شده و آماده بررسی است.'
      : 'برای این پرونده فایلی بارگذاری نشده است.',
    status: path ? 'pending' : 'missing',
  }
}

function mapWish(data: ApiWish): WishCase {
  const urgencyLabels: Record<string, string> = {
    normal: 'عادی',
    important: 'مهم',
    urgent: 'فوری',
  }

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    city: data.city,
    amount: Number(data.requested_amount),
    urgency: urgencyLabels[data.urgency] ?? data.urgency,
    submittedAt: formatSubmittedAt(data.created_at),
    description: data.description || 'توضیح کوتاهی ثبت نشده است.',
    story: data.story,
    status: data.status,
    applicant: {
      fullName: data.applicant_name,
      mobile: data.applicant_mobile,
      email: data.applicant_email ?? '',
      nationalId: 'ثبت نشده',
      birthDate: 'ثبت نشده',
      city: data.city,
      address: 'در فرم فعلی ثبت آرزو دریافت نشده است.',
      registeredAt: 'اطلاعات در دسترس نیست',
      previousWishes: 'محاسبه نشده',
    },
    documents: [
    mapDocument('تصویر آرزو', data.wish_image_path, 'image'),
    mapDocument('مدرک هویتی', data.identity_document_path, 'identity'),
    mapDocument(
      'مدرک مرتبط با آرزو',
      data.evidence_document_path,
      'evidence',
      ),
    ],
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
      || 'خطایی در ارتباط با سرور رخ داد.'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

function setFeedback(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
) {
  feedback.value = message
  feedbackType.value = type
}

async function loadWish() {
  isLoading.value = true
  loadError.value = ''
  wish.value = null

  try {
    const id = Number(route.params.id)

    if (!Number.isInteger(id) || id < 1) {
      throw new Error('شناسه پرونده معتبر نیست.')
    }

    const response = await $fetch<{ wish: ApiWish }>(
      `${API_BASE}/api/admin/wishes/${id}`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      },
    )

    wish.value = mapWish(response.wish)
    decisionNote.value = response.wish.review_note ?? ''
  } catch (error) {
    loadError.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function getXsrfToken(): string {
  const match = document.cookie.match(
    /(?:^|;\s*)XSRF-TOKEN=([^;]+)/,
  )

  return match ? decodeURIComponent(match[1]) : ''
}

async function saveStatus(
  status: 'approved' | 'rejected' | 'needs_info',
  note?: string,
) {
  if (!wish.value || isSaving.value) {
    return
  }

  isSaving.value = true
  feedback.value = ''

  try {
    // دریافت کوکی CSRF برای درخواست تغییر وضعیت
    await $fetch(`${API_BASE}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })

    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'توکن امنیتی دریافت نشد. اتصال و تنظیمات کوکی را بررسی کن.',
      )
    }

    const response = await $fetch<{
      message: string
      wish: ApiWish
    }>(`${API_BASE}/api/admin/wishes/${wish.value.id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: {
        status,
        ...(note ? { review_note: note } : {}),
      },
    })

    wish.value = mapWish(response.wish)
    decisionNote.value = response.wish.review_note ?? ''
    setFeedback(response.message, 'success')
  } catch (error) {
    setFeedback(getErrorMessage(error), 'error')
  } finally {
    isSaving.value = false
  }
}

async function approveWish() {
  if (!wish.value) return

  if (!allChecksCompleted.value) {
    setFeedback(
      'برای تأیید، ابتدا تمام موارد چک‌لیست را بررسی کن.',
      'error',
    )
    return
  }

  await saveStatus(
    'approved',
    decisionNote.value.trim() || undefined,
  )
}

async function rejectWish() {
  if (!wish.value) return

  if (decisionNote.value.trim().length < 10) {
    setFeedback(
      'برای رد آرزو، دلیل تصمیم را با حداقل ۱۰ کاراکتر وارد کن.',
      'error',
    )
    return
  }

  await saveStatus('rejected', decisionNote.value.trim())
}

async function requestMoreInfo() {
  if (!wish.value) return

  const note = decisionNote.value.trim()

  if (note.length < 10) {
    setFeedback(
      'اطلاعات یا مدارک موردنیاز را با حداقل ۱۰ کاراکتر مشخص کن.',
      'error',
    )
    return
  }

  await saveStatus('needs_info', note)
}


async function inspectDocument(documentTitle: string) {
  if (!wish.value) return

  const document = wish.value.documents.find(
    item => item.title === documentTitle,
  )

  if (!document || document.status === 'missing') {
    setFeedback('فایلی برای این مدرک ثبت نشده است.', 'info')
    return
  }

  // پنجره را قبل از درخواست شبکه باز می‌کنیم تا مسدود نشود.
  const previewWindow = window.open('', '_blank')

  if (!previewWindow) {
    setFeedback(
      'مرورگر باز شدن تب جدید را مسدود کرده است. اجازه باز شدن پنجره‌ها را فعال کن.',
      'error',
    )
    return
  }

  previewWindow.document.title = 'در حال دریافت مدرک...'
  previewWindow.document.body.textContent = 'در حال دریافت فایل امن...'

  try {
    const response = await fetch(
      `${API_BASE}/api/admin/wishes/${wish.value.id}/documents/${document.type}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/pdf, image/*, application/json',
        },
      },
    )

    if (!response.ok) {
      const responseText = await response.text()
      let message = 'دریافت مدرک ناموفق بود.'

      try {
        const errorData = JSON.parse(responseText)
        message = errorData.message || message
      } catch {
        // در صورت نبود پاسخ JSON، پیام عمومی نمایش داده می‌شود.
      }

      throw new Error(message)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    previewWindow.location.href = objectUrl

    setFeedback(
      `فایل «${document.title}» با موفقیت دریافت شد.`,
      'success',
    )

    // پس از فرصت کافی برای بارگذاری فایل، نشانی موقت پاک می‌شود.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000)
  } catch (error) {
    previewWindow.close()
    setFeedback(getErrorMessage(error), 'error')
  }
}

onMounted(loadWish)
</script>

<template>
  <main class="case-page">
    <section v-if="isLoading" class="not-found">
    <h1>در حال دریافت پرونده...</h1>
    <p>اطلاعات از سرور دریافت می‌شوند.</p>
  </section>

    <section v-else-if="loadError" class="not-found">
      <h1>دریافت پرونده ناموفق بود</h1>
      <p>{{ loadError }}</p>

      <button type="button" class="back-btn" @click="loadWish">
        تلاش دوباره
      </button>

      <NuxtLink to="/admin/wishes" class="back-btn">
        بازگشت به پنل مدیریت
      </NuxtLink>
    </section>

    <div v-else-if="wish">

      <!-- Header -->
      <header class="page-header">
        <div class="header-copy">
          <NuxtLink to="/admin/wishes" class="back-link">
            ← بازگشت به فهرست آرزوها
          </NuxtLink>

          <span class="eyebrow">بررسی محرمانه پرونده</span>

          <h1>{{ wish.title }}</h1>

          <p>
            کد پرونده: {{ wish.id }}
            <span>·</span>
            ثبت‌شده در {{ wish.submittedAt }}
          </p>
        </div>

        <span class="status-badge" :class="wish.status">
          {{ statusLabels[wish.status] }}
        </span>
      </header>

      <div
        v-if="feedback"
        class="feedback"
        :class="feedbackType"
        role="status"
      >
        <p>{{ feedback }}</p>

        <button type="button" @click="feedback = ''">
          ×
        </button>
      </div>

      <!-- Two-column review layout -->
      <div class="review-layout">

        <div class="main-column">

          <!-- Wish details -->
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>اطلاعات کامل آرزو</h2>
                <p>جزئیات درخواست و دلیل ثبت آن</p>
              </div>

              <span class="panel-icon">♡</span>
            </div>

            <div class="wish-information">
              <div class="info-box">
                <span>دسته‌بندی</span>
                <strong>{{ wish.category }}</strong>
              </div>

              <div class="info-box">
                <span>شهر</span>
                <strong>{{ wish.city }}</strong>
              </div>

              <div class="info-box">
                <span>مبلغ درخواستی</span>
                <strong>{{ formatPrice(wish.amount) }} تومان</strong>
              </div>

              <div class="info-box">
                <span>فوریت اعلام‌شده</span>
                <strong>{{ wish.urgency }}</strong>
              </div>
            </div>

            <div class="text-section">
              <h3>توضیح کوتاه</h3>
              <p>{{ wish.description }}</p>
            </div>

            <div class="text-section">
              <h3>داستان کامل آرزو</h3>
              <p>{{ wish.story }}</p>
            </div>
          </section>

          <!-- Applicant personal information -->
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>اطلاعات هویتی و تماس</h2>
                <p>اطلاعات خصوصی متقاضی؛ فقط برای بررسی مجاز</p>
              </div>

              <span class="private-label">محرمانه</span>
            </div>

            <div class="personal-grid">

              <div class="personal-field">
                <span>نام و نام خانوادگی</span>
                <strong>{{ wish.applicant.fullName }}</strong>
              </div>

              <div class="personal-field">
                <span>شماره موبایل</span>

                <strong class="ltr-value">
                  {{ wish.applicant.mobile }}
                </strong>

                <a :href="`tel:${wish.applicant.mobile}`" class="contact-link">
                  تماس
                </a>
              </div>

              <div class="personal-field">
                <span>ایمیل</span>
                <strong>{{ wish.applicant.email || 'ثبت نشده' }}</strong>

              <a
                v-if="wish.applicant.email"
                :href="`mailto:${wish.applicant.email}`"
                class="contact-link"
              >
                ارسال ایمیل
              </a>
              </div>

              <div class="personal-field">
                <span>کد ملی نمونه</span>
                <strong class="ltr-value">
                  {{ wish.applicant.nationalId }}
                </strong>
              </div>

              <div class="personal-field">
                <span>تاریخ تولد اعلام‌شده</span>
                <strong>{{ wish.applicant.birthDate }}</strong>
              </div>

              <div class="personal-field">
                <span>شهر محل سکونت</span>
                <strong>{{ wish.applicant.city }}</strong>
              </div>

              <div class="personal-field full-width">
                <span>نشانی اعلام‌شده</span>
                <strong>{{ wish.applicant.address }}</strong>
              </div>

              <div class="personal-field">
                <span>تاریخ ساخت حساب</span>
                <strong>{{ wish.applicant.registeredAt }}</strong>
              </div>

              <div class="personal-field">
                <span>تعداد آرزوهای قبلی</span>
                <strong>
                  {{ wish.applicant.previousWishes }}
                </strong>
              </div>

            </div>

            <p class="privacy-note">
              اطلاعات بالا برای طراحی نمایشی است. در نسخه واقعی، مشاهده و استفاده
              از اطلاعات هویتی باید به مدیران مجاز محدود و ثبت شود.
            </p>
          </section>

          <!-- Documents -->
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>مدارک و شواهد</h2>
                <p>فایل‌هایی که متقاضی برای بررسی ارسال می‌کند</p>
              </div>
            </div>

            <div class="document-list">
              <div
                v-for="(document, index) in wish.documents"
                :key="document.title"
                class="document-item"
              >
                <div class="document-icon">▤</div>

                <div class="document-info">
                  <strong>{{ document.title }}</strong>
                  <span>{{ document.description }}</span>
                </div>

                <span class="document-status" :class="document.status">
                  {{
                    document.status === 'verified'
                      ? 'بررسی‌شده'
                      : document.status === 'missing'
                        ? 'فاقد مدرک'
                        : 'در انتظار'
                  }}
                </span>

                <button
                  type="button"
                  class="document-btn"
                  @click="inspectDocument(document.title)"
                >
                  {{
                    document.status === 'missing'
                      ? 'درخواست مدرک'
                      : `بررسی ${index + 1}`
                  }}
                </button>
              </div>
            </div>

            <div class="document-guidance">
              <strong>چه مدارکی مفید هستند؟</strong>
              <p>
                برای مثال، مدرک هویتی متناسب با سیاست سایت، پیش‌فاکتور معتبر،
                توضیح قابل بررسی درباره نیاز و شواهد متناسب با نوع درخواست.
                برای همه آرزوها نباید یک نوع مدرک ثابت و غیرضروری مطالبه کرد.
              </p>
            </div>
          </section>

        </div>

        <!-- Verification and decision -->
        <aside class="side-column">

          <section class="panel verification-panel">
            <div class="panel-heading">
              <div>
                <h2>چک‌لیست اعتبارسنجی</h2>
                <p>موارد بررسی‌شده توسط مدیر</p>
              </div>
            </div>

            <div class="check-progress">
              <div class="check-progress-top">
                <span>پیشرفت بررسی</span>
                <strong>{{ completedChecks }} از ۴</strong>
              </div>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: `${completedChecks / 4 * 100}%` }"
                />
              </div>
            </div>

            <label class="check-item">
              <input v-model="verification.phone" type="checkbox" />
              <span>
                <strong>تأیید شماره موبایل</strong>
                <small>از طریق فرایند تأیید شماره</small>
              </span>
            </label>

            <label class="check-item">
              <input v-model="verification.identity" type="checkbox" />
              <span>
                <strong>تطبیق هویت متقاضی</strong>
                <small>مطابقت مشخصات با مدرک معتبر</small>
              </span>
            </label>

            <label class="check-item">
              <input v-model="verification.need" type="checkbox" />
              <span>
                <strong>بررسی شواهد نیاز</strong>
                <small>متناسب با نوع آرزو و بدون جمع‌آوری اطلاعات اضافی</small>
              </span>
            </label>

            <label class="check-item">
              <input v-model="verification.amount" type="checkbox" />
              <span>
                <strong>بررسی مبلغ</strong>
                <small>مقایسه مبلغ با شواهد هزینه</small>
              </span>
            </label>

            <p class="check-hint">
              تیک‌ها در این نسخه صرفاً برای آزمایش رابط کاربری هستند و تأیید واقعی
              هویت یا شماره محسوب نمی‌شوند.
            </p>
          </section>

          <section class="panel decision-panel">
            <div class="panel-heading">
              <div>
                <h2>تصمیم مدیر</h2>
                <p>نتیجه بررسی این پرونده را مشخص کن</p>
              </div>
            </div>

            <label for="decisionNote" class="note-label">
              یادداشت بررسی یا دلیل تصمیم
            </label>

            <textarea
              id="decisionNote"
              v-model="decisionNote"
              rows="5"
              placeholder="مثلاً: پیش‌فاکتور معتبر لازم است..."
            />

            <button
              type="button"
              class="decision-btn request-btn"
              @click="requestMoreInfo"
            >
              درخواست اطلاعات بیشتر
            </button>

            <button
              type="button"
              class="decision-btn approve-btn"
              :disabled="isSaving || wish.status === 'approved'"
              @click="approveWish"
              
            >
              تأیید آرزو
            </button>

            <button
              type="button"
              class="decision-btn reject-btn"
              :disabled="isSaving || wish.status === 'rejected'"
              @click="rejectWish"
            >
              رد آرزو
            </button>

            <p class="decision-warning">
  تأیید و رد از طریق API به دیتابیس ذخیره می‌شود.
  درخواست اطلاعات بیشتر و مشاهده امن مدارک هنوز در مرحله بعد تکمیل می‌شوند.
            </p>
          </section>

        </aside>

      </div>

    </div>

    <section v-else class="not-found">
      <h1>پرونده پیدا نشد</h1>
      <p>این شناسه در داده‌های نمونه وجود ندارد.</p>
      <NuxtLink to="/admin/wishes" class="back-btn">
        بازگشت به پنل مدیریت
      </NuxtLink>
    </section>

  </main>
</template>

<style scoped>
.case-page {
  min-height: 100vh;
  padding: 30px;
}

/* Header */

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: var(--color-muted);
  font-size: 11px;
}

.back-link:hover {
  color: var(--color-primary);
}

.eyebrow {
  display: block;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 800;
}

.page-header h1 {
  margin: 7px 0;
  font-size: clamp(23px, 3vw, 30px);
  font-weight: 800;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 2;
}

.page-header p span {
  margin: 0 6px;
}

.status-badge,
.private-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  padding: 8px 11px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
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

.status-badge.needs_info {
  background: #f0eeff;
  color: var(--color-primary);
}

/* Feedback */

.feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 13px 15px;
  margin-bottom: 20px;
  border-radius: 11px;
  font-size: 11px;
}

.feedback p {
  margin: 0;
  line-height: 1.9;
}

.feedback.success {
  background: #eaf8f0;
  color: #278750;
}

.feedback.error {
  background: #fff0f1;
  color: #c24f5c;
}

.feedback.info {
  background: #f0eeff;
  color: var(--color-primary);
}

.feedback button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

/* Columns */

.review-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.85fr);
  align-items: start;
  gap: 20px;
}

.main-column,
.side-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  min-width: 0;
  padding: 23px;
  border: 1px solid #eeeeee;
  border-radius: 18px;
  background: #ffffff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 23px;
}

.panel-heading h2 {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 800;
}

.panel-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.panel-icon {
  width: 37px;
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 20px;
}

.private-label {
  background: #fff4e5;
  color: #a96a18;
}

/* Wish info */

.wish-information {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-box {
  min-width: 0;
  padding: 13px;
  border-radius: 11px;
  background: #f8f8fc;
}

.info-box span,
.personal-field > span {
  display: block;
  margin-bottom: 8px;
  color: var(--color-muted);
  font-size: 10px;
}

.info-box strong {
  overflow-wrap: anywhere;
  font-size: 11px;
  line-height: 1.8;
}

.text-section {
  padding-top: 23px;
  margin-top: 20px;
  border-top: 1px solid #eeeeee;
}

.text-section h3 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
}

.text-section p {
  margin: 0;
  color: #626270;
  font-size: 11px;
  line-height: 2.3;
  overflow-wrap: anywhere;
}

/* Applicant information */

.personal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 23px 15px;
}

.personal-field {
  min-width: 0;
}

.personal-field strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 11px;
  line-height: 2;
}

.personal-field.full-width {
  grid-column: 1 / -1;
}

.ltr-value {
  direction: ltr;
  text-align: right;
  unicode-bidi: plaintext;
}

.contact-link {
  display: inline-block;
  margin-top: 5px;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 700;
}

.privacy-note {
  margin: 23px 0 0;
  padding-top: 16px;
  border-top: 1px solid #eeeeee;
  color: var(--color-muted);
  font-size: 9px;
  line-height: 2;
}

/* Documents */

.document-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 13px;
  border: 1px solid #eeeeee;
  border-radius: 12px;
}

.document-icon {
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f0eeff;
  color: var(--color-primary);
  font-size: 20px;
}

.document-info {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.document-info strong {
  font-size: 10px;
}

.document-info span {
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.8;
}

.document-status {
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 700;
}

.document-status.pending {
  background: #fff4e5;
  color: #b87922;
}

.document-status.verified {
  background: #eaf8f0;
  color: #278750;
}

.document-status.missing {
  background: #fff0f1;
  color: #c24f5c;
}

.document-btn {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #ded9ff;
  border-radius: 8px;
  background: #f0eeff;
  color: var(--color-primary);
  font-family: inherit;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
}

.document-guidance {
  margin-top: 17px;
  padding: 15px;
  border-radius: 12px;
  background: #f8f8fc;
}

.document-guidance strong {
  font-size: 10px;
}

.document-guidance p {
  margin: 7px 0 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 2;
}

/* Verification checklist */

.check-progress {
  margin-bottom: 20px;
}

.check-progress-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
  color: var(--color-muted);
  font-size: 10px;
}

.check-progress-top strong {
  color: var(--color-primary);
}

.progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8e8ef;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px 0;
  border-bottom: 1px solid #eeeeee;
  cursor: pointer;
}

.check-item input {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--color-primary);
}

.check-item > span {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item strong {
  font-size: 10px;
  line-height: 1.8;
}

.check-item small {
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.9;
}

.check-hint {
  margin: 17px 0 0;
  color: var(--color-muted);
  font-size: 9px;
  line-height: 2;
}

/* Decision panel */

.note-label {
  display: block;
  margin-bottom: 9px;
  font-size: 10px;
  font-weight: 700;
}

.decision-panel textarea {
  width: 100%;
  min-height: 115px;
  padding: 12px;
  border: 1px solid #e4e4ea;
  border-radius: 11px;
  outline: none;
  resize: vertical;
  background: #ffffff;
  color: var(--color-text);
  font-family: inherit;
  font-size: 11px;
  line-height: 2;
}

.decision-panel textarea:focus {
  border-color: var(--color-primary);
}

.decision-panel textarea::placeholder {
  color: #a0a0aa;
}

.decision-btn {
  width: 100%;
  min-height: 42px;
  margin-top: 10px;
  padding: 9px 12px;
  border: 0;
  border-radius: 10px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.decision-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.request-btn {
  margin-top: 17px;
  background: #f0eeff;
  color: var(--color-primary);
}

.request-btn:hover:not(:disabled) {
  background: #e5e1ff;
}

.approve-btn {
  background: #eaf8f0;
  color: #278750;
}

.approve-btn:hover:not(:disabled) {
  background: #d9f1e3;
}

.reject-btn {
  background: #fff0f1;
  color: #c24f5c;
}

.reject-btn:hover:not(:disabled) {
  background: #ffe1e4;
}

.decision-warning {
  margin: 15px 0 0;
  color: var(--color-muted);
  font-size: 9px;
  line-height: 2;
}

/* Not found */

.not-found {
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.not-found h1 {
  font-size: 24px;
}

.not-found p {
  color: var(--color-muted);
  font-size: 12px;
}

.back-btn {
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #ffffff;
  font-size: 11px;
}

/* Responsive */

@media (max-width: 1100px) {
  .case-page {
    padding: 25px 20px;
  }

  .review-layout {
    grid-template-columns: 1fr;
  }

  .side-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 650px) {
  .case-page {
    padding: 20px 12px 40px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel {
    padding: 18px 14px;
  }

  .side-column {
    grid-template-columns: 1fr;
  }

  .wish-information,
  .personal-grid {
    grid-template-columns: 1fr;
  }

  .personal-field.full-width {
    grid-column: auto;
  }

  .document-item {
    align-items: flex-start;
  }
}
</style>