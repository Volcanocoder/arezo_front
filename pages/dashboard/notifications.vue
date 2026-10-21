<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({ title: 'اعلان‌ها | آرزو' })

interface NotificationItem {
  id: number
  title: string
  body: string
  type: 'info' | 'success' | 'warning'
  link: string | null
  is_broadcast: boolean
  is_read: boolean
  created_at: string
}

interface NotificationPage {
  data: NotificationItem[]
  current_page: number
  last_page: number
  total: number
  unread_count: number
}

const { api } = useApi()
const unread = useUnread()

const filter = ref<'all' | 'unread'>('all')
const page = ref(1)
const items = ref<NotificationItem[]>([])
const lastPage = ref(1)
const total = ref(0)
const loading = ref(true)
const error = ref('')

const icons: Record<string, string> = { info: '🔔', success: '✅', warning: '⚠️' }

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<NotificationPage>('/api/notifications', {
      query: { filter: filter.value, page: page.value },
    })

    items.value = res.data
    lastPage.value = res.last_page
    total.value = res.total
    unread.count.value = res.unread_count
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت اعلان‌ها انجام نشد.')
  } finally {
    loading.value = false
  }
}

async function open(item: NotificationItem) {
  if (!item.is_read) {
    item.is_read = true

    try {
      const res = await api<{ unread_count: number }>(`/api/notifications/${item.id}/read`, { method: 'POST' })
      unread.count.value = res.unread_count
    } catch {
      item.is_read = false
    }
  }

  if (item.link) {
    if (item.link.startsWith('/')) {
      await navigateTo(item.link)
    } else {
      window.open(item.link, '_blank', 'noopener')
    }
  }
}

async function markAll() {
  try {
    await api('/api/notifications/read-all', { method: 'POST' })
    unread.count.value = 0
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  }
}

function setFilter(value: 'all' | 'unread') {
  filter.value = value
  page.value = 1
  load()
}

function go(p: number) {
  page.value = p
  load()
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

onMounted(load)
</script>

<template>
  <section class="notifications-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">اعلان‌ها</span>
        <h1>اعلان‌های من</h1>
        <p>
          <template v-if="unread.count.value">{{ unread.count.value.toLocaleString('fa-IR') }} اعلان خوانده‌نشده داری.</template>
          <template v-else>همه اعلان‌ها را خوانده‌ای.</template>
        </p>
      </div>

      <button class="mark-all-btn" type="button" :disabled="!unread.count.value" @click="markAll">
        علامت‌گذاری همه به‌عنوان خوانده‌شده
      </button>
    </header>

    <div class="tabs">
      <button type="button" :class="{ active: filter === 'all' }" @click="setFilter('all')">همه</button>
      <button type="button" :class="{ active: filter === 'unread' }" @click="setFilter('unread')">
        خوانده‌نشده
        <span v-if="unread.count.value" class="badge">{{ unread.count.value.toLocaleString('fa-IR') }}</span>
      </button>
    </div>

    <p v-if="error" class="state error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="state">در حال دریافت...</p>
    <p v-else-if="!items.length" class="state">
      {{ filter === 'unread' ? 'اعلان خوانده‌نشده‌ای نداری.' : 'هنوز اعلانی برایت ارسال نشده است.' }}
    </p>

    <ul v-else class="list">
      <li v-for="n in items" :key="n.id">
        <button type="button" class="item" :class="[n.type, { unread: !n.is_read }]" @click="open(n)">
          <span class="ico" aria-hidden="true">{{ icons[n.type] }}</span>
          <span class="content">
            <strong>{{ n.title }}</strong>
            <span class="body">{{ n.body }}</span>
            <small>
              {{ formatDate(n.created_at) }}
              <em v-if="n.is_broadcast">اطلاعیه عمومی</em>
              <em v-if="n.link">مشاهده ←</em>
            </small>
          </span>
          <span v-if="!n.is_read" class="dot" aria-label="خوانده‌نشده" />
        </button>
      </li>
    </ul>

    <nav v-if="lastPage > 1" class="pager" aria-label="صفحه‌بندی">
      <button type="button" :disabled="page <= 1" @click="go(page - 1)">قبلی</button>
      <span>صفحه {{ page.toLocaleString('fa-IR') }} از {{ lastPage.toLocaleString('fa-IR') }}</span>
      <button type="button" :disabled="page >= lastPage" @click="go(page + 1)">بعدی</button>
    </nav>
  </section>
</template>

<style scoped>
.notifications-page { max-width: 860px; margin: 0 auto; display: grid; gap: 18px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: #7c5cff; font-weight: 800; font-size: 13px; }
h1 { margin: 4px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.mark-all-btn { border: 1px solid #ddd6fe; background: #f5f3ff; color: #6d28d9; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.mark-all-btn:disabled { opacity: .45; cursor: default; }
.tabs { display: flex; gap: 8px; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; display: inline-flex; gap: 6px; align-items: center; }
.tabs button.active { background: #7c5cff; border-color: #7c5cff; color: #fff; }
.badge { background: #ef4444; color: #fff; border-radius: 999px; font-size: 11px; padding: 1px 7px; }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; }
.state.error { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.item { width: 100%; text-align: right; display: flex; gap: 14px; align-items: flex-start; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; cursor: pointer; font-family: inherit; position: relative; transition: box-shadow .15s, border-color .15s; }
.item:hover { box-shadow: 0 6px 20px rgba(15, 23, 42, .07); border-color: #c4b5fd; }
.item.unread { background: #faf8ff; border-color: #ddd6fe; }
.ico { font-size: 22px; line-height: 1.2; }
.content { display: grid; gap: 4px; flex: 1; }
.content strong { color: #0f172a; }
.body { color: #475569; line-height: 1.9; font-size: 14px; white-space: pre-line; }
small { color: #94a3b8; display: flex; gap: 10px; flex-wrap: wrap; }
small em { font-style: normal; color: #7c5cff; font-weight: 700; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #7c5cff; margin-top: 6px; flex-shrink: 0; }
.item.success .ico { filter: none; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
.pager button:disabled { opacity: .4; cursor: default; }
</style>
