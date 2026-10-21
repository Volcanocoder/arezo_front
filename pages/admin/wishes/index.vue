<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'بررسی آرزوها | پنل مدیریت' })

type WishStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'

interface WishRow {
  id: number
  title: string
  category: string | null
  status: WishStatus
  urgency: string | null
  requested_amount: number | null
  applicant_name: string | null
  city: string | null
  created_at: string
}

interface Counts { all: number, pending: number, approved: number, rejected: number, needs_info: number }

const { api } = useApi()
const route = useRoute()

const rows = ref<WishRow[]>([])
const counts = ref<Counts>({ all: 0, pending: 0, approved: 0, rejected: 0, needs_info: 0 })
const status = ref<'' | WishStatus>((route.query.status as WishStatus) || 'pending')
const q = ref('')
const category = ref('')
const urgency = ref('')
const sort = ref('newest')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busyId = ref<number | null>(null)

const categories = ref<string[]>([])

const noteFor = ref<{ id: number, status: 'rejected' | 'needs_info' } | null>(null)
const note = ref('')

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n)
const date = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v))

const statusMeta: Record<WishStatus, { label: string, cls: string }> = {
  pending: { label: 'در انتظار بررسی', cls: 'amber' },
  approved: { label: 'تأییدشده', cls: 'green' },
  rejected: { label: 'ردشده', cls: 'red' },
  needs_info: { label: 'نیازمند اطلاعات', cls: 'blue' },
}
const urgencyLabels: Record<string, string> = { normal: 'عادی', important: 'مهم', urgent: 'فوری' }

const tabs = computed(() => [
  { key: '' as const, label: 'همه', n: counts.value.all },
  { key: 'pending' as const, label: 'در انتظار', n: counts.value.pending },
  { key: 'needs_info' as const, label: 'نیازمند اطلاعات', n: counts.value.needs_info },
  { key: 'approved' as const, label: 'تأییدشده', n: counts.value.approved },
  { key: 'rejected' as const, label: 'ردشده', n: counts.value.rejected },
])

async function load() {
  loading.value = true
  error.value = ''

  const query: Record<string, string | number> = { page: page.value, sort: sort.value }
  if (status.value) query.status = status.value
  if (q.value.trim()) query.q = q.value.trim()
  if (category.value) query.category = category.value
  if (urgency.value) query.urgency = urgency.value

  try {
    const res = await api<{ data: WishRow[], last_page: number, total: number, counts: Counts }>('/api/admin/wishes', { query })
    rows.value = res.data
    counts.value = res.counts
    lastPage.value = res.last_page
    total.value = res.total
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت آرزوها انجام نشد.')
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
function refilter(delay = 0) {
  page.value = 1
  clearTimeout(timer)
  timer = setTimeout(load, delay)
}

function setTab(key: '' | WishStatus) {
  status.value = key
  refilter()
}

async function setStatus(w: WishRow, next: WishStatus, reviewNote?: string) {
  busyId.value = w.id
  error.value = ''

  try {
    await api(`/api/admin/wishes/${w.id}/status`, {
      method: 'PATCH',
      body: { status: next, review_note: reviewNote },
    })
    notice.value = `وضعیت «${w.title}» به «${statusMeta[next].label}» تغییر کرد و به صاحب آرزو اعلان رفت.`
    noteFor.value = null
    note.value = ''
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

function askNote(w: WishRow, next: 'rejected' | 'needs_info') {
  noteFor.value = { id: w.id, status: next }
  note.value = ''
}

onMounted(async () => {
  load()

  try {
    const res = await api<{ data: { name: string }[] }>('/api/categories', { query: { type: 'wish' } })
    categories.value = res.data.map(c => c.name)
  } catch {
    // فیلتر دسته‌بندی بدون فهرست هم کار می‌کند.
  }
})
</script>

<template>
  <section class="wishes-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">بررسی آرزوها</span>
        <h1>صف بررسی آرزوها</h1>
        <p>آرزوهای ثبت‌شده را بررسی، تأیید یا رد کن؛ نتیجه فوراً به صاحب آرزو اعلان می‌شود.</p>
      </div>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        :aria-selected="status === t.key"
        :class="{ active: status === t.key }"
        @click="setTab(t.key)"
      >
        {{ t.label }} <span class="n">{{ fa(t.n) }}</span>
      </button>
    </div>

    <div class="filters">
      <input v-model="q" type="search" placeholder="جست‌وجو در عنوان، نام، موبایل یا شهر..." @input="refilter(350)">
      <select v-model="category" aria-label="دسته‌بندی" @change="refilter()">
        <option value="">همه دسته‌ها</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="urgency" aria-label="فوریت" @change="refilter()">
        <option value="">همه فوریت‌ها</option>
        <option value="urgent">فوری</option>
        <option value="important">مهم</option>
        <option value="normal">عادی</option>
      </select>
      <select v-model="sort" aria-label="مرتب‌سازی" @change="refilter()">
        <option value="newest">جدیدترین</option>
        <option value="oldest">قدیمی‌ترین</option>
        <option value="urgent">فوری‌ترین</option>
        <option value="amount_desc">بیشترین مبلغ</option>
        <option value="amount_asc">کمترین مبلغ</option>
      </select>
    </div>

    <p v-if="notice" class="msg ok" role="status">{{ notice }}</p>
    <p v-if="error" class="msg bad" role="alert">{{ error }}</p>

    <p v-if="loading" class="state">در حال دریافت...</p>
    <p v-else-if="!rows.length" class="state">آرزویی با این فیلتر پیدا نشد.</p>

    <ul v-else class="list">
      <li v-for="w in rows" :key="w.id" class="row">
        <div class="main">
          <NuxtLink :to="`/admin/wishes/${w.id}`" class="title">{{ w.title }}</NuxtLink>
          <div class="meta">
            <span>{{ w.applicant_name || 'بدون نام' }}</span>
            <span v-if="w.city">{{ w.city }}</span>
            <span v-if="w.category">{{ w.category }}</span>
            <span v-if="w.requested_amount">{{ fa(w.requested_amount) }} تومان</span>
            <span>{{ date(w.created_at) }}</span>
            <span v-if="w.urgency && w.urgency !== 'normal'" class="tag" :class="w.urgency">{{ urgencyLabels[w.urgency] }}</span>
          </div>
        </div>

        <span class="status" :class="statusMeta[w.status].cls">{{ statusMeta[w.status].label }}</span>

        <div class="actions">
          <button v-if="w.status !== 'approved'" type="button" class="ok" :disabled="busyId === w.id" @click="setStatus(w, 'approved')">تأیید</button>
          <button v-if="w.status !== 'needs_info'" type="button" class="info" :disabled="busyId === w.id" @click="askNote(w, 'needs_info')">درخواست اطلاعات</button>
          <button v-if="w.status !== 'rejected'" type="button" class="no" :disabled="busyId === w.id" @click="askNote(w, 'rejected')">رد</button>
          <NuxtLink :to="`/admin/wishes/${w.id}`" class="view">جزئیات</NuxtLink>
        </div>

        <form v-if="noteFor?.id === w.id" class="note" @submit.prevent="setStatus(w, noteFor!.status, note)">
          <label>
            {{ noteFor.status === 'rejected' ? 'دلیل رد (برای صاحب آرزو نمایش داده می‌شود)' : 'چه اطلاعاتی لازم است؟' }}
            <textarea v-model="note" rows="3" required maxlength="3000" />
          </label>
          <div>
            <button type="submit" class="ok" :disabled="busyId === w.id || !note.trim()">ثبت و ارسال اعلان</button>
            <button type="button" class="view" @click="noteFor = null">انصراف</button>
          </div>
        </form>
      </li>
    </ul>

    <nav v-if="lastPage > 1" class="pager" aria-label="صفحه‌بندی">
      <button type="button" :disabled="page <= 1" @click="page--; load()">قبلی</button>
      <span>صفحه {{ fa(page) }} از {{ fa(lastPage) }} ({{ fa(total) }} مورد)</span>
      <button type="button" :disabled="page >= lastPage" @click="page++; load()">بعدی</button>
    </nav>
  </section>
</template>

<style scoped>
.wishes-page { padding: 34px; display: grid; gap: 16px; }
.eyebrow { color: #7c5cff; font-weight: 800; font-size: 13px; }
h1 { margin: 4px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 14px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; display: inline-flex; gap: 8px; align-items: center; }
.tabs button.active { background: #7c5cff; border-color: #7c5cff; color: #fff; }
.n { background: rgba(100, 116, 139, .15); border-radius: 999px; font-size: 12px; padding: 0 8px; }
.tabs .active .n { background: rgba(255, 255, 255, .25); }
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
.filters input { flex: 1; min-width: 220px; }
input, select, textarea { border: 1px solid #e5e7eb; background: #fff; border-radius: 12px; padding: 10px 12px; font-family: inherit; font-size: 14px; }
.msg { padding: 10px 14px; border-radius: 12px; font-size: 14px; }
.msg.ok { background: #f0fdf4; color: #166534; } .msg.bad { background: #fef2f2; color: #b91c1c; }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.row { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: grid; grid-template-columns: 1fr auto; gap: 12px 16px; align-items: center; }
.title { font-weight: 800; color: #0f172a; font-size: 16px; }
.title:hover { color: #6d28d9; }
.meta { display: flex; gap: 6px 14px; flex-wrap: wrap; color: #64748b; font-size: 13px; margin-top: 6px; }
.tag { border-radius: 999px; padding: 0 9px; font-weight: 700; }
.tag.urgent { background: #fee2e2; color: #b91c1c; } .tag.important { background: #fef3c7; color: #92400e; }
.status { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; justify-self: end; }
.status.amber { background: #fef3c7; color: #92400e; } .status.green { background: #dcfce7; color: #166534; } .status.red { background: #fee2e2; color: #b91c1c; } .status.blue { background: #dbeafe; color: #1e40af; }
.actions { grid-column: 1 / -1; display: flex; gap: 8px; flex-wrap: wrap; }
.actions button, .note button, .view { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 7px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; color: #334155; }
.actions .ok, .note .ok { background: #16a34a; border-color: #16a34a; color: #fff; }
.actions .info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
.actions .no { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
button:disabled { opacity: .5; cursor: default; }
.note { grid-column: 1 / -1; display: grid; gap: 10px; background: #f8fafc; border-radius: 12px; padding: 12px; }
.note label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
.note div { display: flex; gap: 8px; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
@media (max-width: 640px) { .row { grid-template-columns: 1fr; } .status { justify-self: start; } }
</style>
