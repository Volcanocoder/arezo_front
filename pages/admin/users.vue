<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

type UserRole = 'user' | 'admin' | 'super_admin'
type RoleFilter = 'all' | UserRole

interface ApiUser {
  id: number
  name: string
  email: string | null
  mobile: string | null
  role: UserRole
  city: string | null
  created_at: string | null
}

interface UserStats {
  all: number
  user: number
  admin: number
  super_admin: number
}

interface ApiResponse {
  data: ApiUser[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  stats: UserStats
}

const API_BASE = 'http://localhost:8000'
const users = ref<ApiUser[]>([])
const stats = ref<UserStats>({ all: 0, user: 0, admin: 0, super_admin: 0 })
const search = ref('')
const roleFilter = ref<RoleFilter>('all')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const isLoading = ref(true)
const loadError = ref('')
const currentUserId = ref<number | null>(null)
const currentUserRole = ref<UserRole | null>(null)

const roleDrafts = ref<Record<number, UserRole>>({})
const actionLoadingId = ref<number | null>(null)

const actionError = ref('')
const actionSuccess = ref('')

const isSuperAdmin = computed(
  () => currentUserRole.value === 'super_admin'
)

const number = (value: number) => new Intl.NumberFormat('fa-IR').format(value)

const roleLabels: Record<UserRole, string> = {
  user: 'کاربر عادی',
  admin: 'مدیر',
  super_admin: 'مدیر ارشد',
}

const pageLabel = computed(() => `${number(currentPage.value)} از ${number(lastPage.value)}`)

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date)
}

function errorText(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: { message?: string; errors?: Record<string, string[]> }
      message?: string
      statusCode?: number
    }
    if (err.data?.errors) return Object.values(err.data.errors).flat().join(' ')
    if (err.statusCode === 401) {
        return 'نشست ورود معتبر نیست. دوباره وارد حساب مدیر شو.'
        }

        if (err.data?.message) {
        return err.data.message
        }

        if (err.statusCode === 403) {
        return 'اجازه انجام این عملیات را نداری.'
        }

        return err.message || 'دریافت اطلاعات ناموفق بود.'
  }
  return 'ارتباط با سرور برقرار نشد.'
}

async function fetchCurrentUser() {
  try {
    const response = await $fetch<Record<string, any>>(
      `${API_BASE}/api/auth/me`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }
    )

    const candidate =
      response?.user ??
      response?.data?.user ??
      response?.data?.data?.user ??
      response?.data ??
      response

    if (candidate && typeof candidate === 'object') {
      currentUserId.value = Number(candidate.id) || null

      if (
        ['user', 'admin', 'super_admin'].includes(candidate.role)
      ) {
        currentUserRole.value = candidate.role
      }
    }
  } catch {
    currentUserId.value = null
    currentUserRole.value = null
  }
}

async function fetchUsers(page = 1) {
  isLoading.value = true
  loadError.value = ''

  const params = new URLSearchParams({ page: String(page), role: roleFilter.value })
  if (search.value.trim()) params.set('search', search.value.trim())

  try {
    const response = await $fetch<ApiResponse>(`${API_BASE}/api/admin/users?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })

    users.value = response.data

    roleDrafts.value = Object.fromEntries(
    response.data.map(user => [user.id, user.role])
    ) as Record<number, UserRole>

stats.value = response.stats
    currentPage.value = response.current_page
    lastPage.value = response.last_page
    total.value = response.total
  } catch (error) {
    loadError.value = errorText(error)
    users.value = []
  } finally {
    isLoading.value = false
  }
}

async function getXsrfToken() {
  await $fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
  })

  const cookie = document.cookie
    .split('; ')
    .find(item => item.startsWith('XSRF-TOKEN='))

  if (!cookie) {
    throw new Error(
      'توکن امنیتی دریافت نشد. صفحه را تازه‌سازی و دوباره امتحان کن.'
    )
  }

  return decodeURIComponent(
    cookie.slice('XSRF-TOKEN='.length)
  )
}

async function saveRole(user: ApiUser) {
  if (!isSuperAdmin.value) return

  if (user.id === currentUserId.value) {
    actionError.value = 'نمی‌توانی نقش حساب خودت را از این بخش تغییر بدهی.'
    return
  }

  const nextRole = roleDrafts.value[user.id]

  if (!nextRole || nextRole === user.role) return

  const confirmed = window.confirm(
    `نقش «${user.name}» از «${roleLabels[user.role]}» به «${roleLabels[nextRole]}» تغییر کند؟`
  )

  if (!confirmed) {
    roleDrafts.value[user.id] = user.role
    return
  }

  actionLoadingId.value = user.id
  actionError.value = ''
  actionSuccess.value = ''

  try {
    const token = await getXsrfToken()

    await $fetch(`${API_BASE}/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': token,
      },
      body: { role: nextRole },
    })

    actionSuccess.value = 'نقش کاربر با موفقیت تغییر کرد.'
    await fetchUsers(currentPage.value)
  } catch (error) {
    roleDrafts.value[user.id] = user.role
    actionError.value = errorText(error)
  } finally {
    actionLoadingId.value = null
  }
}

async function deleteUser(user: ApiUser) {
  if (!isSuperAdmin.value) return

  if (user.id === currentUserId.value) {
    actionError.value = 'امکان حذف حساب خودت از این بخش وجود ندارد.'
    return
  }

  const confirmed = window.confirm(
    `آیا از حذف کاربر «${user.name}» مطمئنی؟ این عملیات قابل بازگشت نیست.`
  )

  if (!confirmed) return

  actionLoadingId.value = user.id
  actionError.value = ''
  actionSuccess.value = ''

  try {
    const token = await getXsrfToken()

    await $fetch(`${API_BASE}/api/admin/users/${user.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-XSRF-TOKEN': token,
      },
    })

    actionSuccess.value = 'کاربر با موفقیت حذف شد.'

    await fetchUsers(currentPage.value)

    if (
      !loadError.value &&
      users.value.length === 0 &&
      currentPage.value > 1
    ) {
      await fetchUsers(currentPage.value - 1)
    }
  } catch (error) {
    actionError.value = errorText(error)
  } finally {
    actionLoadingId.value = null
  }
}




function submitSearch() {
  void fetchUsers(1)
}

onMounted(() => {
  void Promise.all([
    fetchCurrentUser(),
    fetchUsers(1),
  ])
})
</script>

<template>
  <main class="users-page" dir="rtl">
    <header class="page-header">
      <div>
        <span class="eyebrow">مرکز مدیریت</span>
        <h1>مدیریت کاربران</h1>
        <p>حساب‌های ثبت‌شده در آرزو را مشاهده و جست‌وجو کن.</p>
      </div>
      <div class="header-tag"><span class="live-dot"></span> فهرست کاربران</div>
    </header>

    <section class="stats-grid" aria-label="آمار کاربران">
      <article class="stat-card">
        <div class="stat-icon purple">♙</div>
        <div><span>همه کاربران</span><strong>{{ number(stats.all) }}</strong><small>حساب‌های ثبت‌شده</small></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon blue">♧</div>
        <div><span>کاربران عادی</span><strong>{{ number(stats.user) }}</strong><small>حساب‌های کاربری</small></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon green">✓</div>
        <div><span>مدیران</span><strong>{{ number(stats.admin) }}</strong><small>دسترسی مدیریت</small></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon orange">◆</div>
        <div><span>مدیران ارشد</span><strong>{{ number(stats.super_admin) }}</strong><small>دسترسی ارشد</small></div>
      </article>
    </section>

    <section class="users-panel">
      <div class="panel-heading">
        <div>
          <h2>فهرست حساب‌ها</h2>
          <p>فقط اطلاعات ضروری حساب نمایش داده می‌شود؛ رمز عبور و توکن‌ها هرگز در این فهرست قرار نمی‌گیرند.</p>
        </div>
        <span class="total-pill">{{ number(total) }} کاربر</span>
      </div>

      <form class="toolbar" @submit.prevent="submitSearch">
        <label class="search-box">
          <span aria-hidden="true">⌕</span>
          <input v-model="search" type="search" placeholder="جستجو با نام، موبایل یا ایمیل..." aria-label="جستجوی کاربران" />
          <button v-if="search" type="button" aria-label="پاک کردن جستجو" @click="search = ''; submitSearch()">×</button>
        </label>
        <select v-model="roleFilter" aria-label="فیلتر نقش" @change="submitSearch">
          <option value="all">همه نقش‌ها</option>
          <option value="user">کاربران عادی</option>
          <option value="admin">مدیران</option>
          <option value="super_admin">مدیران ارشد</option>
        </select>
        <button class="search-button" type="submit">جستجو</button>
      </form>
      <div
        v-if="actionError"
        class="action-notice action-error"
        role="alert"
        >
        {{ actionError }}
        <button type="button" @click="actionError = ''">×</button>
        </div>

        <div
        v-if="actionSuccess"
        class="action-notice action-success"
        role="status"
        >
        {{ actionSuccess }}
        <button type="button" @click="actionSuccess = ''">×</button>
        </div>

      <div v-if="isLoading" class="state-box" role="status">
        <div class="spinner"></div>
        <h3>در حال دریافت کاربران...</h3>
        <p>اطلاعات از دیتابیس خوانده می‌شود.</p>
      </div>

      <div v-else-if="loadError" class="state-box error-state" role="alert">
        <div class="state-symbol">!</div>
        <h3>دریافت کاربران ناموفق بود</h3>
        <p>{{ loadError }}</p>
        <button type="button" class="search-button" @click="fetchUsers(currentPage)">تلاش دوباره</button>
      </div>

      <div v-else-if="users.length" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>کاربر</th>
              <th>شماره موبایل</th>
              <th>ایمیل</th>
              <th>شهر</th>
              <th>نقش</th>
              <th>تاریخ عضویت</th>
              <th v-if="isSuperAdmin">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ user.name?.trim().charAt(0) || '؟' }}</div>
                  <div class="user-name"><strong>{{ user.name || 'بدون نام' }}</strong><small>شناسه: {{ number(user.id) }}</small></div>
                </div>
              </td>
              <td>{{ user.mobile || '—' }}</td>
              <td class="email-cell">{{ user.email || '—' }}</td>
              <td>{{ user.city || 'ثبت نشده' }}</td>
              <td><span class="role-chip" :class="user.role">{{ roleLabels[user.role] || 'نامشخص' }}</span></td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td v-if="isSuperAdmin" class="actions-cell">
  <span
    v-if="user.id === currentUserId"
    class="self-label"
  >
    حساب شما
  </span>

  <div v-else class="user-actions">
    <select
      v-model="roleDrafts[user.id]"
      :disabled="actionLoadingId === user.id"
      aria-label="انتخاب نقش جدید"
    >
      <option value="user">کاربر عادی</option>
      <option value="admin">مدیر</option>
      <option value="super_admin">مدیر ارشد</option>
    </select>

    <button
      type="button"
      class="save-role-button"
      :disabled="
        actionLoadingId === user.id ||
        roleDrafts[user.id] === user.role
      "
      @click="saveRole(user)"
    >
      {{ actionLoadingId === user.id ? 'صبر کن...' : 'ذخیره نقش' }}
    </button>

    <button
      type="button"
      class="delete-user-button"
      :disabled="actionLoadingId === user.id"
      @click="deleteUser(user)"
    >
      حذف
    </button>
  </div>
</td>
            </tr>
          </tbody>
        </table>

        <footer class="pagination">
          <span>صفحه {{ pageLabel }} · {{ number(total) }} نتیجه</span>
          <div class="pagination-actions">
            <button type="button" :disabled="currentPage <= 1" @click="fetchUsers(currentPage - 1)">قبلی</button>
            <button type="button" :disabled="currentPage >= lastPage" @click="fetchUsers(currentPage + 1)">بعدی</button>
          </div>
        </footer>
      </div>

      <div v-else class="state-box">
        <div class="state-symbol">⌕</div>
        <h3>کاربری پیدا نشد</h3>
        <p>عبارت جستجو یا فیلتر نقش را تغییر بده.</p>
        <button type="button" class="search-button" @click="search = ''; roleFilter = 'all'; fetchUsers(1)">پاک کردن فیلترها</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.users-page { min-height: 100vh; padding: 35px 35px 60px; color: var(--color-text); }
.page-header { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:26px; }
.eyebrow { color:var(--color-primary); font-size:11px; font-weight:800; }
.page-header h1 { margin:7px 0; font-size:30px; font-weight:800; }
.page-header p { margin:0; color:var(--color-muted); font-size:12px; line-height:2; }
.header-tag { display:flex; align-items:center; gap:9px; padding:11px 14px; border:1px solid #eee; border-radius:12px; background:#fff; color:#696976; font-size:10px; white-space:nowrap; }
.live-dot { width:8px; height:8px; border-radius:50%; background:#36b777; }
.stats-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:25px; }
.stat-card { min-width:0; min-height:112px; display:flex; align-items:center; gap:13px; padding:19px; border:1px solid #eee; border-radius:17px; background:#fff; }
.stat-icon { width:43px; height:43px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:13px; font-size:20px; font-weight:800; }
.stat-icon.purple { background:#f0eeff; color:#6d5dfc; } .stat-icon.blue { background:#eef5ff; color:#3978cf; } .stat-icon.green { background:#eaf8f0; color:#29915d; } .stat-icon.orange { background:#fff4e5; color:#d78a26; }
.stat-card > div:last-child { min-width:0; display:flex; flex-direction:column; gap:5px; }
.stat-card span { color:var(--color-muted); font-size:10px; } .stat-card strong { font-size:25px; font-weight:800; } .stat-card small { color:#9999a3; font-size:9px; }
.users-panel { overflow:hidden; border:1px solid #eee; border-radius:20px; background:#fff; }
.panel-heading { display:flex; align-items:center; justify-content:space-between; gap:15px; padding:24px 25px; }
.panel-heading h2 { margin:0 0 6px; font-size:17px; font-weight:800; } .panel-heading p { margin:0; color:var(--color-muted); font-size:10px; line-height:1.9; }
.total-pill { flex-shrink:0; padding:7px 11px; border-radius:9px; background:#f0eeff; color:var(--color-primary); font-size:10px; font-weight:700; }
.toolbar { display:flex; align-items:center; gap:10px; padding:0 25px 20px; }
.search-box { flex:1; min-width:180px; height:43px; display:flex; align-items:center; gap:8px; padding:0 12px; border:1px solid #e8e8ee; border-radius:11px; background:#fff; }
.search-box > span { color:#9999a3; font-size:18px; } .search-box input { width:100%; min-width:0; height:100%; border:0; outline:0; background:transparent; font-family:inherit; font-size:11px; }
.search-box button { border:0; background:transparent; color:#888; font-size:18px; cursor:pointer; }
.toolbar select { height:43px; max-width:180px; padding:0 12px; border:1px solid #e8e8ee; border-radius:11px; background:#fff; font-family:inherit; font-size:11px; }
.search-button { min-height:40px; padding:0 16px; border:0; border-radius:10px; background:var(--color-primary); color:#fff; font-family:inherit; font-size:10px; font-weight:700; cursor:pointer; }
.search-button:hover { background:var(--color-primary-dark); }
.table-wrapper { border-top:1px solid #eee; overflow-x:auto; }
table { width:100%; border-collapse:collapse; white-space:nowrap; text-align:right; }
thead { background:#fafafd; } th { padding:15px 17px; color:#888894; font-size:10px; font-weight:700; } td { padding:15px 17px; border-top:1px solid #f0f0f3; font-size:10px; }
tbody tr:hover { background:#fdfdff; }
.user-cell { display:flex; align-items:center; gap:10px; } .avatar { width:38px; height:38px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#f0eeff; color:var(--color-primary); font-size:14px; font-weight:800; }
.user-name { display:flex; flex-direction:column; gap:4px; } .user-name strong { max-width:190px; overflow:hidden; font-size:11px; text-overflow:ellipsis; } .user-name small { color:#9999a3; font-size:9px; }
.email-cell { direction:ltr; text-align:right; }
.role-chip { display:inline-flex; padding:7px 10px; border-radius:8px; font-size:9px; font-weight:700; }
.role-chip.user { background:#eef5ff; color:#3978cf; } .role-chip.admin { background:#eaf8f0; color:#278750; } .role-chip.super_admin { background:#f0eeff; color:var(--color-primary); }
.pagination { display:flex; align-items:center; justify-content:space-between; gap:15px; padding:16px 20px; border-top:1px solid #eee; color:var(--color-muted); font-size:10px; }
.pagination-actions { display:flex; gap:8px; } .pagination-actions button { min-height:34px; padding:0 13px; border:1px solid #e5e5ed; border-radius:9px; background:#fff; color:var(--color-text); font-family:inherit; font-size:10px; cursor:pointer; } .pagination-actions button:disabled { opacity:.45; cursor:not-allowed; }
.state-box { min-height:250px; padding:55px 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:11px; border-top:1px solid #eee; text-align:center; }
.state-box h3 { margin:0; font-size:17px; } .state-box p { max-width:500px; margin:0 0 6px; color:var(--color-muted); font-size:11px; line-height:2; }
.state-symbol { color:var(--color-primary); font-size:35px; } .error-state { color:#b8404e; }
.spinner { width:28px; height:28px; border:3px solid #e8e5ff; border-top-color:var(--color-primary); border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:1100px) { .users-page { padding:28px 22px 50px; } .stats-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:650px) { .users-page { padding:22px 12px 40px; } .page-header { align-items:flex-start; flex-direction:column; } .panel-heading { padding:20px 15px; } .toolbar { flex-direction:column; align-items:stretch; padding:0 15px 17px; } .search-box { flex:auto; width:100%; } .toolbar select { max-width:none; width:100%; } .stats-grid { gap:10px; } .stat-card { padding:13px; gap:9px; } .stat-icon { width:36px; height:36px; } .pagination { align-items:flex-start; flex-direction:column; } }

.actions-cell {
  min-width: 280px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-actions select {
  max-width: 125px;
  min-height: 33px;
  padding: 0 7px;
  border: 1px solid #e5e5ed;
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 10px;
}

.user-actions button {
  min-height: 33px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.save-role-button {
  background: #eeeaff;
  color: var(--color-primary);
}

.delete-user-button {
  background: #fff0f0;
  color: #c03948;
}

.user-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.self-label {
  color: var(--color-muted);
  font-size: 10px;
}

.action-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 25px 16px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1.8;
}

.action-notice button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

.action-error {
  background: #fff0f0;
  color: #b42332;
}

.action-success {
  background: #eaf8f0;
  color: #217847;
}
</style>
