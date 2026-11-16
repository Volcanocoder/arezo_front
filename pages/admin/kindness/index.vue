<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'دیوار مهربانی | پنل مدیریت' })

interface Person { id: number, name: string, mobile: string }

interface Item {
  id: number
  title: string
  category: string
  description: string
  condition_label: string
  city: string
  status: string
  review_note: string | null
  has_image: boolean
  created_at: string
  requests_count: number | null
  pending_requests_count: number | null
  owner: Person | null
}

interface Req {
  id: number
  status: string
  message: string
  review_note: string | null
  created_at: string
  item: { id: number, title: string, status: string } | null
  owner: Person | null
  requester: Person | null
}

const route = useRoute()
const { api } = useApi()
const apiBase = useApiBase()

const tab = ref<'items' | 'requests'>(route.query.tab === 'requests' ? 'requests' : 'items')
const status = ref('')
const page = ref(1)
const lastPage = ref(1)
const counts = ref<Record<string, number>>({})
const items = ref<Item[]>([])
const requests = ref<Req[]>([])
const loading = ref(true)
const error = ref('')
const busyId = ref<number | null>(null)

const itemLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده', reserved: 'رزروشده', given: 'تحویل‌شده',
}
const requestLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده', completed: 'تحویل‌شده',
}

const labels = computed(() => (tab.value === 'items' ? itemLabels : requestLabels))
const date = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v))

async function load() {
  loading.value = true
  error.value = ''

  try {
    const path = tab.value === 'items' ? '/api/admin/kindness/items' : '/api/admin/kindness/requests'
    const res = await api<{ data: Item[] | Req[], last_page: number, counts: Record<string, number> }>(path, {
      query: { status: status.value || undefined, page: page.value },
    })

    if (tab.value === 'items') items.value = res.data as Item[]
    else requests.value = res.data as Req[]

    lastPage.value = res.last_page
    counts.value = res.counts
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت اطلاعات انجام نشد.')
  } finally {
    loading.value = false
  }
}

function setTab(t: 'items' | 'requests') {
  tab.value = t
  status.value = ''
  page.value = 1
  load()
}

function setStatus(s: string) {
  status.value = s
  page.value = 1
  load()
}

async function changeItem(i: Item, next: 'approved' | 'rejected') {
  let note: string | null = null

  if (next === 'rejected') {
    note = window.prompt('دلیل رد یا حذف آگهی را بنویس:')
    if (!note?.trim()) return
  }

  busyId.value = i.id

  try {
    await api(`/api/admin/kindness/items/${i.id}/status`, { method: 'PATCH', body: { status: next, review_note: note?.trim() } })
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

async function changeRequest(r: Req, next: 'approved' | 'rejected' | 'completed') {
  let note: string | null = null

  if (next === 'rejected') {
    note = window.prompt('دلیل رد یا لغو درخواست را بنویس:')
    if (!note?.trim()) return
  }

  if (next === 'completed' && !window.confirm('تحویل کالا انجام شد؟')) return

  busyId.value = r.id

  try {
    await api(`/api/admin/kindness/requests/${r.id}/status`, { method: 'PATCH', body: { status: next, review_note: note?.trim() } })
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <section class="kindness-page">
    <div>
      <span class="eyebrow">دیوار مهربانی</span>
      <h1>بررسی آگهی‌ها و درخواست‌ها</h1>
      <p>آگهی‌ها و درخواست‌ها را تأیید کن. بعد از تأیید درخواست، شماره دو طرف را برای هماهنگی تحویل از همین‌جا ببین.</p>
    </div>

    <div class="tabs main">
      <button type="button" :class="{ active: tab === 'items' }" @click="setTab('items')">آگهی‌ها</button>
      <button type="button" :class="{ active: tab === 'requests' }" @click="setTab('requests')">درخواست‌ها</button>
    </div>

    <div class="tabs">
      <button type="button" :class="{ active: !status }" @click="setStatus('')">همه</button>
      <button v-for="(label, key) in labels" :key="key" type="button" :class="{ active: status === key }" @click="setStatus(String(key))">
        {{ label }} <span v-if="counts[key]" class="n">{{ counts[key] }}</span>
      </button>
    </div>

    <div v-if="error" class="state bad">{{ error }}</div>
    <div v-else-if="loading" class="state">در حال دریافت...</div>

    <template v-else-if="tab === 'items'">
      <div v-if="!items.length" class="state">آگهی‌ای پیدا نشد.</div>

      <article v-for="i in items" :key="i.id" class="card">
        <img v-if="i.has_image" class="thumb" :src="`${apiBase}/api/admin/kindness/items/${i.id}/image`" alt="" loading="lazy">

        <div class="info">
          <div class="top">
            <h3>{{ i.title }}</h3>
            <span class="badge" :class="i.status">{{ itemLabels[i.status] ?? i.status }}</span>
          </div>
          <p class="meta">{{ i.category }} · {{ i.condition_label }} · {{ i.city }} · {{ date(i.created_at) }}</p>
          <p class="desc">{{ i.description }}</p>
          <p v-if="i.owner" class="meta">آگهی‌دهنده: {{ i.owner.name }} — <span dir="ltr">{{ i.owner.mobile }}</span></p>
          <p v-if="i.requests_count" class="meta">
            {{ i.requests_count }} درخواست
            <strong v-if="i.pending_requests_count" class="warn">({{ i.pending_requests_count }} در انتظار بررسی)</strong>
          </p>
          <p v-if="i.review_note" class="note">یادداشت: {{ i.review_note }}</p>

          <div class="actions">
            <NuxtLink :to="`/admin/kindness/${i.id}`" class="det">جزئیات و بررسی</NuxtLink>
            <button v-if="i.status === 'pending'" class="ok" :disabled="busyId === i.id" @click="changeItem(i, 'approved')">تأیید</button>
            <button v-if="i.status === 'pending'" class="no" :disabled="busyId === i.id" @click="changeItem(i, 'rejected')">رد</button>
            <button v-if="i.status === 'approved'" class="no" :disabled="busyId === i.id" @click="changeItem(i, 'rejected')">حذف آگهی</button>
          </div>
        </div>
      </article>
    </template>

    <template v-else>
      <div v-if="!requests.length" class="state">درخواستی پیدا نشد.</div>

      <article v-for="r in requests" :key="r.id" class="card col">
        <div class="top">
          <h3>{{ r.item?.title ?? 'کالای حذف‌شده' }}</h3>
          <span class="badge" :class="r.status">{{ requestLabels[r.status] ?? r.status }}</span>
        </div>
        <p class="meta">{{ date(r.created_at) }}</p>
        <p class="desc">«{{ r.message }}»</p>

        <div class="people">
          <p v-if="r.requester">درخواست‌کننده: <strong>{{ r.requester.name }}</strong> — <span dir="ltr">{{ r.requester.mobile }}</span></p>
          <p v-if="r.owner">آگهی‌دهنده: <strong>{{ r.owner.name }}</strong> — <span dir="ltr">{{ r.owner.mobile }}</span></p>
        </div>

        <p v-if="r.review_note" class="note">یادداشت: {{ r.review_note }}</p>

        <div class="actions">
          <NuxtLink v-if="r.item" :to="`/admin/kindness/${r.item.id}`" class="det">جزئیات آگهی و درخواست‌ها</NuxtLink>
          <button v-if="r.status === 'pending'" class="ok" :disabled="busyId === r.id" @click="changeRequest(r, 'approved')">تأیید درخواست</button>
          <button v-if="r.status === 'pending'" class="no" :disabled="busyId === r.id" @click="changeRequest(r, 'rejected')">رد</button>
          <button v-if="r.status === 'approved'" class="ok" :disabled="busyId === r.id" @click="changeRequest(r, 'completed')">ثبت تحویل</button>
          <button v-if="r.status === 'approved'" class="no" :disabled="busyId === r.id" @click="changeRequest(r, 'rejected')">لغو</button>
        </div>
      </article>
    </template>

    <div v-if="lastPage > 1" class="pager">
      <button :disabled="page <= 1" @click="page--; load()">قبلی</button>
      <span>{{ page }} / {{ lastPage }}</span>
      <button :disabled="page >= lastPage" @click="page++; load()">بعدی</button>
    </div>
  </section>
</template>

<style scoped>
.kindness-page { padding: 34px; max-width: 920px; display: grid; gap: 16px; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 6px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; display: inline-flex; gap: 8px; }
.tabs .active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.tabs.main button { font-size: 15px; padding: 10px 22px; }
.n { background: #ef4444; color: #fff; border-radius: 999px; padding: 0 7px; font-size: 11px; }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; }
.state.bad { color: #b91c1c; background: #fef2f2; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: flex; gap: 16px; }
.card.col { flex-direction: column; gap: 8px; }
.thumb { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: #f1f5f9; }
.info { display: grid; gap: 6px; min-width: 0; flex: 1; }
.top { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
h3 { margin: 0; font-size: 16px; }
.meta { font-size: 13px; color: #94a3b8; }
.desc { color: #334155; line-height: 2; white-space: pre-line; }
.people { display: grid; gap: 4px; padding: 10px 12px; background: #f8f8fc; border-radius: 12px; color: #334155; font-size: 14px; }
.note { color: #b45309; font-size: 13px; }
.badge { padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #eef2ff; color: #4338ca; }
.badge.approved, .badge.completed, .badge.given { background: #ecfdf3; color: #15803d; }
.badge.rejected { background: #fef2f2; color: #b91c1c; }
.badge.reserved { background: #fff7ed; color: #c2410c; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.actions .det { display: inline-flex; align-items: center; border-radius: 10px; padding: 8px 16px; background: #eef2ff; color: #4338ca; font-weight: 800; text-decoration: none; font-size: 14px; }
.warn { color: #c2410c; }
.actions button { border: 0; border-radius: 10px; padding: 8px 16px; font-family: inherit; font-weight: 800; cursor: pointer; }
.actions .ok { background: #16a34a; color: #fff; }
.actions .no { background: #fee2e2; color: #b91c1c; }
.actions button:disabled { opacity: .6; cursor: wait; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
@media (max-width: 640px) { .kindness-page { padding: 20px 16px; } .card { flex-direction: column; } .thumb { width: 100%; height: 180px; } }
</style>
