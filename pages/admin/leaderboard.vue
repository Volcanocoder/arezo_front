<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'رتبه‌بندی خیرین | پنل مدیریت' })

interface Row {
  rank: number
  user_id: number
  name: string
  mobile: string
  total_amount: number
  donations_count: number
  items_given: number
}

interface Res {
  data: Row[]
  sort: 'amount' | 'items'
  totals: { donors: number, total_amount: number, items_given: number }
}

const { api } = useApi()
const sort = ref<'amount' | 'items'>('amount')
const rows = ref<Row[]>([])
const totals = ref({ donors: 0, total_amount: 0, items_given: 0 })
const loading = ref(true)
const error = ref('')

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<Res>('/api/admin/leaderboard', { query: { sort: sort.value } })
    rows.value = res.data
    totals.value = res.totals
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت رتبه‌بندی انجام نشد.')
  } finally {
    loading.value = false
  }
}

function setSort(s: 'amount' | 'items') {
  sort.value = s
  load()
}

onMounted(load)
</script>

<template>
  <section class="board-page">
    <div>
      <span class="eyebrow">قدردانی</span>
      <h1>رتبه‌بندی خیرین</h1>
      <p>مهربان‌ترین کاربران را بر اساس کمک مالی (پرداخت‌های موفق) یا تعداد کالاهای اهداشده ببین.</p>
    </div>

    <div class="stats">
      <div><span>تعداد خیرین</span><strong>{{ fa(totals.donors) }}</strong></div>
      <div><span>مجموع کمک مالی</span><strong>{{ fa(totals.total_amount) }} تومان</strong></div>
      <div><span>کالاهای اهداشده</span><strong>{{ fa(totals.items_given) }}</strong></div>
    </div>

    <div class="tabs">
      <button type="button" :class="{ active: sort === 'amount' }" @click="setSort('amount')">بر اساس مبلغ کمک</button>
      <button type="button" :class="{ active: sort === 'items' }" @click="setSort('items')">بر اساس تعداد کالا</button>
    </div>

    <div v-if="error" class="state bad">{{ error }}</div>
    <div v-else-if="loading" class="state">در حال دریافت...</div>
    <div v-else-if="!rows.length" class="state">هنوز کمکی ثبت نشده است.</div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>رتبه</th>
            <th>نام</th>
            <th>موبایل</th>
            <th>مجموع کمک مالی</th>
            <th>تعداد پرداخت</th>
            <th>کالای اهداشده</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.user_id">
            <td><span class="rank" :class="{ top: r.rank <= 3 }">{{ fa(r.rank) }}</span></td>
            <td>{{ r.name }}</td>
            <td dir="ltr">{{ r.mobile }}</td>
            <td>{{ fa(r.total_amount) }} تومان</td>
            <td>{{ fa(r.donations_count) }}</td>
            <td>{{ fa(r.items_given) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.board-page { padding: 34px; max-width: 980px; display: grid; gap: 16px; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 6px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stats div { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px 16px; display: grid; gap: 4px; }
.stats span { color: #94a3b8; font-size: 12px; }
.stats strong { font-size: 18px; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; }
.tabs .active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; }
.state.bad { color: #b91c1c; background: #fef2f2; }
.table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
th, td { padding: 12px 14px; text-align: right; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
th { color: #64748b; font-size: 12px; background: #f8f8fc; }
.rank { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 50%; background: #f1f5f9; font-weight: 800; font-size: 13px; }
.rank.top { background: #fef3c7; color: #b45309; }
@media (max-width: 640px) { .board-page { padding: 20px 16px; } .stats { grid-template-columns: 1fr; } }
</style>
