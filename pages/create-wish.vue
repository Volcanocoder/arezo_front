
<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

definePageMeta({
  layout: 'default'
})

const siteUrl = useRuntimeConfig().public.siteUrl
useSeoMeta({
  title: 'ثبت آرزو | آرزو',
  description: 'آرزوی خودت را ثبت کن تا پس از بررسی تیم آرزو، دیده شود.',
  ogTitle: 'ثبت آرزو',
  ogDescription: 'آرزوی خودت را ثبت کن تا پس از بررسی تیم آرزو، دیده شود.',
})
useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/create-wish` }] })

type DocumentKey = 'identity' | 'evidence'

interface WishForm {
  title: string
  category: string
  city: string
  amount: string
  description: string
  story: string
  urgency: string
  fullName: string
  mobile: string
  email: string
  relation: string
}

const currentStep = ref(1)
const submitted = ref(false)
const stepError = ref('')
const uploadError = ref('')
const submitting = ref(false)
const submitError = ref('')
const createdWishId = ref<number | null>(null)

const form = reactive<WishForm>({
  title: '',
  category: '',
  city: '',
  amount: '',
  description: '',
  story: '',
  urgency: 'عادی',
  fullName: '',
  mobile: '',
  email: '',
  relation: 'خودم'
})

const wishImage = ref<File | null>(null)
const identityDocument = ref<File | null>(null)
const evidenceDocument = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const wishCategories = await useWishCategories()
const categories = computed(() => wishCategories.value.map(c => c.name))

const cities = [
  'تهران',
  'اصفهان',
  'شیراز',
  'مشهد',
  'تبریز',
  'کرج',
  'رشت',
  'اهواز',
  'قم',
  'سایر'
]

const steps = [
  { number: 1, title: 'اطلاعات آرزو' },
  { number: 2, title: 'توضیحات' },
  { number: 3, title: 'جزئیات' },
  { number: 4, title: 'مدارک و هویت' },
  { number: 5, title: 'بررسی نهایی' }
]

const normalizeDigits = (value: string) => {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    )
}

const formatPrice = (value: string | number) => {
  const number = Number(
    normalizeDigits(String(value)).replace(/[^\d]/g, '')
  )

  if (!number) return ''

  return new Intl.NumberFormat('fa-IR').format(number)
}

const documentHelp = computed(() => {
  switch (form.category) {
    case 'درمانی':
      return 'در صورت لزوم، مدرک مرتبط با هزینه درمان یا فاکتور قابل بررسی.'
    case 'تحصیلی':
    case 'آموزشی':
      return 'در صورت لزوم، مدرک آموزشی، اطلاعات دوره یا پیش‌فاکتور وسیله موردنیاز.'
    case 'وسایل ضروری':
      return 'در صورت وجود، پیش‌فاکتور معتبر یا مشخصات وسیله موردنیاز.'
    default:
      return 'هر مدرک مرتبطی که توضیح آرزو را قابل بررسی‌تر می‌کند، در صورت وجود.'
  }
})

const parsedAmount = computed(() => {
  return Number(
    normalizeDigits(form.amount).replace(/[^\d]/g, '')
  )
})

const isValidMobile = computed(() => {
  return /^09\d{9}$/.test(normalizeDigits(form.mobile.trim()))
})

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      return Boolean(
        form.title.trim() &&
        form.category
      )

    case 2:
      return Boolean(
        form.description.trim() &&
        form.story.trim()
      )

    case 3:
      return Boolean(
        form.city &&
        parsedAmount.value > 0
      )

    case 4:
      return Boolean(
        form.fullName.trim() &&
        isValidMobile.value &&
        (
          !form.email.trim() ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        )
      )

    default:
      return true
  }
})

const handleAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  form.amount = normalizeDigits(target.value).replace(/[^\d]/g, '')
}

const disposeImagePreview = () => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = null
  }
}

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  uploadError.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'برای تصویر آرزو، یک فایل تصویری انتخاب کن.'
    input.value = ''
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    uploadError.value = 'حجم تصویر باید حداکثر ۳ مگابایت باشد.'
    input.value = ''
    return
  }

  disposeImagePreview()
  wishImage.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const removeImage = () => {
  disposeImagePreview()
  wishImage.value = null
}

const handleDocumentUpload = (
  event: Event,
  type: DocumentKey
) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  uploadError.value = ''

  if (!file) return

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]

  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'فرمت مجاز فایل PDF، JPG، PNG یا WebP است.'
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'حجم هر مدرک باید حداکثر ۵ مگابایت باشد.'
    input.value = ''
    return
  }

  if (type === 'identity') {
    identityDocument.value = file
  } else {
    evidenceDocument.value = file
  }
}

const removeDocument = (type: DocumentKey) => {
  if (type === 'identity') {
    identityDocument.value = null
  } else {
    evidenceDocument.value = null
  }

  uploadError.value = ''
}

const nextStep = () => {
  stepError.value = ''

  if (!isStepValid.value) {
    if (currentStep.value === 4 && !isValidMobile.value) {
      stepError.value = 'شماره موبایل معتبر وارد کن؛ شماره باید با 09 شروع شود و ۱۱ رقم باشد.'
    } else {
      stepError.value = 'لطفاً فیلدهای الزامی این مرحله را کامل کن.'
    }
    return
  }

  if (currentStep.value < 5) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const previousStep = () => {
  stepError.value = ''

  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}


function getSubmissionError(error: unknown): string {
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
      || 'ثبت آرزو انجام نشد. دوباره تلاش کن.'
  }

  return 'ارتباط با سرور برقرار نشد.'
}

function getXsrfToken(): string {
  const match = document.cookie.match(
    /(?:^|;\s*)XSRF-TOKEN=([^;]+)/,
  )

  return match ? decodeURIComponent(match[1]) : ''
}

async function submitWish() {
  if (submitting.value) return

  stepError.value = ''
  submitError.value = ''

  if (!form.title.trim() || !form.category) {
    currentStep.value = 1
    stepError.value = 'عنوان و دسته‌بندی آرزو را بررسی کن.'
    return
  }

  if (!form.description.trim() || !form.story.trim()) {
    currentStep.value = 2
    stepError.value = 'توضیح کوتاه و داستان آرزو الزامی است.'
    return
  }

  if (!form.city || parsedAmount.value <= 0) {
    currentStep.value = 3
    stepError.value = 'شهر و مبلغ آرزو را بررسی کن.'
    return
  }

  if (!form.fullName.trim() || !isValidMobile.value) {
    currentStep.value = 4
    stepError.value = 'نام متقاضی و شماره موبایل معتبر الزامی است.'
    return
  }

  submitting.value = true

  try {
    const apiBase = useApiBase()

    // دریافت کوکی CSRF از Laravel
    await $fetch(`${apiBase}/sanctum/csrf-cookie`, {
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

    // ارسال متن‌ها و فایل‌ها به صورت multipart/form-data
    const payload = new FormData()

    payload.append('title', form.title.trim())
    payload.append('category', form.category)
    payload.append('description', form.description.trim())
    payload.append('story', form.story.trim())
    payload.append('city', form.city)
    payload.append('requested_amount', String(parsedAmount.value))
    payload.append('urgency', form.urgency)

    payload.append('applicant_name', form.fullName.trim())
    payload.append(
      'applicant_mobile',
      normalizeDigits(form.mobile.trim()).replace(/[\s-]/g, ''),
    )
    payload.append('applicant_email', form.email.trim())
    payload.append('applicant_relation', form.relation)

    if (wishImage.value) {
      payload.append('wish_image', wishImage.value)
    }

    if (identityDocument.value) {
      payload.append('identity_document', identityDocument.value)
    }

    if (evidenceDocument.value) {
      payload.append('evidence_document', evidenceDocument.value)
    }

    const result = await $fetch<{
      message: string
      wish: {
        id: number
        title: string
        status: string
        created_at: string
      }
    }>(`${apiBase}/api/wishes`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: payload,
    })

    createdWishId.value = result.wish.id
    submitted.value = true

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    submitError.value = getSubmissionError(error)
  } finally {
    submitting.value = false
  }
}

const restart = () => {
  disposeImagePreview()

  form.title = ''
  form.category = ''
  form.city = ''
  form.amount = ''
  form.description = ''
  form.story = ''
  form.urgency = 'عادی'
  form.fullName = ''
  form.mobile = ''
  form.email = ''
  form.relation = 'خودم'
  submitError.value = ''
  createdWishId.value = null

  wishImage.value = null
  identityDocument.value = null
  evidenceDocument.value = null

  uploadError.value = ''
  stepError.value = ''
  currentStep.value = 1
  submitted.value = false
}

onBeforeUnmount(() => {
  disposeImagePreview()
})
</script>

<template>
  <main class="create-page">

    <!-- Demo success -->
    <section v-if="submitted" class="success-section">
      <div class="success-card">
        <div class="success-icon">✓</div>

        <span class="success-badge">ثبت موفق درخواست</span>

        <h1>اطلاعات آرزویت آماده بررسی است ❤️</h1>

        <p>
    آرزویت با موفقیت در سامانه ثبت شد و برای بررسی مدیر در صف انتظار قرار گرفت.
    اطلاعات تماس و مدارک تو خصوصی باقی می‌مانند.
      </p>

        <p v-if="createdWishId" class="tracking-number">
          شماره پیگیری: {{ createdWishId }}
        </p>

        <div class="success-actions">
          <NuxtLink to="/wishes" class="primary-btn">
            مشاهده آرزوها
          </NuxtLink>

          <button type="button" class="secondary-btn" @click="restart">
            ثبت آرزوی دیگر
          </button>
        </div>
      </div>
    </section>

    <template v-else>

      <!-- Header -->
      <section class="form-header">
        <div class="container">
          <NuxtLink to="/" class="back-link">← بازگشت به خانه</NuxtLink>

          <span class="badge">هر آرزو، یک امید</span>

          <h1>ثبت آرزو</h1>

          <p>
            آرزویت را به ما بگو تا پس از بررسی، امکان کمک کردن به آن فراهم شود.
          </p>
        </div>
      </section>

      <section class="form-section">
        <div class="container">

          <!-- Stepper -->
          <div class="stepper">
            <div
              v-for="step in steps"
              :key="step.number"
              class="step-item"
              :class="{
                active: currentStep === step.number,
                completed: currentStep > step.number
              }"
            >
              <div class="step-circle">
                <span v-if="currentStep > step.number">✓</span>
                <span v-else>{{ step.number }}</span>
              </div>

              <span class="step-title">{{ step.title }}</span>
            </div>
          </div>

          <form class="form-card" @submit.prevent="submitWish">

            <!-- Step 1 -->
            <div v-if="currentStep === 1" class="step-content">
              <div class="section-title">
                <span>مرحله اول از پنج</span>
                <h2>آرزویت چیست؟</h2>
                <p>یک عنوان ساده انتخاب کن و بگو آرزویت در چه زمینه‌ای است.</p>
              </div>

              <div class="field">
                <label for="title">عنوان آرزو *</label>
                <input
                  id="title"
                  v-model="form.title"
                  maxlength="100"
                  required
                  placeholder="مثلاً یک لپ‌تاپ برای ادامه تحصیل"
                />
                <small>{{ form.title.length }} از ۱۰۰ کاراکتر</small>
              </div>

              <div class="field">
                <label>دسته‌بندی *</label>

                <div class="category-grid">
                  <button
                    v-for="category in categories"
                    :key="category"
                    type="button"
                    class="category-option"
                    :class="{ selected: form.category === category }"
                    @click="form.category = category"
                  >
                    {{ category }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div v-else-if="currentStep === 2" class="step-content">
              <div class="section-title">
                <span>مرحله دوم از پنج</span>
                <h2>داستان آرزویت را تعریف کن</h2>
                <p>
                  توضیح روشن و واقعی به مدیر کمک می‌کند درخواست را بهتر بررسی کند.
                </p>
              </div>

              <div class="field">
                <label for="description">توضیح کوتاه *</label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="3"
                  maxlength="500"
                  required
                  placeholder="دقیقاً به چه چیزی نیاز داری؟"
                />
              </div>

              <div class="field">
                <label for="story">داستان آرزو *</label>
                <textarea
                  id="story"
                  v-model="form.story"
                  rows="7"
                  maxlength="3000"
                  required
                  placeholder="شرایط و دلیل این آرزو را با جزئیات توضیح بده..."
                />
                <small>{{ form.story.length }} از ۳۰۰۰ کاراکتر</small>
              </div>

              <div class="upload-box">
                <div v-if="!imagePreview" class="upload-content">
                  <div class="upload-icon">▧</div>
                  <strong>تصویر مرتبط با آرزو (اختیاری)</strong>
                  <span>تصویر JPG، PNG یا WebP تا حجم ۳ مگابایت</span>

                  <label class="upload-btn">
                    انتخاب تصویر
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      @change="handleImageUpload"
                    />
                  </label>
                </div>

                <div v-else class="preview-container">
                  <img :src="imagePreview" alt="پیش‌نمایش تصویر آرزو" />

                  <button
                    type="button"
                    class="remove-file"
                    @click="removeImage"
                  >
                    حذف تصویر
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div v-else-if="currentStep === 3" class="step-content">
              <div class="section-title">
                <span>مرحله سوم از پنج</span>
                <h2>جزئیات آرزو</h2>
                <p>مبلغ و شرایط درخواست را مشخص کن.</p>
              </div>

              <div class="two-columns">
                <div class="field">
                  <label for="city">شهر *</label>
                  <select id="city" v-model="form.city" required>
                    <option value="">انتخاب شهر</option>
                    <option v-for="city in cities" :key="city" :value="city">
                      {{ city }}
                    </option>
                  </select>
                </div>

                <div class="field">
                  <label for="amount">مبلغ تقریبی (تومان) *</label>
                  <input
                    id="amount"
                    :value="formatPrice(form.amount)"
                    inputmode="numeric"
                    required
                    placeholder="مثلاً ۱۵٬۰۰۰٬۰۰۰"
                    @input="handleAmountInput"
                  />
                  <small>مبلغ باید بیشتر از صفر باشد.</small>
                </div>
              </div>

              <div class="field">
                <label>میزان فوریت</label>

                <div class="urgency-options">
                  <button
                    v-for="option in [
                      { title: 'عادی', description: 'زمان مشخصی ندارم' },
                      { title: 'مهم', description: 'بهتر است زودتر انجام شود' },
                      { title: 'فوری', description: 'نیاز به رسیدگی سریع دارم' }
                    ]"
                    :key="option.title"
                    type="button"
                    class="urgency-option"
                    :class="{ selected: form.urgency === option.title }"
                    @click="form.urgency = option.title"
                  >
                    <strong>{{ option.title }}</strong>
                    <span>{{ option.description }}</span>
                  </button>
                </div>
              </div>

              <div class="info-box">
                <span>i</span>
                <p>
                  مبلغ نهایی ممکن است بعد از بررسی مستندات توسط مدیر اصلاح شود.
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div v-else-if="currentStep === 4" class="step-content">
              <div class="section-title">
                <span>مرحله چهارم از پنج</span>
                <h2>اطلاعات متقاضی و مدارک</h2>
                <p>
                  این اطلاعات برای بررسی درخواست استفاده می‌شود و نباید در صفحه عمومی آرزو نمایش داده شود.
                </p>
              </div>

              <div class="private-notice">
                <span>🔒</span>
                <p>
                  شماره موبایل برای تماس و پیگیری درخواست لازم است.
                  مدارک هویتی را فقط در صورت ضرورت و پس از اطلاع از شیوه استفاده از آن‌ها ارسال کن.
                </p>
              </div>

              <div class="two-columns">
                <div class="field">
                  <label for="fullName">نام و نام خانوادگی *</label>
                  <input
                    id="fullName"
                    v-model="form.fullName"
                    autocomplete="name"
                    required
                    maxlength="150"
                    placeholder="نام کامل متقاضی"
                  />
                </div>

                <div class="field">
                  <label for="mobile">شماره موبایل *</label>
                  <input
                    id="mobile"
                    v-model="form.mobile"
                    type="tel"
                    inputmode="numeric"
                    autocomplete="tel"
                    required
                    placeholder="09123456789"
                  />
                  <small>شماره باید ۱۱ رقم و با 09 شروع شود.</small>
                </div>

                <div class="field">
                  <label for="email">ایمیل (اختیاری)</label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    placeholder="example@email.com"
                  />
                </div>

                <div class="field">
                  <label for="relation">این آرزو برای چه کسی است؟</label>
                  <select id="relation" v-model="form.relation">
                    <option>خودم</option>
                    <option>عضو خانواده</option>
                    <option>شخص دیگری با اطلاع او</option>
                  </select>
                </div>
              </div>

              <div class="document-upload">
                <div class="document-heading">
                  <div>
                    <h3>مدرک هویتی (اختیاری)</h3>
                    <p>
                      در صورت نیاز به احراز هویت، می‌توانی مدرک مرتبط را انتخاب کنی.
                    </p>
                  </div>
                  <span>PDF / تصویر</span>
                </div>

                <label class="file-picker">
                  <span>＋</span>
                  <span>
                    {{ identityDocument?.name || 'انتخاب مدرک هویتی' }}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    hidden
                    @change="handleDocumentUpload($event, 'identity')"
                  />
                </label>

                <button
                  v-if="identityDocument"
                  type="button"
                  class="remove-document"
                  @click="removeDocument('identity')"
                >
                  حذف فایل انتخاب‌شده
                </button>
              </div>

              <div class="document-upload">
                <div class="document-heading">
                  <div>
                    <h3>مدرک مرتبط با آرزو (اختیاری)</h3>
                    <p>{{ documentHelp }}</p>
                  </div>
                  <span>PDF / تصویر</span>
                </div>

                <label class="file-picker">
                  <span>＋</span>
                  <span>
                    {{ evidenceDocument?.name || 'انتخاب مدرک پشتیبان' }}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    hidden
                    @change="handleDocumentUpload($event, 'evidence')"
                  />
                </label>

                <button
                  v-if="evidenceDocument"
                  type="button"
                  class="remove-document"
                  @click="removeDocument('evidence')"
                >
                  حذف فایل انتخاب‌شده
                </button>
              </div>

              <p v-if="uploadError" class="error-message" role="alert">
                {{ uploadError }}
              </p>

              <div class="info-box">
                <span>i</span>
                <p>
                  انتخاب فایل در این نسخه فقط در مرورگر انجام می‌شود.
                  مدارک هنوز به سرور ارسال نشده‌اند و تیک‌زدن فرم نیز هویت را تأیید نمی‌کند.
                </p>
              </div>
            </div>

            <!-- Step 5 -->
            <div v-else class="step-content">
              <div class="section-title">
                <span>مرحله پنجم از پنج</span>
                <h2>بررسی نهایی</h2>
                <p>قبل از ثبت آزمایشی، اطلاعات را مرور کن.</p>
              </div>

              <div class="review-section">
                <div class="review-heading">
                  <h3>اطلاعات آرزو</h3>
                  <button type="button" @click="currentStep = 1">
                    ویرایش
                  </button>
                </div>

                <div class="review-row">
                  <span>عنوان</span>
                  <strong>{{ form.title }}</strong>
                </div>

                <div class="review-row">
                  <span>دسته‌بندی</span>
                  <strong>{{ form.category }}</strong>
                </div>

                <div class="review-row">
                  <span>شهر</span>
                  <strong>{{ form.city }}</strong>
                </div>

                <div class="review-row">
                  <span>مبلغ</span>
                  <strong>{{ formatPrice(form.amount) }} تومان</strong>
                </div>

                <div class="review-row">
                  <span>فوریت</span>
                  <strong>{{ form.urgency }}</strong>
                </div>

                <div class="review-text">
                  <span>توضیح کوتاه</span>
                  <p>{{ form.description }}</p>
                </div>

                <div class="review-text">
                  <span>داستان آرزو</span>
                  <p>{{ form.story }}</p>
                </div>

                <div v-if="wishImage" class="review-row">
                  <span>تصویر آرزو</span>
                  <strong>{{ wishImage.name }}</strong>
                </div>
              </div>

              <div class="review-section">
                <div class="review-heading">
                  <h3>اطلاعات متقاضی</h3>
                  <button type="button" @click="currentStep = 4">
                    ویرایش
                  </button>
                </div>

                <div class="review-row">
                  <span>نام متقاضی</span>
                  <strong>{{ form.fullName }}</strong>
                </div>

                <div class="review-row">
                  <span>شماره موبایل</span>
                  <strong class="ltr-value">{{ form.mobile }}</strong>
                </div>

                <div class="review-row">
                  <span>ایمیل</span>
                  <strong>{{ form.email || 'ثبت نشده' }}</strong>
                </div>

                <div class="review-row">
                  <span>آرزو برای</span>
                  <strong>{{ form.relation }}</strong>
                </div>

                <div class="review-row">
                  <span>مدرک هویتی</span>
                  <strong>{{ identityDocument?.name || 'انتخاب نشده' }}</strong>
                </div>

                <div class="review-row">
                  <span>مدرک پشتیبان</span>
                  <strong>{{ evidenceDocument?.name || 'انتخاب نشده' }}</strong>
                </div>
              </div>

              <div class="private-notice">
                <span>🔒</span>
                <p>
                  اطلاعات تماس و مدارک برای بررسی داخلی هستند. قبل از انتشار عمومی،
                  باید فقط اطلاعات غیرحساس آرزو نمایش داده شوند.
                </p>
              </div>
            </div>
            <div
  v-if="submitError"
  class="step-error"
  role="alert"
>
  {{ submitError }}
            </div>
            <!-- Validation -->
            <div v-if="stepError" class="step-error" role="alert">
              {{ stepError }}
            </div>

            <!-- Navigation -->
            <div class="form-actions">
              <button
                v-if="currentStep > 1"
                type="button"
                class="previous-btn"
                @click="previousStep"
              >
                مرحله قبل
              </button>

              <div class="actions-spacer"></div>

              <button
                v-if="currentStep < 5"
                type="button"
                class="next-btn"
                @click="nextStep"
              >
                مرحله بعد
              </button>

              <button
                v-else
  type="submit"
  class="next-btn"
  :disabled="submitting"
>
  {{ submitting ? 'در حال ارسال...' : 'ثبت نهایی آرزو' }}
</button>
            </div>

          </form>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.create-page {
  min-height: 100vh;
  background: #f8f8fc;
}

.container {
  width: min(900px, calc(100% - 40px));
  margin: 0 auto;
}

.form-header {
  padding: 45px 20px 55px;
  background: #fff;
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 25px;
  color: var(--color-muted);
  font-size: 12px;
}

.back-link:hover {
  color: var(--color-primary);
}

.badge,
.success-badge {
  display: inline-flex;
  padding: 8px 15px;
  border-radius: 999px;
  background: #eceaff;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
}

.form-header h1 {
  margin: 17px 0 9px;
  font-size: clamp(36px, 5vw, 50px);
  font-weight: 800;
}

.form-header p {
  max-width: 650px;
  margin: 0 auto;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 2;
}

.form-section {
  padding: 45px 20px 100px;
}

/* Stepper */

.stepper {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 28px;
}

.step-item {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  color: #9999a5;
  font-size: 10px;
  text-align: center;
}

.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 19px;
  right: calc(-50% + 20px);
  width: calc(100% - 40px);
  height: 2px;
  background: #e6e6ed;
  z-index: 0;
}

.step-circle {
  position: relative;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eeeeF4;
  font-size: 12px;
  font-weight: 800;
}

.step-item.active,
.step-item.completed {
  color: var(--color-primary);
}

.step-item.active .step-circle,
.step-item.completed .step-circle {
  background: var(--color-primary);
  color: #fff;
}

.step-item.completed:not(:last-child)::after {
  background: var(--color-primary);
}

.step-title {
  white-space: nowrap;
}

/* Form card */

.form-card {
  overflow: hidden;
  border: 1px solid #eeeeee;
  border-radius: 25px;
  background: #fff;
}

.step-content {
  padding: 40px;
}

.section-title {
  margin-bottom: 32px;
}

.section-title > span {
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 800;
}

.section-title h2 {
  margin: 8px 0;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.6;
}

.section-title p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 2;
}

/* Fields */

.field {
  min-width: 0;
  margin-bottom: 25px;
}

.field:last-child {
  margin-bottom: 0;
}

.field label {
  display: block;
  margin-bottom: 9px;
  font-size: 12px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #e3e3ea;
  border-radius: 12px;
  outline: none;
  background: #fff;
  color: var(--color-text);
  font-family: inherit;
  font-size: 12px;
  transition: border-color .2s, box-shadow .2s;
}

.field input,
.field select {
  height: 49px;
  padding: 0 13px;
}

.field textarea {
  padding: 13px;
  resize: vertical;
  line-height: 2;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(109, 93, 252, .08);
}

.field input::placeholder,
.field textarea::placeholder {
  color: #a3a3ad;
}

.field small {
  display: block;
  margin-top: 7px;
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.8;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.category-option {
  min-height: 46px;
  padding: 8px;
  border: 1px solid #e5e5eb;
  border-radius: 11px;
  background: #fff;
  color: var(--color-text);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.category-option.selected {
  border-color: var(--color-primary);
  background: #f0eeff;
  color: var(--color-primary);
  font-weight: 700;
}

/* Columns */

.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 17px;
}

/* Image upload */

.upload-box {
  overflow: hidden;
  margin-top: 30px;
  border: 1px dashed #d5d5df;
  border-radius: 16px;
  background: #fafafd;
}

.upload-content {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  text-align: center;
}

.upload-icon {
  color: var(--color-primary);
  font-size: 40px;
}

.upload-content strong {
  font-size: 13px;
}

.upload-content > span {
  color: var(--color-muted);
  font-size: 10px;
}

.upload-btn,
.remove-file {
  padding: 10px 14px;
  border: 0;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.preview-container {
  position: relative;
  min-height: 260px;
}

.preview-container img {
  display: block;
  width: 100%;
  height: 300px;
  object-fit: contain;
  background: #fff;
}

.remove-file {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: #fff;
  color: #c24f5c;
  border: 1px solid #f2d9dc;
}

/* Urgency */

.urgency-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.urgency-option {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  padding: 13px;
  border: 1px solid #e5e5eb;
  border-radius: 12px;
  background: #fff;
  color: var(--color-text);
  font-family: inherit;
  text-align: right;
  cursor: pointer;
}

.tracking-number {
  margin-top: 14px !important;
  color: var(--color-primary) !important;
  font-weight: 800;
}

.urgency-option strong {
  font-size: 12px;
}

.urgency-option span {
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.8;
}

.urgency-option.selected {
  border-color: var(--color-primary);
  background: #f0eeff;
}

.urgency-option.selected strong {
  color: var(--color-primary);
}

/* Notices */

.info-box,
.private-notice {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 22px;
  padding: 14px;
  border-radius: 12px;
  background: #f8f8fc;
}

.info-box > span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #eceaff;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
}

.info-box p,
.private-notice p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 2;
}

.private-notice {
  margin: 0 0 25px;
  border: 1px solid #e7e3ff;
  background: #f8f7ff;
}

.private-notice > span {
  flex-shrink: 0;
  font-size: 17px;
}

/* Supporting documents */

.document-upload {
  margin-top: 22px;
  padding: 17px;
  border: 1px solid #eeeeee;
  border-radius: 14px;
}

.document-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.document-heading h3 {
  margin: 0 0 7px;
  font-size: 12px;
}

.document-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.document-heading > span {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 9px;
}

.file-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 45px;
  padding: 9px 12px;
  border: 1px dashed #d7d7e0;
  border-radius: 10px;
  color: var(--color-primary);
  background: #fcfcff;
  font-size: 10px;
  cursor: pointer;
}

.file-picker > span:first-child {
  font-size: 18px;
}

.file-picker > span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.remove-document {
  margin-top: 9px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #c24f5c;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.error-message,
.step-error {
  color: #c24f5c;
  font-size: 10px;
  line-height: 1.9;
}

.step-error {
  margin: 0 35px 15px;
  padding: 12px;
  border-radius: 10px;
  background: #fff0f1;
}

/* Review */

.review-section {
  margin-bottom: 20px;
  padding: 18px;
  border: 1px solid #eeeeee;
  border-radius: 14px;
}

.review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.review-heading h3 {
  margin: 0;
  font-size: 13px;
}

.review-heading button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.review-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #eeeeee;
}

.review-row:last-child {
  border-bottom: 0;
}

.review-row > span,
.review-text > span {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 10px;
}

.review-row strong {
  max-width: 70%;
  overflow-wrap: anywhere;
  font-size: 10px;
  text-align: left;
  line-height: 1.9;
}

.ltr-value {
  direction: ltr;
  unicode-bidi: plaintext;
}

.review-text {
  padding-top: 14px;
}

.review-text p {
  margin: 8px 0 0;
  color: #626270;
  font-size: 10px;
  line-height: 2.1;
  overflow-wrap: anywhere;
}

/* Form buttons */

.form-actions {
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 30px;
  border-top: 1px solid #eeeeee;
  background: #fcfcfd;
}

.actions-spacer {
  flex: 1;
}

.previous-btn,
.next-btn,
.primary-btn,
.secondary-btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 19px;
  border-radius: 11px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.previous-btn,
.secondary-btn {
  border: 1px solid #e5e5eb;
  background: #fff;
  color: var(--color-text);
}

.next-btn,
.primary-btn {
  border: 0;
  background: var(--color-primary);
  color: #fff;
}

.next-btn:hover,
.primary-btn:hover {
  background: var(--color-primary-dark);
}

/* Success */

.success-section {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 70px 20px;
}

.success-card {
  width: min(620px, 100%);
  padding: 45px 30px;
  border: 1px solid #eeeeee;
  border-radius: 25px;
  background: #fff;
  text-align: center;
}

.success-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #eaf8f0;
  color: #29915d;
  font-size: 30px;
  font-weight: 800;
}

.success-badge {
  background: #eaf8f0;
  color: #29915d;
}

.success-card h1 {
  margin: 17px 0 12px;
  font-size: 26px;
  line-height: 1.7;
}

.success-card p {
  margin: 0;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 2.2;
}

.success-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 25px;
}

/* Responsive */

@media (max-width: 700px) {
  .form-header {
    padding: 35px 15px 40px;
  }

  .form-section {
    padding: 35px 12px 60px;
  }

  .stepper {
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .step-item {
    min-width: 85px;
    font-size: 9px;
  }

  .step-content {
    padding: 27px 19px;
  }

  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .two-columns,
  .urgency-options {
    grid-template-columns: 1fr;
  }

  .form-actions {
    padding: 14px 18px;
  }

  .previous-btn,
  .next-btn {
    padding: 0 13px;
  }

  .success-actions {
    flex-direction: column;
  }

  .success-actions > * {
    width: 100%;
  }
}
</style>