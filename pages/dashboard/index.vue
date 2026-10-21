<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

type ApiWishStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'

type DisplayStatus =
  | 'در انتظار بررسی'
  | 'تأیید شده'
  | 'رد شده'
  | 'نیازمند تکمیل اطلاعات'

interface ApiWish {
  id: number
  title: string
  description?: string | null
  category?: string | null
  city?: string | null
  requested_amount?: number | string | null
  status: ApiWishStatus
  created_at?: string
}

interface PaginatedWishes {
  data?: ApiWish[]
  current_page?: number
  last_page?: number
  message?: string
}

interface MyWish {
  id: number
  title: string
  category: string
  city: string
  amount: number
  status: DisplayStatus
}

const API_BASE = useApiBase()
const { user, fetchUser } = useAuth()
const unread = useUnread()
const { api } = useApi()

interface NotificationPreview {
  id: number
  title: string
  body: string
  type: 'info' | 'success' | 'warning'
  is_read: boolean
  created_at: string
}

const latestNotifications = ref<NotificationPreview[]>([])
const notifIcons: Record<string, string> = { info: '🔔', success: '✅', warning: '⚠️' }

const greetingText = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'صبح بخیر' : h < 18 ? 'روز بخیر' : 'عصر بخیر'
})

const loadNotifications = async () => {
  try {
    const res = await api<{ data: NotificationPreview[], unread_count: number }>('/api/notifications', { query: { page: 1 } })
    latestNotifications.value = res.data.slice(0, 4)
    unread.count.value = res.unread_count
  } catch {
    // اعلان‌ها مهم‌تر از خطای کل صفحه نیستند.
  }
}

const notifDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso))

const statusLabels: Record<ApiWishStatus, DisplayStatus> = {
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_info: 'نیازمند تکمیل اطلاعات',
}

const wishes = ref<MyWish[]>([])
const isLoading = ref(false)
const loadError = ref('')

const userName = computed(() => user.value?.name?.trim() || 'دوست عزیز')
const userInitial = computed(() => Array.from(userName.value)[0] || 'آ')
const myWishes = computed(() => wishes.value.slice(0, 3))

const stats = computed(() => [
  {
    title: 'آرزوهای من',
    value: wishes.value.length,
    icon: '♡',
  },
  {
    title: 'در انتظار بررسی',
    value: wishes.value.filter((wish) => wish.status === 'در انتظار بررسی').length,
    icon: '◔',
  },
  {
    title: 'آرزوهای تأییدشده',
    value: wishes.value.filter((wish) => wish.status === 'تأیید شده').length,
    icon: '✓',
  },
  {
    title: 'نیازمند تکمیل اطلاعات',
    value: wishes.value.filter((wish) => wish.status === 'نیازمند تکمیل اطلاعات').length,
    icon: '💬',
  },
])

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fa-IR').format(price)

const fetchDashboardData = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    if (!user.value) {
      await fetchUser()
    }

    const allRows: ApiWish[] = []
    let page = 1
    let lastPage = 1

    // API returns paginated results; fetch each page so dashboard counts are accurate.
    while (page <= lastPage && page <= 100) {
      const response = await fetch(`${API_BASE}/api/my/wishes?page=${page}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })

      const payload = await response.json().catch(() => null) as PaginatedWishes | null

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('نشست کاربری معتبر نیست؛ دوباره وارد حساب کاربری شوید.')
        }
        throw new Error(payload?.message || 'دریافت اطلاعات داشبورد با خطا روبه‌رو شد.')
      }

      const rows = Array.isArray(payload?.data) ? payload.data : []
      allRows.push(...rows)
      lastPage = Math.max(1, Number(payload?.last_page ?? 1))
      const currentPage = Number(payload?.current_page ?? page)

      if (rows.length === 0 || currentPage >= lastPage) break
      page = currentPage + 1
    }

    wishes.value = allRows.map((item) => ({
      id: Number(item.id),
      title: item.title || 'آرزوی بدون عنوان',
      category: item.category || 'بدون دسته‌بندی',
      city: item.city || 'ثبت نشده',
      amount: Number(item.requested_amount || 0),
      status: statusLabels[item.status] || 'در انتظار بررسی',
    }))
  } catch (error) {
    loadError.value = error instanceof Error
      ? error.message
      : 'ارتباط با سرور برقرار نشد. وضعیت بک‌اند را بررسی کن.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
  loadNotifications()
})
</script>

<template>
  <main class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <span class="eyebrow">داشبورد</span>
        <h1>{{ greetingText }}، {{ userName }} 👋</h1>
        <p>اینجا می‌توانی آرزوها و فعالیت‌های خودت را مدیریت کنی.</p>
      </div>

      <div class="header-actions">
        <NuxtLink
          to="/dashboard/notifications"
          class="notification-btn"
          :aria-label="unread.count.value ? `${unread.count.value} اعلان خوانده‌نشده` : 'اعلان‌ها'"
        >
          🔔
          <b v-if="unread.count.value" class="bell-count">{{ unread.count.value.toLocaleString('fa-IR') }}</b>
        </NuxtLink>
        <div class="user-avatar" :aria-label="`حساب کاربری ${userName}`">
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="">
          <template v-else>{{ userInitial }}</template>
        </div>
      </div>
    </header>

    <section class="stats-grid" aria-label="خلاصه وضعیت آرزوها">
      <div v-for="stat in stats" :key="stat.title" class="stat-card">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div>
          <span>{{ stat.title }}</span>
          <strong>{{ isLoading ? '…' : formatPrice(stat.value) }}</strong>
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="content-card">
        <div class="card-header">
          <div>
            <h2>آرزوهای من</h2>
            <p>آخرین آرزوهایی که ثبت کرده‌ای</p>
          </div>
          <NuxtLink to="/dashboard/my-wishes" class="see-all">
            مشاهده همه
          </NuxtLink>
        </div>

        <div class="wish-list">
          <div v-if="isLoading" class="dashboard-message">
            در حال دریافت آرزوهای تو…
          </div>

          <div v-else-if="loadError" class="dashboard-message">
            <p>{{ loadError }}</p>
            <button type="button" @click="fetchDashboardData">
              تلاش دوباره
            </button>
          </div>

          <div v-else-if="myWishes.length === 0" class="dashboard-message">
            <p>هنوز آرزویی ثبت نکرده‌ای.</p>
            <NuxtLink to="/create-wish">ثبت آرزوی جدید</NuxtLink>
          </div>

          <template v-else>
            <article v-for="wish in myWishes" :key="wish.id" class="wish-item">
              <div class="wish-icon">❤️</div>
              <div class="wish-info">
                <strong>{{ wish.title }}</strong>
                <span>{{ wish.category }} · {{ wish.city }}</span>
              </div>
              <div class="wish-status">
                <span
                  :class="{
                    success: wish.status === 'تأیید شده',
                    danger: wish.status === 'رد شده',
                    info: wish.status === 'نیازمند تکمیل اطلاعات',
                  }"
                >
                  {{ wish.status }}
                </span>
                <strong>{{ formatPrice(wish.amount) }} تومان</strong>
              </div>
            </article>
          </template>
        </div>
      </div>

      <div class="content-card quick-card">
        <div class="card-header">
          <div>
            <h2>دسترسی سریع</h2>
            <p>کارهای پرکاربرد</p>
          </div>
        </div>

        <div class="quick-actions">
          <NuxtLink to="/create-wish" class="quick-action primary">
            <span>＋</span>
            <div>
              <strong>ثبت آرزوی جدید</strong>
              <small>آرزویت را با دیگران به اشتراک بگذار</small>
            </div>
          </NuxtLink>

          <NuxtLink to="/wishes" class="quick-action">
            <span>♡</span>
            <div>
              <strong>پیدا کردن یک آرزو</strong>
              <small>برای برآورده کردن یک آرزو قدم بردار</small>
            </div>
          </NuxtLink>

          <NuxtLink to="/dashboard/messages" class="quick-action">
            <span>💬</span>
            <div>
              <strong>پیام‌ها</strong>
              <small>گفتگوهای خودت را ببین</small>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="content-card notif-card" aria-label="آخرین اعلان‌ها">
      <div class="card-header">
        <div>
          <h2>آخرین اعلان‌ها</h2>
          <p>نتیجه بررسی آرزوها و اطلاعیه‌های آرزو</p>
        </div>
        <NuxtLink to="/dashboard/notifications" class="see-all">مشاهده همه</NuxtLink>
      </div>

      <p v-if="!latestNotifications.length" class="dashboard-message">اعلان جدیدی نداری.</p>

      <ul v-else class="notif-list">
        <li v-for="n in latestNotifications" :key="n.id" :class="{ unread: !n.is_read }">
          <span class="n-ico">{{ notifIcons[n.type] }}</span>
          <div>
            <strong>{{ n.title }}</strong>
            <small>{{ n.body }}</small>
          </div>
          <time>{{ notifDate(n.created_at) }}</time>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.user-avatar { overflow: hidden; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.notification-btn { display: grid; place-items: center; font-size: 18px; }
.bell-count { position: absolute; top: -6px; inset-inline-start: -6px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 999px; background: #ef4444; color: #fff; font-size: 11px; display: grid; place-items: center; border: 2px solid #f6f5fc; }
.quick-action:not(.primary) { color: var(--color-text); }
.notif-card { margin-top: 24px; }
.notif-list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }
.notif-list li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #faf9ff; border: 1px solid #f0eefb; }
.notif-list li.unread { background: #f3f0ff; border-color: #ddd6fe; }
.notif-list div { flex: 1; min-width: 0; display: grid; gap: 2px; }
.notif-list small { color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notif-list time { color: #9ca3af; font-size: 12px; white-space: nowrap; }
.n-ico { font-size: 20px; }
@media (max-width: 900px) {
  .header-actions { display: none !important; }
  .stats-grid { grid-template-columns: 1fr 1fr !important; }
  .stat-card { padding: 14px !important; flex-direction: column-reverse; align-items: flex-start !important; }
  .dashboard-page { padding: 22px 16px; }
  .dashboard-header { flex-wrap: wrap; }
}

.dashboard-page {

  min-height: 100vh;

  padding: 35px 40px;

}

/* Header */

.dashboard-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 25px;

  margin-bottom: 30px;

}

.eyebrow {

  color: var(--color-primary);

  font-size: 11px;

  font-weight: 800;

}

.dashboard-header h1 {

  margin: 7px 0;

  font-size: 32px;

  font-weight: 800;

}

.dashboard-header p {

  margin: 0;

  color: var(--color-muted);

  font-size: 12px;

}

.header-actions {

  display: flex;

  align-items: center;

  gap: 12px;

}

.notification-btn {

  position: relative;

  width: 44px;

  height: 44px;

  border: 1px solid #eeeeee;

  border-radius: 13px;

  background: #ffffff;

  cursor: pointer;

}

.notification-btn span {

  position: absolute;

  top: 8px;

  right: 9px;

  width: 7px;

  height: 7px;

  border-radius: 50%;

  background: #ff5a67;

}

.user-avatar {

  width: 44px;

  height: 44px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 50%;

  background: #eeeaff;

  color: var(--color-primary);

  font-size: 14px;

  font-weight: 800;

}

/* Stats */

.stats-grid {

  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 16px;

  margin-bottom: 22px;

}

.stat-card {

  min-height: 110px;

  display: flex;

  align-items: center;

  gap: 15px;

  padding: 20px;

  border: 1px solid #eeeeee;

  border-radius: 18px;

  background: #ffffff;

}

.stat-icon {

  width: 48px;

  height: 48px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 14px;

  background: #f0eeff;

  font-size: 22px;

}

.stat-card > div:last-child {

  display: flex;

  flex-direction: column;

  gap: 5px;

}

.stat-card span {

  color: var(--color-muted);

  font-size: 10px;

}

.stat-card strong {

  font-size: 25px;

  font-weight: 800;

}

/* Main Grid */

.dashboard-grid {

  display: grid;

  grid-template-columns: 1.5fr 0.8fr;

  gap: 22px;

}

.content-card {

  padding: 24px;

  border: 1px solid #eeeeee;

  border-radius: 20px;

  background: #ffffff;

}

.card-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  margin-bottom: 22px;

}

.card-header h2 {

  margin: 0 0 5px;

  font-size: 18px;

  font-weight: 800;

}

.card-header p {

  margin: 0;

  color: var(--color-muted);

  font-size: 10px;

}

.see-all {

  color: var(--color-primary);

  font-size: 11px;

  font-weight: 700;

}

/* Wish List */

.wish-list {

  display: flex;

  flex-direction: column;

  gap: 12px;

}

.wish-item {

  display: flex;

  align-items: center;

  gap: 14px;

  padding: 15px;

  border-radius: 15px;

  background: #f9f9fc;

}

.wish-icon {

  width: 42px;

  height: 42px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 12px;

  background: #f0eeff;

  font-size: 18px;

}

.wish-info {

  flex: 1;

  min-width: 0;

  display: flex;

  flex-direction: column;

  gap: 5px;

}

.wish-info strong {

  overflow: hidden;

  color: var(--color-text);

  font-size: 12px;

  text-overflow: ellipsis;

  white-space: nowrap;

}

.wish-info > span {

  color: var(--color-muted);

  font-size: 9px;

}

.progress {

  width: 100%;

  height: 5px;

  margin-top: 3px;

  overflow: hidden;

  border-radius: 999px;

  background: #e6e6ee;

}

.progress-bar {

  height: 100%;

  border-radius: inherit;

  background: var(--color-primary);

}

.wish-status {

  min-width: 80px;

  display: flex;

  flex-direction: column;

  align-items: flex-end;

  gap: 5px;

}

.wish-status span {

  color: #dd8a25;

  font-size: 9px;

}

.wish-status span.success {

  color: #28915d;

}

.wish-status strong {

  color: var(--color-primary);

  font-size: 11px;

}

/* Quick Actions */

.quick-actions {

  display: flex;

  flex-direction: column;

  gap: 10px;

}

.quick-action {

  min-height: 65px;

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 12px 14px;

  border: 1px solid #eeeeee;

  border-radius: 14px;

  background: #ffffff;

  transition: 0.2s ease;

}

.quick-action:hover {

  border-color: #ddd9ff;

  transform: translateY(-2px);

}

.quick-action.primary {

  border-color: transparent;

  background: var(--color-primary);

  color: #ffffff;

}

.quick-action > span {

  width: 36px;

  height: 36px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 10px;

  background: #f0eeff;

  color: var(--color-primary);

  font-size: 17px;

}

.quick-action.primary > span {

  background: rgba(255,255,255,0.15);

  color: #ffffff;

}

.quick-action div {

  display: flex;

  flex-direction: column;

  gap: 4px;

}

.quick-action strong {

  font-size: 11px;

}

.quick-action small {

  color: var(--color-muted);

  font-size: 9px;

  line-height: 1.7;

}

.quick-action.primary small {

  color: rgba(255,255,255,0.78);

}

@media (max-width: 1100px) {

  .stats-grid {

    grid-template-columns: repeat(2, 1fr);

  }

  .dashboard-grid {

    grid-template-columns: 1fr;

  }

}

@media (max-width: 700px) {

  .dashboard-page {

    padding: 25px 15px;

  }

  .dashboard-header {

    align-items: flex-start;

  }

  .dashboard-header h1 {

    font-size: 25px;

  }

  .stats-grid {

    grid-template-columns: 1fr 1fr;

  }

  .wish-item {

    align-items: flex-start;

  }

  .wish-status {

    display: none;

  }

}

@media (max-width: 450px) {

  .stats-grid {

    grid-template-columns: 1fr;

  }

}



/* Live dashboard states and review statuses */
.wish-status span {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 999px;
  background: #fff5e8;
  color: #bd7a20;
  line-height: 1.6;
  text-align: center;
}

.wish-status span.success {
  background: #eef8f2;
  color: #28915d;
}

.wish-status span.danger {
  background: #fff0f1;
  color: #c94b5a;
}

.wish-status span.info {
  background: #eef4ff;
  color: #426cc4;
}

.wish-status strong {
  text-align: left;
  white-space: nowrap;
}

.dashboard-message {
  padding: 28px 18px;
  border: 1px dashed #dddddf;
  border-radius: 14px;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 2;
  text-align: center;
}

.dashboard-message p {
  margin: 0 0 12px;
}

.dashboard-message button,
.dashboard-message a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 13px;
  border: 0;
  border-radius: 9px;
  background: var(--color-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 700px) {
  .wish-status {
    display: flex;
    min-width: 0;
    align-items: flex-start;
  }

  .wish-status strong {
    font-size: 10px;
    white-space: normal;
  }
}

</style>
