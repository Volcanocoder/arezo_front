<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({ title: 'ویرایش آرزو | هم‌آرزو' })

interface EditableWish {
  title: string
  category: string
  description: string
  story: string
  city: string
  requested_amount: number
  urgency: string
  applicant_name: string
  applicant_mobile: string
  applicant_email: string | null
  applicant_relation: string
  review_note: string | null
  has_image: boolean
  has_identity_document: boolean
  has_evidence_document: boolean
}

const route = useRoute()
const { api } = useApi()
const wishId = String(route.params.id)

const wishCategories = await useWishCategories()
const categories = computed(() => wishCategories.value.map(c => c.name))

const loading = ref(true)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')
const reviewNote = ref('')
const existing = reactive({ image: false, identity: false, evidence: false })

const form = reactive({
  title: '',
  category: '',
  description: '',
  story: '',
  city: '',
  amount: '',
  urgency: 'عادی',
  name: '',
  mobile: '',
  email: '',
  relation: 'خودم',
})

const files = reactive<{ image: File | null, identity: File | null, evidence: File | null }>({
  image: null,
  identity: null,
  evidence: null,
})

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

onMounted(async () => {
  try {
    const res = await api<{ wish: EditableWish }>(`/api/my/wishes/${wishId}/edit`)
    const w = res.wish

    form.title = w.title
    form.category = w.category
    form.description = w.description ?? ''
    form.story = w.story ?? ''
    form.city = w.city
    form.amount = String(w.requested_amount)
    form.urgency = w.urgency
    form.name = w.applicant_name
    form.mobile = w.applicant_mobile
    form.email = w.applicant_email ?? ''
    form.relation = w.applicant_relation
    reviewNote.value = w.review_note ?? ''
    existing.image = w.has_image
    existing.identity = w.has_identity_document
    existing.evidence = w.has_evidence_document
  } catch (error) {
    loadError.value = apiErrorMessage(error, 'این آرزو برای ویرایش در دسترس نیست.')
  } finally {
    loading.value = false
  }
})

function pickFile(key: 'image' | 'identity' | 'evidence', event: Event) {
  const input = event.target as HTMLInputElement
  files[key] = input.files?.[0] ?? null
}

async function submit() {
  if (submitting.value) return

  submitError.value = ''

  const amount = Number(toLatinDigits(form.amount).replace(/[,\s٬،]/g, ''))

  if (!Number.isInteger(amount) || amount < 1) {
    submitError.value = 'مبلغ درخواستی را درست وارد کن.'
    return
  }

  const body = new FormData()
  body.append('title', form.title.trim())
  body.append('category', form.category)
  body.append('description', form.description.trim())
  body.append('story', form.story.trim())
  body.append('city', form.city.trim())
  body.append('requested_amount', String(amount))
  body.append('urgency', form.urgency)
  body.append('applicant_name', form.name.trim())
  body.append('applicant_mobile', toLatinDigits(form.mobile.trim()).replace(/[\s-]/g, ''))
  body.append('applicant_email', form.email.trim())
  body.append('applicant_relation', form.relation)

  if (files.image) body.append('wish_image', files.image)
  if (files.identity) body.append('identity_document', files.identity)
  if (files.evidence) body.append('evidence_document', files.evidence)

  submitting.value = true

  try {
    await api(`/api/my/wishes/${wishId}`, { method: 'POST', body })
    await navigateTo('/dashboard/my-wishes')
  } catch (error) {
    submitError.value = apiErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="edit-page">
    <NuxtLink to="/dashboard/my-wishes" class="back">← آرزوهای من</NuxtLink>
    <h1>ویرایش و تکمیل اطلاعات آرزو</h1>

    <p v-if="loading" class="muted">در حال دریافت اطلاعات...</p>

    <div v-else-if="loadError" class="alert error">{{ loadError }}</div>

    <form v-else class="card" @submit.prevent="submit">
      <div v-if="reviewNote" class="alert note">
        <strong>پیام بررسی:</strong> {{ reviewNote }}
      </div>

      <label>عنوان آرزو
        <input v-model="form.title" required maxlength="180">
      </label>

      <label>دسته‌بندی
        <select v-model="form.category" required>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          <option v-if="form.category && !categories.includes(form.category)" :value="form.category">{{ form.category }}</option>
        </select>
      </label>

      <label>توضیح کوتاه
        <textarea v-model="form.description" required maxlength="500" rows="3" />
      </label>

      <label>داستان کامل
        <textarea v-model="form.story" required maxlength="3000" rows="7" />
      </label>

      <div class="row">
        <label>شهر
          <input v-model="form.city" required maxlength="120">
        </label>
        <label>مبلغ درخواستی (تومان)
          <input v-model="form.amount" required inputmode="numeric">
        </label>
      </div>

      <label>اولویت
        <select v-model="form.urgency">
          <option>عادی</option>
          <option>مهم</option>
          <option>فوری</option>
        </select>
      </label>

      <h2>اطلاعات متقاضی</h2>

      <div class="row">
        <label>نام و نام خانوادگی
          <input v-model="form.name" required maxlength="150">
        </label>
        <label>موبایل
          <input v-model="form.mobile" required inputmode="tel" dir="ltr">
        </label>
      </div>

      <label>ایمیل (اختیاری)
        <input v-model="form.email" type="email" dir="ltr">
      </label>

      <label>این آرزو برای چه کسی است؟
        <select v-model="form.relation">
          <option>خودم</option>
          <option>عضو خانواده</option>
          <option>شخص دیگری با اطلاع او</option>
        </select>
      </label>

      <h2>فایل‌ها</h2>
      <p class="muted">اگر فایل جدیدی انتخاب نکنی، فایل قبلی می‌ماند.</p>

      <label>تصویر آرزو <span v-if="existing.image" class="tag">قبلاً بارگذاری شده</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="pickFile('image', $event)">
      </label>
      <label>مدرک هویتی <span v-if="existing.identity" class="tag">قبلاً بارگذاری شده</span>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" @change="pickFile('identity', $event)">
      </label>
      <label>مدرک مرتبط با آرزو <span v-if="existing.evidence" class="tag">قبلاً بارگذاری شده</span>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" @change="pickFile('evidence', $event)">
      </label>

      <div v-if="submitError" class="alert error">{{ submitError }}</div>

      <button class="submit" type="submit" :disabled="submitting">
        {{ submitting ? 'در حال ذخیره...' : 'ذخیره و ارسال دوباره برای بررسی' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.edit-page { max-width: 760px; }
.back { display: inline-block; margin-bottom: 14px; color: var(--color-primary); text-decoration: none; font-size: 13px; font-weight: 700; }
h1 { margin: 0 0 18px; font-size: 24px; }
h2 { margin: 12px 0 0; font-size: 16px; }
.card { display: flex; flex-direction: column; gap: 14px; padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 20px; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; }
input, select, textarea { width: 100%; padding: 11px 12px; border: 1px solid #e3e3ea; border-radius: 12px; font: inherit; font-size: 16px; font-weight: 400; background: #fff; }
input:focus, select:focus, textarea:focus { outline: 2px solid #ded9ff; border-color: var(--color-primary); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.muted { margin: 0; color: var(--color-muted); font-size: 13px; }
.tag { margin-right: 6px; padding: 2px 8px; border-radius: 99px; background: #eef9f1; color: #1f7a3d; font-size: 11px; font-weight: 700; }
.alert { padding: 11px 14px; border-radius: 12px; font-size: 13px; line-height: 1.9; }
.alert.error { background: #fff0f0; color: #b42318; }
.alert.note { background: #f3f1ff; color: #4a3fd1; }
.submit { min-height: 48px; border: 0; border-radius: 14px; background: var(--color-primary); color: #fff; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
.submit:disabled { opacity: 0.6; cursor: wait; }
@media (max-width: 600px) { .row { grid-template-columns: 1fr; } .card { padding: 18px 14px; } }
</style>
