<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'پیام‌های تماس | پنل مدیریت' })

interface ContactMsg {
  id: number
  name: string
  contact: string
  subject: string | null
  message: string
  read_at: string | null
  created_at: string
}

const { api } = useApi()
const items = ref<ContactMsg[]>([])
const filter = ref<'all' | 'unread'>('unread')
const page = ref(1)
const lastPage = ref(1)
const unread = ref(0)
const loading = ref(true)
const error = ref('')
const openId = ref<number | null>(null)

const date = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v))

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<{ data: ContactMsg[], last_page: number, unread_count: number }>('/api/admin/contact-messages', {
      query: { filter: filter.value, page: page.value },
    })
    items.value = res.data
    lastPage.value = res.last_page
    unread.value = res.unread_count
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت پیام‌ها انجام نشد.')
  } finally {
    loading.value = false
  }
}

function setFilter(f: 'all' | 'unread') {
  filter.value = f
  page.value = 1
  load()
}

async function toggleOpen(m: ContactMsg) {
  openId.value = openId.value === m.id ? null : m.id

  if (openId.value === m.id && !m.read_at) {
    try {
      await api(`/api/admin/contact-messages/${m.id}/read`, { method: 'POST' })
      m.read_at = new Date().toISOString()
      unread.value = Math.max(0, unread.value - 1)
    } catch {
      // خواندن پیام نباید به خاطر خطای علامت‌گذاری متوقف شود.
    }
  }
}

async function remove(m: ContactMsg) {
  if (!window.confirm('این پیام حذف شود؟')) return

  try {
    await api(`/api/admin/contact-messages/${m.id}`, { method: 'DELETE' })
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <section class="messages-page">
    <header>
      <span class="eyebrow">تماس با ما</span>
      <h1>پیام‌های دریافتی</h1>
      <p>پیام‌هایی که کاربران از فرم «تماس با ما» فرستاده‌اند. برای پاسخ، از راه تماسی که نوشته‌اند استفاده کن.</p>
    </header>

    <div class="tabs">
      <button type="button" :class="{ active: filter === 'unread' }" @click="setFilter('unread')">
        خوانده‌نشده <span v-if="unread" class="n">{{ unread.toLocaleString('fa-IR') }}</span>
      </button>
      <button type="button" :class="{ active: filter === 'all' }" @click="setFilter('all')">همه</button>
    </div>

    <p v-if="error" class="state bad" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="state">در حال دریافت...</p>
    <p v-else-if="!items.length" class="state">پیامی نیست.</p>

    <ul v-else class="list">
      <li v-for="m in items" :key="m.id" :class="{ unread: !m.read_at }">
        <button type="button" class="head" @click="toggleOpen(m)">
          <strong>{{ m.subject || 'بدون موضوع' }}</strong>
          <span>{{ m.name }} · {{ date(m.created_at) }}</span>
        </button>
        <div v-if="openId === m.id" class="body">
          <p>{{ m.message }}</p>
          <div class="foot">
            <span dir="ltr">{{ m.contact }}</span>
            <button type="button" class="del" @click="remove(m)">حذف</button>
          </div>
        </div>
      </li>
    </ul>

    <nav v-if="lastPage > 1" class="pager">
      <button type="button" :disabled="page <= 1" @click="page--; load()">قبلی</button>
      <span>صفحه {{ page.toLocaleString('fa-IR') }} از {{ lastPage.toLocaleString('fa-IR') }}</span>
      <button type="button" :disabled="page >= lastPage" @click="page++; load()">بعدی</button>
    </nav>
  </section>
</template>

<style scoped>
.messages-page { padding: 34px; max-width: 860px; display: grid; gap: 16px; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 6px 0; font-size: 28px; }
p { margin: 0; color: #64748b; }
.tabs { display: flex; gap: 8px; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; display: inline-flex; gap: 8px; }
.tabs .active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.n { background: #ef4444; color: #fff; border-radius: 999px; padding: 0 7px; font-size: 11px; }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; }
.state.bad { color: #b91c1c; background: #fef2f2; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.list li { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
.list li.unread { border-color: #c4b5fd; background: #faf8ff; }
.head { width: 100%; text-align: right; border: 0; background: none; padding: 14px 16px; cursor: pointer; font-family: inherit; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.head span { color: #94a3b8; font-size: 13px; }
.body { padding: 0 16px 14px; display: grid; gap: 10px; }
.body p { white-space: pre-line; color: #334155; line-height: 2; }
.foot { display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 13px; }
.del { border: 0; background: none; color: #dc2626; cursor: pointer; font-family: inherit; font-weight: 700; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 14px; cursor: pointer; font-family: inherit; }
@media (max-width: 640px) { .messages-page { padding: 20px 16px; } }
</style>
