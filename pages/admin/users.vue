<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'مدیریت کاربران | پنل مدیریت' })

type UserRole = 'user' | 'admin' | 'super_admin'

interface ApiUser {
  id: number
  name: string
  email: string | null
  mobile: string | null
  role: UserRole
  city: string | null
  created_at: string | null
  last_login_at: string | null
  suspended_at: string | null
  wishes_count: number
  donations_count: number
}

interface UserDetail {
  user: ApiUser & { bio: string | null, suspension_reason: string | null }
  recent_wishes: { id: number, title: string, status: string, created_at: string }[]
  paid_total: number
}

interface Stats {
  all: number
  user: number
  admin: number
  super_admin: number
  suspended: number
  new_this_week: number
}

const { api } = useApi()
const { user: me } = useAuth()
const apiBase = useApiBase()

const users = ref<ApiUser[]>([])
const stats = ref<Stats>({ all: 0, user: 0, admin: 0, super_admin: 0, suspended: 0, new_this_week: 0 })
const search = ref('')
const role = ref<'all' | UserRole>('all')
const status = ref<'all' | 'active' | 'suspended'>('all')
const sort = ref<'newest' | 'oldest' | 'name' | 'wishes'>('newest')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busyId = ref<number | null>(null)

const detail = ref<UserDetail | null>(null)
const detailLoading = ref(false)
const suspendReason = ref('')

const isSuper = computed(() => me.value?.role === 'super_admin')

const roleLabels: Record<UserRole, string> = { user: 'کاربر', admin: 'مدیر', super_admin: 'مدیر ارشد' }
const statusLabels: Record<string, string> = { pending: 'در انتظار', approved: 'تأییدشده', rejected: 'ردشده', needs_info: 'نیازمند اطلاعات' }

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n)
const date = (v: string | null) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v)) : '—')
const dateTime = (v: string | null) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'هرگز')

function query() {
  const q: Record<string, string | number> = { page: page.value, role: role.value, status: status.value, sort: sort.value }
  if (search.value.trim()) q.search = search.value.trim()
  return q
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<{ data: ApiUser[], current_page: number, last_page: number, total: number, stats: Stats }>('/api/admin/users', { query: query() })
    users.value = res.data
    stats.value = res.stats
    lastPage.value = res.last_page
    total.value = res.total
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت کاربران انجام نشد.')
    users.value = []
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
function refilter(immediate = true) {
  page.value = 1
  clearTimeout(timer)
  if (immediate) load()
  else timer = setTimeout(load, 350)
}

function go(p: number) {
  page.value = p
  load()
}

async function openDetail(u: ApiUser) {
  detail.value = null
  detailLoading.value = true
  suspendReason.value = ''
  notice.value = ''

  try {
    detail.value = await api<UserDetail>(`/api/admin/users/${u.id}`)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    detailLoading.value = false
  }
}

function canManage(u: ApiUser) {
  return u.id !== me.value?.id && (u.role === 'user' || isSuper.value)
}

async function suspend(u: ApiUser) {
  busyId.value = u.id
  error.value = ''

  try {
    await api(`/api/admin/users/${u.id}/suspend`, { method: 'POST', body: { reason: suspendReason.value || undefined } })
    notice.value = `حساب «${u.name}» تعلیق شد.`
    detail.value = null
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

async function unsuspend(u: ApiUser) {
  busyId.value = u.id
  error.value = ''

  try {
    await api(`/api/admin/users/${u.id}/unsuspend`, { method: 'POST' })
    notice.value = `تعلیق «${u.name}» برداشته شد.`
    detail.value = null
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

async function changeRole(u: ApiUser, next: UserRole) {
  if (next === u.role) return
  if (!window.confirm(`نقش «${u.name}» به «${roleLabels[next]}» تغییر کند؟`)) return load()

  busyId.value = u.id
  try {
    await api(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: next } })
    notice.value = 'نقش کاربر تغییر کرد.'
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
    await load()
  }
}

async function remove(u: ApiUser) {
  if (!window.confirm(`کاربر «${u.name}» حذف شود؟ این کار قابل بازگشت نیست.`)) return

  busyId.value = u.id
  try {
    await api(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    notice.value = 'کاربر حذف شد.'
    detail.value = null
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

async function exportCsv() {
  try {
    const q = query()
    delete q.page
    const blob = await $fetch<Blob>(`${apiBase}/api/admin/users/export`, { credentials: 'include', query: q, responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = apiErrorMessage(e, 'خروجی گرفته نشد.')
  }
}

const cards = computed(() => [
  { label: 'کل کاربران', value: stats.value.all, tone: 'violet' },
  { label: 'عضو جدید این هفته', value: stats.value.new_this_week, tone: 'green' },
  { label: 'مدیران', value: stats.value.admin + stats.value.super_admin, tone: 'blue' },
  { label: 'تعلیق‌شده', value: stats.value.suspended, tone: 'red' },
])

onMounted(load)
</script>

<template>
  <section class="users-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">کاربران</span>
        <h1>مدیریت کاربران</h1>
        <p>جست‌وجو، مشاهده جزئیات، تعلیق حساب و ارسال اعلان به هر کاربر.</p>
      </div>
      <button type="button" class="btn" @click="exportCsv">⬇ خروجی CSV</button>
    </header>

    <div class="cards">
      <div v-for="c in cards" :key="c.label" class="card" :class="c.tone">
        <strong>{{ fa(c.value) }}</strong>
        <span>{{ c.label }}</span>
      </div>
    </div>

    <p v-if="notice" class="msg ok" role="status">{{ notice }}</p>
    <p v-if="error" class="msg bad" role="alert">{{ error }}</p>

    <div class="filters">
      <input v-model="search" type="search" placeholder="جست‌وجوی نام، ایمیل یا موبایل..." @input="refilter(false)">
      <select v-model="role" aria-label="نقش" @change="refilter()">
        <option value="all">همه نقش‌ها</option>
        <option value="user">کاربر</option>
        <option value="admin">مدیر</option>
        <option value="super_admin">مدیر ارشد</option>
      </select>
      <select v-model="status" aria-label="وضعیت" @change="refilter()">
        <option value="all">همه وضعیت‌ها</option>
        <option value="active">فعال</option>
        <option value="suspended">تعلیق‌شده</option>
      </select>
      <select v-model="sort" aria-label="مرتب‌سازی" @change="refilter()">
        <option value="newest">جدیدترین</option>
        <option value="oldest">قدیمی‌ترین</option>
        <option value="name">نام</option>
        <option value="wishes">بیشترین آرزو</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>کاربر</th>
            <th>نقش</th>
            <th>آرزو / حمایت</th>
            <th>عضویت</th>
            <th>آخرین ورود</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="empty">در حال دریافت...</td></tr>
          <tr v-else-if="!users.length"><td colspan="6" class="empty">کاربری پیدا نشد.</td></tr>
          <tr v-for="u in users" v-else :key="u.id" :class="{ suspended: u.suspended_at }">
            <td>
              <button type="button" class="who" @click="openDetail(u)">
                <span class="avatar">{{ u.name.charAt(0) }}</span>
                <span>
                  <strong>{{ u.name }}</strong>
                  <small dir="ltr">{{ u.mobile || u.email || '—' }}</small>
                </span>
              </button>
              <span v-if="u.suspended_at" class="pill red">تعلیق</span>
            </td>
            <td>
              <select
                v-if="isSuper && u.id !== me?.id"
                :value="u.role"
                :disabled="busyId === u.id"
                aria-label="تغییر نقش"
                @change="changeRole(u, ($event.target as HTMLSelectElement).value as UserRole)"
              >
                <option value="user">کاربر</option>
                <option value="admin">مدیر</option>
                <option value="super_admin">مدیر ارشد</option>
              </select>
              <span v-else class="pill">{{ roleLabels[u.role] }}</span>
            </td>
            <td>{{ fa(u.wishes_count) }} / {{ fa(u.donations_count) }}</td>
            <td>{{ date(u.created_at) }}</td>
            <td>{{ dateTime(u.last_login_at) }}</td>
            <td class="ops">
              <button type="button" class="mini" @click="openDetail(u)">جزئیات</button>
              <NuxtLink class="mini" :to="{ path: '/admin/notifications', query: { user: u.id, name: u.name, mobile: u.mobile || '' } }">اعلان</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="pager" aria-label="صفحه‌بندی">
      <button type="button" :disabled="page <= 1" @click="go(page - 1)">قبلی</button>
      <span>صفحه {{ fa(page) }} از {{ fa(lastPage) }} ({{ fa(total) }} کاربر)</span>
      <button type="button" :disabled="page >= lastPage" @click="go(page + 1)">بعدی</button>
    </nav>

    <div v-if="detail || detailLoading" class="overlay" @click.self="detail = null">
      <div class="modal" role="dialog" aria-modal="true" aria-label="جزئیات کاربر">
        <button type="button" class="close" aria-label="بستن" @click="detail = null">✕</button>

        <p v-if="detailLoading">در حال دریافت...</p>

        <template v-else-if="detail">
          <div class="m-head">
            <span class="avatar big">{{ detail.user.name.charAt(0) }}</span>
            <div>
              <h2>{{ detail.user.name }}</h2>
              <span class="pill">{{ roleLabels[detail.user.role] }}</span>
              <span v-if="detail.user.suspended_at" class="pill red">تعلیق‌شده</span>
            </div>
          </div>

          <dl class="facts">
            <div><dt>موبایل</dt><dd dir="ltr">{{ detail.user.mobile || '—' }}</dd></div>
            <div><dt>ایمیل</dt><dd dir="ltr">{{ detail.user.email || '—' }}</dd></div>
            <div><dt>شهر</dt><dd>{{ detail.user.city || '—' }}</dd></div>
            <div><dt>عضویت</dt><dd>{{ date(detail.user.created_at) }}</dd></div>
            <div><dt>آخرین ورود</dt><dd>{{ dateTime(detail.user.last_login_at) }}</dd></div>
            <div><dt>آرزوها</dt><dd>{{ fa(detail.user.wishes_count) }}</dd></div>
            <div><dt>حمایت‌ها</dt><dd>{{ fa(detail.user.donations_count) }}</dd></div>
            <div><dt>مجموع پرداخت</dt><dd>{{ fa(detail.paid_total) }} تومان</dd></div>
          </dl>

          <p v-if="detail.user.bio" class="bio">{{ detail.user.bio }}</p>
          <p v-if="detail.user.suspended_at" class="msg bad">دلیل تعلیق: {{ detail.user.suspension_reason || 'ثبت نشده' }}</p>

          <h3>آخرین آرزوها</h3>
          <ul v-if="detail.recent_wishes.length" class="wl">
            <li v-for="w in detail.recent_wishes" :key="w.id">
              <NuxtLink :to="`/admin/wishes/${w.id}`">{{ w.title }}</NuxtLink>
              <span class="pill">{{ statusLabels[w.status] || w.status }}</span>
            </li>
          </ul>
          <p v-else class="muted">هنوز آرزویی ثبت نکرده است.</p>

          <div class="m-actions">
            <NuxtLink class="btn" :to="{ path: '/admin/notifications', query: { user: detail.user.id, name: detail.user.name, mobile: detail.user.mobile || '' } }">ارسال اعلان</NuxtLink>

            <template v-if="canManage(detail.user)">
              <button v-if="detail.user.suspended_at" type="button" class="btn" :disabled="busyId === detail.user.id" @click="unsuspend(detail.user)">رفع تعلیق</button>
              <template v-else>
                <input v-model="suspendReason" type="text" maxlength="255" placeholder="دلیل تعلیق (اختیاری)">
                <button type="button" class="btn danger" :disabled="busyId === detail.user.id" @click="suspend(detail.user)">تعلیق حساب</button>
              </template>
              <button v-if="isSuper" type="button" class="btn ghost-danger" :disabled="busyId === detail.user.id" @click="remove(detail.user)">حذف کاربر</button>
            </template>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.users-page { padding: 34px; display: grid; gap: 18px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: #7c5cff; font-weight: 800; font-size: 13px; }
h1 { margin: 4px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.btn { border: 0; background: #7c5cff; color: #fff; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; }
.btn:disabled { opacity: .5; }
.btn.danger { background: #dc2626; }
.btn.ghost-danger { background: #fef2f2; color: #b91c1c; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: grid; gap: 4px; border-inline-start: 4px solid; }
.card strong { font-size: 26px; }
.card span { color: #64748b; font-size: 13px; }
.card.violet { border-color: #7c5cff; } .card.green { border-color: #16a34a; } .card.blue { border-color: #2563eb; } .card.red { border-color: #dc2626; }
.msg { padding: 10px 14px; border-radius: 12px; font-size: 14px; }
.msg.ok { background: #f0fdf4; color: #166534; } .msg.bad { background: #fef2f2; color: #b91c1c; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
.filters input { flex: 1; min-width: 220px; }
input, select { border: 1px solid #e5e7eb; background: #fff; border-radius: 12px; padding: 10px 12px; font-family: inherit; font-size: 14px; }
.table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th { text-align: right; font-size: 12px; color: #64748b; padding: 12px 14px; background: #f8fafc; }
td { padding: 12px 14px; border-top: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
tr.suspended { background: #fffafa; }
.empty { text-align: center; color: #94a3b8; padding: 30px; }
.who { display: inline-flex; gap: 10px; align-items: center; background: none; border: 0; cursor: pointer; font-family: inherit; text-align: right; padding: 0; }
.who strong, .who small { display: block; }
.who small { color: #94a3b8; direction: ltr; text-align: right; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: #ede9fe; color: #6d28d9; display: grid; place-items: center; font-weight: 800; flex-shrink: 0; }
.avatar.big { width: 52px; height: 52px; font-size: 20px; }
.pill { display: inline-block; background: #f1f5f9; color: #475569; border-radius: 999px; padding: 2px 10px; font-size: 12px; margin-inline-start: 6px; }
.pill.red { background: #fee2e2; color: #b91c1c; }
.ops { display: flex; gap: 6px; }
.mini { border: 1px solid #e5e7eb; background: #fff; border-radius: 9px; padding: 6px 12px; font-size: 13px; cursor: pointer; font-family: inherit; color: #334155; }
.mini:hover { border-color: #c4b5fd; color: #6d28d9; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
.pager button:disabled { opacity: .4; }
.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, .5); display: grid; place-items: center; padding: 20px; z-index: 300; }
.modal { background: #fff; border-radius: 20px; width: min(620px, 100%); max-height: 90vh; overflow-y: auto; padding: 26px; position: relative; display: grid; gap: 14px; }
.close { position: absolute; top: 14px; inset-inline-start: 14px; border: 0; background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
.m-head { display: flex; gap: 14px; align-items: center; }
.m-head h2 { margin: 0 0 4px; font-size: 20px; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0; }
.facts div { background: #f8fafc; border-radius: 12px; padding: 10px 12px; }
.facts dt { font-size: 12px; color: #94a3b8; }
.facts dd { margin: 2px 0 0; font-weight: 700; font-size: 14px; }
h3 { margin: 4px 0 0; font-size: 15px; }
.wl { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.wl li { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 12px; border-radius: 10px; font-size: 14px; }
.bio, .muted { font-size: 14px; }
.m-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 14px; }
.m-actions input { flex: 1; min-width: 160px; }
@media (max-width: 520px) { .facts { grid-template-columns: 1fr; } }
</style>
