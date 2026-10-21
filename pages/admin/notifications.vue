<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'اعلان‌ها و اطلاعیه‌ها | آرزو' })

type NoticeType = 'info' | 'success' | 'warning'

interface SentNotification {
  id: number
  title: string
  body: string
  type: NoticeType
  link: string | null
  audience: 'all' | 'user'
  recipient: { id: number, name: string, mobile: string } | null
  reads_count: number
  recipients_count: number
  created_at: string
}

interface UserOption {
  id: number
  name: string
  mobile: string | null
}

const { api } = useApi()
const route = useRoute()
const fa = (value: number) => new Intl.NumberFormat('fa-IR').format(value)

const typeLabels: Record<NoticeType, string> = { info: 'اطلاعیه', success: 'خبر خوب', warning: 'هشدار' }

const form = reactive({
  audience: 'all' as 'all' | 'user',
  title: '',
  body: '',
  type: 'info' as NoticeType,
  link: '',
})

const userQuery = ref('')
const userResults = ref<UserOption[]>([])
const selectedUser = ref<UserOption | null>(null)
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const sending = ref(false)
const notice = ref('')
const noticeIsError = ref(false)

const history = ref<SentNotification[]>([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(true)
const loadError = ref('')
const confirmDeleteId = ref<number | null>(null)

function flash(text: string, isError = false) {
  notice.value = text
  noticeIsError.value = isError
}

function onUserInput() {
  selectedUser.value = null

  if (searchTimer) clearTimeout(searchTimer)

  const q = userQuery.value.trim()

  if (q.length < 2) {
    userResults.value = []
    return
  }

  searchTimer = setTimeout(async () => {
    searching.value = true

    try {
      const result = await api<{ data: UserOption[] }>('/api/admin/users', { query: { search: q } })
      userResults.value = result.data.slice(0, 6)
    } catch {
      userResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

function pickUser(user: UserOption) {
  selectedUser.value = user
  userQuery.value = `${user.name} (${user.mobile ?? '—'})`
  userResults.value = []
}

async function send() {
  notice.value = ''

  if (form.audience === 'user' && !selectedUser.value) {
    flash('یک کاربر را از فهرست پیشنهادی انتخاب کن.', true)
    return
  }

  if (form.audience === 'all' && !window.confirm('این اطلاعیه برای همه کاربران ارسال می‌شود. ادامه می‌دهی؟')) {
    return
  }

  sending.value = true

  try {
    const result = await api<{ message: string }>('/api/admin/notifications', {
      method: 'POST',
      body: {
        audience: form.audience,
        user_id: form.audience === 'user' ? selectedUser.value?.id : null,
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        link: form.link.trim() || null,
      },
    })

    flash(result.message)
    form.title = ''
    form.body = ''
    form.link = ''
    userQuery.value = ''
    selectedUser.value = null
    await load(1)
  } catch (error) {
    flash(apiErrorMessage(error), true)
  } finally {
    sending.value = false
  }
}

async function load(target = 1) {
  loading.value = true
  loadError.value = ''

  try {
    const result = await api<{ data: SentNotification[], current_page: number, last_page: number }>('/api/admin/notifications', {
      query: { page: target },
    })

    history.value = result.data
    page.value = result.current_page
    lastPage.value = result.last_page
  } catch (error) {
    loadError.value = apiErrorMessage(error, 'دریافت سابقه ناموفق بود.')
  } finally {
    loading.value = false
  }
}

async function remove(item: SentNotification) {
  try {
    await api(`/api/admin/notifications/${item.id}`, { method: 'DELETE' })
    confirmDeleteId.value = null
    flash('اعلان حذف شد.')
    await load(page.value)
  } catch (error) {
    flash(apiErrorMessage(error), true)
  }
}

onMounted(async () => {
  // از صفحه کاربران می‌توان مستقیم برای یک کاربر اعلان نوشت: /admin/notifications?user=12&name=...
  const userId = Number(route.query.user)

  if (userId > 0) {
    form.audience = 'user'
    selectedUser.value = { id: userId, name: String(route.query.name ?? `کاربر ${userId}`), mobile: route.query.mobile ? String(route.query.mobile) : null }
    userQuery.value = `${selectedUser.value.name} (${selectedUser.value.mobile ?? '—'})`
  }

  await load(1)
})
</script>

<template>
  <main class="notif-admin" dir="rtl">
    <header class="page-header">
      <span class="eyebrow">مرکز مدیریت</span>
      <h1>اعلان‌ها و اطلاعیه‌ها</h1>
      <p>برای همه کاربران یا یک کاربر مشخص پیام بفرست. نتیجه بررسی آرزوها به‌صورت خودکار برای صاحب آرزو اعلان می‌شود.</p>
    </header>

    <div class="layout">
      <form class="panel composer" @submit.prevent="send">
        <h2>ارسال اعلان جدید</h2>

        <fieldset class="audience">
          <legend>گیرنده</legend>
          <label :class="{ active: form.audience === 'all' }">
            <input v-model="form.audience" type="radio" value="all" />
            همه کاربران
          </label>
          <label :class="{ active: form.audience === 'user' }">
            <input v-model="form.audience" type="radio" value="user" />
            یک کاربر
          </label>
        </fieldset>

        <div v-if="form.audience === 'user'" class="field user-picker">
          <label for="user-search">جستجوی کاربر (نام یا موبایل)</label>
          <input id="user-search" v-model="userQuery" type="search" autocomplete="off" placeholder="حداقل ۲ حرف..." @input="onUserInput" />
          <ul v-if="userResults.length" class="results" role="listbox">
            <li v-for="user in userResults" :key="user.id" role="option">
              <button type="button" @click="pickUser(user)">
                <strong>{{ user.name }}</strong>
                <small dir="ltr">{{ user.mobile }}</small>
              </button>
            </li>
          </ul>
          <small v-else-if="searching" class="hint">در حال جستجو...</small>
          <small v-if="selectedUser" class="picked">✓ انتخاب شد: {{ selectedUser.name }}</small>
        </div>

        <div class="field">
          <label for="n-title">عنوان</label>
          <input id="n-title" v-model="form.title" type="text" maxlength="150" required />
        </div>

        <div class="field">
          <label for="n-body">متن پیام</label>
          <textarea id="n-body" v-model="form.body" rows="5" maxlength="2000" required></textarea>
        </div>

        <div class="two">
          <div class="field">
            <label for="n-type">نوع</label>
            <select id="n-type" v-model="form.type">
              <option v-for="(label, key) in typeLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>

          <div class="field">
            <label for="n-link">لینک (اختیاری)</label>
            <input id="n-link" v-model="form.link" type="text" dir="ltr" placeholder="/wishes یا https://..." />
          </div>
        </div>

        <p v-if="notice" class="notice" :class="{ error: noticeIsError }" :role="noticeIsError ? 'alert' : 'status'">{{ notice }}</p>

        <button type="submit" class="primary-btn" :disabled="sending">
          {{ sending ? 'در حال ارسال...' : (form.audience === 'all' ? 'ارسال برای همه' : 'ارسال برای این کاربر') }}
        </button>
      </form>

      <section class="panel history">
        <h2>سابقه ارسال‌ها</h2>

        <p v-if="loading" class="state" role="status">در حال دریافت...</p>
        <p v-else-if="loadError" class="state error" role="alert">{{ loadError }}</p>
        <p v-else-if="!history.length" class="state">هنوز اعلانی ارسال نشده است.</p>

        <ul v-else class="items">
          <li v-for="item in history" :key="item.id" class="item" :class="item.type">
            <div class="item-top">
              <span class="chip" :class="item.type">{{ typeLabels[item.type] }}</span>
              <span class="aud">{{ item.audience === 'all' ? 'همه کاربران' : (item.recipient?.name || 'کاربر حذف‌شده') }}</span>
              <time class="when">{{ formatBlogDate(item.created_at) }}</time>
            </div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.body }}</p>
            <div class="item-bottom">
              <span class="reads">{{ fa(item.reads_count) }} از {{ fa(item.recipients_count) }} خوانده‌اند</span>
              <template v-if="confirmDeleteId === item.id">
                <button type="button" class="link danger" @click="remove(item)">حذف شود؟ بله</button>
                <button type="button" class="link" @click="confirmDeleteId = null">خیر</button>
              </template>
              <button v-else type="button" class="link danger" @click="confirmDeleteId = item.id">حذف</button>
            </div>
          </li>
        </ul>

        <nav v-if="lastPage > 1" class="pager" aria-label="صفحه‌بندی">
          <button type="button" class="ghost-btn" :disabled="page <= 1" @click="load(page - 1)">قبلی</button>
          <span>{{ page }} / {{ lastPage }}</span>
          <button type="button" class="ghost-btn" :disabled="page >= lastPage" @click="load(page + 1)">بعدی</button>
        </nav>
      </section>
    </div>
  </main>
</template>

<style scoped>
.notif-admin { padding: 34px; }
.page-header { margin-bottom: 24px; }
.eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.page-header h1 { margin: 7px 0; font-size: 30px; font-weight: 800; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 2; max-width: 720px; }
.layout { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 20px; align-items: start; }
.panel { padding: 22px; border: 1px solid #eee; border-radius: 16px; background: #fff; display: flex; flex-direction: column; gap: 16px; }
.panel h2 { margin: 0; font-size: 17px; font-weight: 800; }
.audience { display: flex; gap: 10px; margin: 0; padding: 0; border: 0; }
.audience legend { margin-bottom: 8px; font-size: 13px; font-weight: 700; }
.audience label { flex: 1; display: flex; align-items: center; gap: 8px; padding: 11px 14px; border: 1px solid #e0e0e8; border-radius: 11px; font-size: 13px; cursor: pointer; }
.audience label.active { border-color: var(--color-primary); background: #f5f3ff; }
.field { display: flex; flex-direction: column; gap: 7px; position: relative; }
.field label { font-size: 13px; font-weight: 700; }
input[type=text], input[type=search], select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #e0e0e8; border-radius: 10px; background: #fff; font-family: inherit; font-size: 14px; line-height: 1.8; color: var(--color-text); }
textarea { resize: vertical; }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.results { position: absolute; top: 100%; inset-inline: 0; z-index: 5; margin: 4px 0 0; padding: 6px; list-style: none; border: 1px solid #e0e0e8; border-radius: 12px; background: #fff; box-shadow: 0 12px 30px rgba(40, 30, 100, .12); }
.results button { width: 100%; display: flex; justify-content: space-between; gap: 10px; padding: 9px 10px; border: 0; border-radius: 8px; background: transparent; font-family: inherit; font-size: 13px; text-align: start; cursor: pointer; }
.results button:hover { background: #f5f3ff; }
.results small { color: var(--color-muted); }
.hint { color: var(--color-muted); font-size: 12px; }
.picked { color: #278451; font-size: 12px; font-weight: 700; }
.primary-btn { min-height: 46px; border: 0; border-radius: 11px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.primary-btn:hover:not(:disabled) { background: var(--color-primary-dark); }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.ghost-btn { padding: 8px 16px; border: 1px solid #e0e0e8; border-radius: 10px; background: #fff; font-family: inherit; font-size: 13px; cursor: pointer; }
.ghost-btn:disabled { opacity: .4; cursor: not-allowed; }
.notice { margin: 0; padding: 10px 12px; border-radius: 10px; background: #edf8f1; color: #278451; font-size: 13px; }
.notice.error { background: #fff1f1; color: #c0392b; }
.state { margin: 0; padding: 40px 10px; border: 1px dashed #ddd; border-radius: 12px; color: var(--color-muted); font-size: 14px; text-align: center; }
.state.error { border-color: #f1c5c9; color: #c0392b; }
.items { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
.item { padding: 14px 16px; border: 1px solid #eee; border-inline-start: 4px solid #6d5dfc; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; }
.item.success { border-inline-start-color: #2fa66a; }
.item.warning { border-inline-start-color: #e0a02c; }
.item-top { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 12px; color: var(--color-muted); }
.chip { padding: 4px 9px; border-radius: 999px; background: #f0eeff; color: var(--color-primary); font-size: 11px; font-weight: 700; }
.chip.success { background: #eaf8f0; color: #278750; }
.chip.warning { background: #fff6e5; color: #b7791f; }
.aud { font-weight: 700; color: var(--color-text); }
.when { margin-inline-start: auto; }
.item strong { font-size: 14px; }
.item p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 2; white-space: pre-line; }
.item-bottom { display: flex; align-items: center; gap: 14px; font-size: 12px; }
.reads { margin-inline-end: auto; color: var(--color-muted); }
.link { padding: 0; border: 0; background: transparent; color: var(--color-primary); font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.link.danger { color: #c0392b; }
.pager { display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 13px; }
@media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .notif-admin { padding: 20px 14px; } .two { grid-template-columns: 1fr; } }
</style>
