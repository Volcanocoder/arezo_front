<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'نمای کلی | پنل مدیریت' })

interface Stats {
  users: { total: number, today: number }
  wishes: { total: number, pending: number, approved: number, rejected: number, needs_info: number, today: number }
  donations: { paid_count: number, paid_amount: number }
  daily_activity: { date: string, users: number, wishes: number }[]
  categories: { name: string, count: number }[]
  recent_wishes: { id: number, title: string, category: string | null, status: string, requested_amount: number | null, applicant_name: string | null, created_at: string }[]
  recent_users: { id: number, name: string, mobile: string | null, role: string, created_at: string }[]
  oldest_pending_at: string | null
  blog: { published: number, drafts: number }
}

const { api } = useApi()
const { user } = useAuth()

const days = ref<7 | 14 | 30>(7)
const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref('')

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n)
const shortDate = (v: string) => new Intl.DateTimeFormat('fa-IR', { month: 'numeric', day: 'numeric' }).format(new Date(v))
const date = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v))

const statusMeta: Record<string, { label: string, cls: string }> = {
  pending: { label: 'در انتظار', cls: 'amber' },
  approved: { label: 'تأییدشده', cls: 'green' },
  rejected: { label: 'ردشده', cls: 'red' },
  needs_info: { label: 'نیازمند اطلاعات', cls: 'blue' },
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    stats.value = await api<Stats>('/api/admin/dashboard/stats', { query: { days: days.value } })
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت آمار انجام نشد.')
  } finally {
    loading.value = false
  }
}

function setDays(d: 7 | 14 | 30) {
  days.value = d
  load()
}

const maxDaily = computed(() => Math.max(1, ...(stats.value?.daily_activity.flatMap(d => [d.users, d.wishes]) ?? [1])))
const maxCategory = computed(() => Math.max(1, ...(stats.value?.categories.map(c => c.count) ?? [1])))

const pendingAgeDays = computed(() => {
  const at = stats.value?.oldest_pending_at
  return at ? Math.floor((Date.now() - new Date(at).getTime()) / 86400000) : null
})

const breakdown = computed(() => {
  const w = stats.value?.wishes
  if (!w || !w.total) return []
  return [
    { key: 'approved', label: 'تأییدشده', n: w.approved, color: '#16a34a' },
    { key: 'pending', label: 'در انتظار', n: w.pending, color: '#f59e0b' },
    { key: 'needs_info', label: 'نیازمند اطلاعات', n: w.needs_info, color: '#2563eb' },
    { key: 'rejected', label: 'ردشده', n: w.rejected, color: '#dc2626' },
  ].map(i => ({ ...i, pct: Math.round((i.n / w.total) * 100) }))
})

const greeting = computed(() => {
  const h = new Date().getHours()
  const part = h < 12 ? 'صبح بخیر' : h < 18 ? 'روز بخیر' : 'عصر بخیر'
  return `${part}${user.value?.name ? `، ${user.value.name}` : ''}`
})

onMounted(load)
</script>

<template>
  <section class="overview">
    <header class="page-header">
      <div>
        <span class="eyebrow">{{ greeting }}</span>
        <h1>نمای کلی</h1>
        <p>وضعیت امروز آرزو در یک نگاه.</p>
      </div>
      <div class="range" role="group" aria-label="بازه نمودار">
        <button v-for="d in ([7, 14, 30] as const)" :key="d" type="button" :class="{ active: days === d }" @click="setDays(d)">{{ fa(d) }} روز</button>
      </div>
    </header>

    <p v-if="error" class="msg bad" role="alert">{{ error }} <button type="button" @click="load">تلاش دوباره</button></p>
    <p v-else-if="loading && !stats" class="msg">در حال دریافت آمار...</p>

    <template v-if="stats">
      <NuxtLink v-if="stats.wishes.pending" to="/admin/wishes?status=pending" class="alert">
        <strong>{{ fa(stats.wishes.pending) }} آرزو منتظر بررسی است</strong>
        <span v-if="pendingAgeDays !== null && pendingAgeDays > 0">قدیمی‌ترین مورد {{ fa(pendingAgeDays) }} روز است در صف مانده.</span>
        <span class="go">رفتن به صف بررسی ←</span>
      </NuxtLink>

      <div class="kpis">
        <div class="kpi">
          <span>کاربران</span>
          <strong>{{ fa(stats.users.total) }}</strong>
          <small>{{ fa(stats.users.today) }} نفر امروز</small>
        </div>
        <div class="kpi">
          <span>آرزوها</span>
          <strong>{{ fa(stats.wishes.total) }}</strong>
          <small>{{ fa(stats.wishes.today) }} مورد امروز</small>
        </div>
        <div class="kpi">
          <span>در انتظار بررسی</span>
          <strong>{{ fa(stats.wishes.pending) }}</strong>
          <small>{{ fa(stats.wishes.needs_info) }} نیازمند اطلاعات</small>
        </div>
        <div class="kpi">
          <span>حمایت‌های پرداخت‌شده</span>
          <strong>{{ fa(stats.donations.paid_count) }}</strong>
          <small>{{ fa(stats.donations.paid_amount) }} تومان</small>
        </div>
        <div class="kpi">
          <span>وبلاگ</span>
          <strong>{{ fa(stats.blog.published) }}</strong>
          <small>{{ fa(stats.blog.drafts) }} پیش‌نویس</small>
        </div>
      </div>

      <div class="grid2">
        <div class="panel">
          <div class="panel-head">
            <h2>فعالیت {{ fa(days) }} روز اخیر</h2>
            <div class="legend"><span class="d wish" />آرزو <span class="d user" />کاربر</div>
          </div>
          <div class="chart" :class="{ dense: days > 14 }" role="img" :aria-label="`نمودار ثبت آرزو و عضویت در ${days} روز اخیر`">
            <div v-for="d in stats.daily_activity" :key="d.date" class="col">
              <div class="bars">
                <span class="bar wish" :style="{ height: `${(d.wishes / maxDaily) * 100}%` }" :title="`${fa(d.wishes)} آرزو`" />
                <span class="bar user" :style="{ height: `${(d.users / maxDaily) * 100}%` }" :title="`${fa(d.users)} کاربر`" />
              </div>
              <small>{{ shortDate(d.date) }}</small>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h2>وضعیت آرزوها</h2></div>
          <p v-if="!breakdown.length" class="muted">هنوز آرزویی ثبت نشده است.</p>
          <template v-else>
            <div class="stack" role="img" aria-label="سهم هر وضعیت">
              <span v-for="b in breakdown" :key="b.key" :style="{ width: `${b.pct}%`, background: b.color }" />
            </div>
            <ul class="legend-list">
              <li v-for="b in breakdown" :key="b.key"><i :style="{ background: b.color }" />{{ b.label }}<strong>{{ fa(b.n) }}</strong><small>{{ fa(b.pct) }}٪</small></li>
            </ul>
          </template>
        </div>
      </div>

      <div class="grid2">
        <div class="panel">
          <div class="panel-head"><h2>آرزوها به تفکیک دسته</h2><NuxtLink to="/admin/categories">مدیریت</NuxtLink></div>
          <p v-if="!stats.categories.length" class="muted">داده‌ای نیست.</p>
          <ul v-else class="hbars">
            <li v-for="c in stats.categories" :key="c.name">
              <span class="name">{{ c.name || 'بدون دسته' }}</span>
              <span class="track"><span :style="{ width: `${(c.count / maxCategory) * 100}%` }" /></span>
              <strong>{{ fa(c.count) }}</strong>
            </li>
          </ul>
        </div>

        <div class="panel">
          <div class="panel-head"><h2>اقدام سریع</h2></div>
          <div class="quick">
            <NuxtLink to="/admin/wishes?status=pending">✅ بررسی آرزوها</NuxtLink>
            <NuxtLink to="/admin/notifications">🔔 ارسال اطلاعیه</NuxtLink>
            <NuxtLink to="/admin/blog/new">✎ نوشتن مقاله</NuxtLink>
            <NuxtLink to="/admin/users">♙ کاربران</NuxtLink>
            <NuxtLink to="/admin/categories">▦ دسته‌بندی‌ها</NuxtLink>
          </div>
        </div>
      </div>

      <div class="grid2">
        <div class="panel">
          <div class="panel-head"><h2>آخرین آرزوها</h2><NuxtLink to="/admin/wishes">همه</NuxtLink></div>
          <p v-if="!stats.recent_wishes.length" class="muted">هنوز آرزویی نیست.</p>
          <ul v-else class="items">
            <li v-for="w in stats.recent_wishes" :key="w.id">
              <NuxtLink :to="`/admin/wishes/${w.id}`">
                <strong>{{ w.title }}</strong>
                <small>{{ w.applicant_name || '—' }} · {{ date(w.created_at) }}</small>
              </NuxtLink>
              <span class="status" :class="statusMeta[w.status]?.cls">{{ statusMeta[w.status]?.label || w.status }}</span>
            </li>
          </ul>
        </div>

        <div class="panel">
          <div class="panel-head"><h2>تازه‌ترین اعضا</h2><NuxtLink to="/admin/users">همه</NuxtLink></div>
          <ul class="items">
            <li v-for="u in stats.recent_users" :key="u.id">
              <div>
                <strong>{{ u.name }}</strong>
                <small dir="ltr">{{ u.mobile || '—' }}</small>
              </div>
              <small>{{ date(u.created_at) }}</small>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.overview { padding: 34px; display: grid; gap: 18px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: #7c5cff; font-weight: 800; font-size: 13px; }
h1 { margin: 4px 0; font-size: 28px; }
h2 { margin: 0; font-size: 16px; }
p { margin: 0; color: #64748b; }
.range { display: inline-flex; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 3px; }
.range button { border: 0; background: none; padding: 7px 14px; border-radius: 9px; cursor: pointer; font-family: inherit; font-weight: 700; color: #64748b; }
.range .active { background: #7c5cff; color: #fff; }
.msg { padding: 10px 14px; border-radius: 12px; background: #fff; }
.msg.bad { background: #fef2f2; color: #b91c1c; }
.alert { display: flex; gap: 6px 16px; align-items: center; flex-wrap: wrap; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 16px; padding: 14px 18px; }
.alert .go { margin-inline-start: auto; font-weight: 800; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.kpi { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: grid; gap: 2px; }
.kpi span { color: #64748b; font-size: 13px; }
.kpi strong { font-size: 28px; color: #0f172a; }
.kpi small { color: #94a3b8; }
.grid2 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 18px; display: grid; gap: 14px; align-content: start; }
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.panel-head a { color: #7c5cff; font-size: 13px; font-weight: 700; }
.legend { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #64748b; }
.d { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.d.wish, .bar.wish { background: #7c5cff; } .d.user, .bar.user { background: #38bdf8; }
.chart { display: flex; align-items: flex-end; gap: 6px; height: 190px; }
.col { flex: 1; display: grid; gap: 6px; height: 100%; grid-template-rows: 1fr auto; min-width: 0; }
.bars { display: flex; align-items: flex-end; justify-content: center; gap: 3px; }
.bar { width: 40%; max-width: 18px; border-radius: 5px 5px 0 0; min-height: 3px; transition: height .3s; }
.col small { text-align: center; font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; }
.chart.dense .col:nth-child(even) small { visibility: hidden; }
.stack { display: flex; height: 14px; border-radius: 999px; overflow: hidden; background: #f1f5f9; }
.legend-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.legend-list li { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.legend-list i { width: 10px; height: 10px; border-radius: 3px; }
.legend-list strong { margin-inline-start: auto; }
.legend-list small { color: #94a3b8; width: 36px; text-align: left; }
.hbars { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.hbars li { display: grid; grid-template-columns: 110px 1fr 34px; align-items: center; gap: 10px; font-size: 14px; }
.track { height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.track span { display: block; height: 100%; background: linear-gradient(90deg, #a78bfa, #7c5cff); border-radius: 999px; }
.quick { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick a { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; padding: 12px; font-weight: 700; font-size: 14px; color: #334155; transition: .15s; }
.quick a:hover { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
.items { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.items li { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.items li:last-child { border: 0; }
.items strong, .items small { display: block; }
.items small { color: #94a3b8; }
.status { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }
.status.amber { background: #fef3c7; color: #92400e; } .status.green { background: #dcfce7; color: #166534; } .status.red { background: #fee2e2; color: #b91c1c; } .status.blue { background: #dbeafe; color: #1e40af; }
.muted { color: #94a3b8; font-size: 14px; }
@media (max-width: 900px) { .grid2 { grid-template-columns: 1fr; } }
</style>
