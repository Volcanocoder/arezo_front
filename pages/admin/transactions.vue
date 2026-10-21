<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'تراکنش‌ها | پنل مدیریت' })

type TxStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

interface Tx {
  id: number
  amount: number
  status: TxStatus
  gateway: string | null
  reference: string | null
  created_at: string
  paid_at: string | null
  wish: { id: number, title: string } | null
  user: { id: number, name: string, mobile: string | null } | null
}

interface Summary {
  paid_amount: number
  paid_count: number
  today_amount: number
  month_amount: number
  average: number
  pending_count: number
  failed_count: number
  filtered_paid_amount: number
}

const { api } = useApi()
const apiBase = useApiBase()

const rows = ref<Tx[]>([])
const summary = ref<Summary | null>(null)
const gateways = ref<string[]>([])
const status = ref('')
const gateway = ref('')
const q = ref('')
const from = ref('')
const to = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const error = ref('')

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n)
const dt = (v: string | null) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—')

const statusMeta: Record<TxStatus, { label: string, cls: string }> = {
  paid: { label: 'موفق', cls: 'green' },
  pending: { label: 'در انتظار', cls: 'amber' },
  failed: { label: 'ناموفق', cls: 'red' },
  cancelled: { label: 'لغو‌شده', cls: 'gray' },
}
const gatewayLabels: Record<string, string> = { zarinpal: 'زرین‌پال', test: 'آزمایشی' }

function query() {
  const out: Record<string, string | number> = {}
  if (status.value) out.status = status.value
  if (gateway.value) out.gateway = gateway.value
  if (q.value.trim()) out.q = q.value.trim()
  if (from.value) out.from = from.value
  if (to.value) out.to = to.value
  return out
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<{ data: Tx[], last_page: number, total: number, summary: Summary, gateways: string[] }>('/api/admin/transactions', {
      query: { ...query(), page: page.value },
    })
    rows.value = res.data
    lastPage.value = res.last_page
    total.value = res.total
    summary.value = res.summary
    gateways.value = res.gateways
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت تراکنش‌ها انجام نشد.')
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

function reset() {
  status.value = gateway.value = q.value = from.value = to.value = ''
  refilter()
}

async function exportCsv() {
  try {
    const blob = await $fetch<Blob>(`${apiBase}/api/admin/transactions/export`, { credentials: 'include', query: query(), responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = apiErrorMessage(e, 'خروجی گرفته نشد.')
  }
}

const cards = computed(() => summary.value
  ? [
      { label: 'مجموع حمایت‌های موفق', value: `${fa(summary.value.paid_amount)} تومان`, sub: `${fa(summary.value.paid_count)} تراکنش`, tone: 'violet' },
      { label: 'امروز', value: `${fa(summary.value.today_amount)} تومان`, sub: 'پرداخت‌های موفق', tone: 'green' },
      { label: '۳۰ روز اخیر', value: `${fa(summary.value.month_amount)} تومان`, sub: `میانگین هر کمک ${fa(summary.value.average)}`, tone: 'blue' },
      { label: 'ناموفق / در انتظار', value: `${fa(summary.value.failed_count)} / ${fa(summary.value.pending_count)}`, sub: 'لغو‌شده و ناموفق / نیمه‌کاره', tone: 'red' },
    ]
  : [])

onMounted(load)
</script>

<template>
  <section class="tx-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">مالی</span>
        <h1>تراکنش‌ها و حمایت‌ها</h1>
        <p>همه پرداخت‌های انجام‌شده از درگاه، با فیلتر و خروجی CSV.</p>
      </div>
      <button type="button" class="btn" @click="exportCsv">⬇ خروجی CSV</button>
    </header>

    <div v-if="cards.length" class="cards">
      <div v-for="c in cards" :key="c.label" class="card" :class="c.tone">
        <span>{{ c.label }}</span>
        <strong>{{ c.value }}</strong>
        <small>{{ c.sub }}</small>
      </div>
    </div>

    <div class="filters">
      <input v-model="q" type="search" placeholder="جست‌وجو: آرزو، کاربر، موبایل یا شماره پیگیری" @input="refilter(350)">
      <select v-model="status" aria-label="وضعیت" @change="refilter()">
        <option value="">همه وضعیت‌ها</option>
        <option value="paid">موفق</option>
        <option value="pending">در انتظار</option>
        <option value="failed">ناموفق</option>
        <option value="cancelled">لغو‌شده</option>
      </select>
      <select v-model="gateway" aria-label="درگاه" @change="refilter()">
        <option value="">همه درگاه‌ها</option>
        <option v-for="g in gateways" :key="g" :value="g">{{ gatewayLabels[g] || g }}</option>
      </select>
      <label class="date">از <input v-model="from" type="date" @change="refilter()"></label>
      <label class="date">تا <input v-model="to" type="date" @change="refilter()"></label>
      <button type="button" class="ghost" @click="reset">پاک‌کردن</button>
    </div>

    <p v-if="summary && (status || gateway || q || from || to)" class="filtered">
      مجموع موفق در این فیلتر: <strong>{{ fa(summary.filtered_paid_amount) }} تومان</strong> ({{ fa(total) }} ردیف)
    </p>

    <p v-if="error" class="state bad" role="alert">{{ error }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>شناسه</th><th>آرزو</th><th>کاربر</th><th>مبلغ</th><th>وضعیت</th><th>درگاه / پیگیری</th><th>تاریخ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">در حال دریافت...</td></tr>
          <tr v-else-if="!rows.length"><td colspan="7" class="empty">تراکنشی پیدا نشد.</td></tr>
          <tr v-for="t in rows" v-else :key="t.id">
            <td>{{ fa(t.id) }}</td>
            <td>
              <NuxtLink v-if="t.wish" :to="`/admin/wishes/${t.wish.id}`" class="wish">{{ t.wish.title }}</NuxtLink>
              <span v-else>—</span>
            </td>
            <td>
              <template v-if="t.user">{{ t.user.name }}<small dir="ltr">{{ t.user.mobile }}</small></template>
              <span v-else class="muted">مهمان</span>
            </td>
            <td class="amount">{{ fa(t.amount) }}</td>
            <td><span class="status" :class="statusMeta[t.status].cls">{{ statusMeta[t.status].label }}</span></td>
            <td>
              {{ (t.gateway && gatewayLabels[t.gateway]) || t.gateway || '—' }}
              <small v-if="t.reference" dir="ltr">{{ t.reference }}</small>
            </td>
            <td>{{ dt(t.paid_at || t.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; load()">قبلی</button>
      <span>صفحه {{ fa(page) }} از {{ fa(lastPage) }}</span>
      <button type="button" :disabled="page >= lastPage" @click="page++; load()">بعدی</button>
    </nav>
  </section>
</template>

<style scoped>
.tx-page { padding: 34px; display: grid; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 6px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.btn { border: 0; background: var(--color-primary); color: #fff; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: grid; gap: 4px; border-inline-start: 4px solid; }
.card span { color: #64748b; font-size: 13px; } .card strong { font-size: 20px; } .card small { color: #94a3b8; }
.card.violet { border-color: #7c5cff; } .card.green { border-color: #16a34a; } .card.blue { border-color: #2563eb; } .card.red { border-color: #dc2626; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.filters > input[type=search] { flex: 1; min-width: 240px; }
input, select { border: 1px solid #e5e7eb; background: #fff; border-radius: 12px; padding: 10px 12px; font-family: inherit; font-size: 14px; }
.date { display: flex; gap: 6px; align-items: center; font-size: 13px; color: #64748b; }
.ghost { border: 1px solid #e5e7eb; background: #fff; border-radius: 12px; padding: 10px 14px; cursor: pointer; font-family: inherit; }
.filtered { background: #f5f3ff; color: #5b21b6; border-radius: 12px; padding: 10px 14px; }
.state.bad { background: #fef2f2; color: #b91c1c; border-radius: 12px; padding: 10px 14px; }
.table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 860px; }
th { text-align: right; font-size: 12px; color: #64748b; padding: 12px 14px; background: #f8fafc; }
td { padding: 12px 14px; border-top: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
td small { display: block; color: #94a3b8; font-size: 12px; text-align: right; }
.empty { text-align: center; color: #94a3b8; padding: 30px; }
.wish { color: #0f172a; font-weight: 700; }
.wish:hover { color: #6d28d9; }
.amount { font-weight: 800; white-space: nowrap; }
.muted { color: #94a3b8; }
.status { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
.status.green { background: #dcfce7; color: #166534; } .status.amber { background: #fef3c7; color: #92400e; } .status.red { background: #fee2e2; color: #b91c1c; } .status.gray { background: #f1f5f9; color: #475569; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
.pager button:disabled { opacity: .4; }
@media (max-width: 640px) { .tx-page { padding: 20px 16px; } }
</style>
