<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'درگاه‌های پرداخت | پنل مدیریت' })

interface Gateway {
  id: number
  driver: 'zarinpal' | 'test'
  title: string
  merchant_masked: string | null
  has_merchant: boolean
  is_sandbox: boolean
  is_active: boolean
  is_default: boolean
  description: string | null
}

const { api } = useApi()
const { user, fetchUser } = useAuth()

const items = ref<Gateway[]>([])
const drivers = ref<string[]>(['zarinpal'])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const forbidden = ref(false)
const busyId = ref<number | null>(null)
const editingId = ref<number | 'new' | null>(null)
const saving = ref(false)
const confirmDeleteId = ref<number | null>(null)

const draft = reactive({
  driver: 'zarinpal',
  title: '',
  merchant_id: '',
  is_sandbox: false,
  is_active: true,
  is_default: false,
  description: '',
})

const driverLabels: Record<string, string> = { zarinpal: 'زرین‌پال', test: 'آزمایشی (بدون پول واقعی)' }
const editingGateway = computed(() => items.value.find(g => g.id === editingId.value))

async function load() {
  loading.value = true
  error.value = ''

  try {
    const res = await api<{ data: Gateway[], drivers: string[] }>('/api/admin/gateways')
    items.value = res.data
    drivers.value = res.drivers
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت درگاه‌ها انجام نشد.')
  } finally {
    loading.value = false
  }
}

function startNew() {
  editingId.value = 'new'
  Object.assign(draft, { driver: 'zarinpal', title: 'زرین‌پال', merchant_id: '', is_sandbox: false, is_active: true, is_default: !items.value.length, description: '' })
  notice.value = ''
}

function startEdit(g: Gateway) {
  editingId.value = g.id
  Object.assign(draft, { driver: g.driver, title: g.title, merchant_id: '', is_sandbox: g.is_sandbox, is_active: g.is_active, is_default: g.is_default, description: g.description || '' })
  notice.value = ''
}

async function save() {
  saving.value = true
  error.value = ''

  const body: Record<string, unknown> = {
    title: draft.title,
    merchant_id: draft.merchant_id.trim() || null,
    is_sandbox: draft.is_sandbox,
    is_active: draft.is_active,
    is_default: draft.is_default,
    description: draft.description || null,
  }

  try {
    if (editingId.value === 'new') {
      await api('/api/admin/gateways', { method: 'POST', body: { ...body, driver: draft.driver } })
      notice.value = 'درگاه اضافه شد.'
    } else {
      await api(`/api/admin/gateways/${editingId.value}`, { method: 'PUT', body })
      notice.value = 'درگاه ذخیره شد.'
    }

    editingId.value = null
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function toggle(g: Gateway, field: 'is_active' | 'is_default') {
  busyId.value = g.id
  error.value = ''

  try {
    await api(`/api/admin/gateways/${g.id}`, {
      method: 'PUT',
      body: { title: g.title, [field]: field === 'is_default' ? true : !g.is_active },
    })
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

async function remove(g: Gateway) {
  busyId.value = g.id

  try {
    await api(`/api/admin/gateways/${g.id}`, { method: 'DELETE' })
    notice.value = 'درگاه حذف شد.'
    confirmDeleteId.value = null
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busyId.value = null
  }
}

onMounted(async () => {
  if (!user.value) await fetchUser().catch(() => {})

  if (user.value?.role !== 'super_admin') {
    forbidden.value = true
    loading.value = false
    return
  }

  load()
})
</script>

<template>
  <section class="gateways-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">فقط مدیر ارشد</span>
        <h1>درگاه‌های پرداخت</h1>
        <p>درگاه اضافه کن، مرچنت‌کد را وارد کن و تعیین کن کدام درگاه پیش‌فرض پرداخت حمایت‌ها باشد.</p>
      </div>
      <button v-if="!forbidden" type="button" class="primary-btn" @click="startNew">+ درگاه جدید</button>
    </header>

    <p v-if="forbidden" class="msg bad">این بخش فقط برای مدیر ارشد در دسترس است.</p>

    <template v-else>
      <p v-if="notice" class="msg ok" role="status">{{ notice }}</p>
      <p v-if="error" class="msg bad" role="alert">{{ error }}</p>

      <form v-if="editingId !== null" class="form" @submit.prevent="save">
        <h2>{{ editingId === 'new' ? 'افزودن درگاه' : `ویرایش «${editingGateway?.title}»` }}</h2>

        <div class="grid">
          <label v-if="editingId === 'new'">
            نوع درگاه
            <select v-model="draft.driver">
              <option v-for="d in drivers" :key="d" :value="d">{{ driverLabels[d] || d }}</option>
            </select>
          </label>

          <label>
            عنوان نمایشی
            <input v-model="draft.title" type="text" maxlength="100" required>
          </label>

          <label v-if="draft.driver === 'zarinpal'" class="wide">
            مرچنت‌کد
            <input
              v-model="draft.merchant_id"
              type="text"
              dir="ltr"
              autocomplete="off"
              spellcheck="false"
              :placeholder="editingGateway?.merchant_masked ? `${editingGateway.merchant_masked} (برای حفظ مقدار فعلی خالی بگذار)` : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'"
              :required="editingId === 'new'"
            >
            <small>مرچنت‌کد رمزنگاری‌شده ذخیره می‌شود و بعد از ثبت دیگر کامل نمایش داده نمی‌شود.</small>
          </label>

          <label class="wide">
            توضیح (اختیاری)
            <input v-model="draft.description" type="text" maxlength="255">
          </label>
        </div>

        <div class="checks">
          <label v-if="draft.driver === 'zarinpal'"><input v-model="draft.is_sandbox" type="checkbox"> حالت آزمایشی (Sandbox) — پول واقعی جابه‌جا نمی‌شود</label>
          <label><input v-model="draft.is_active" type="checkbox"> فعال</label>
          <label><input v-model="draft.is_default" type="checkbox" :disabled="!draft.is_active"> درگاه پیش‌فرض</label>
        </div>

        <div class="form-actions">
          <button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'در حال ذخیره...' : 'ذخیره' }}</button>
          <button type="button" class="ghost-btn" @click="editingId = null">انصراف</button>
        </div>
      </form>

      <p v-if="loading" class="state">در حال دریافت...</p>

      <div v-else-if="!items.length" class="state">
        هنوز درگاهی تعریف نشده است و تا آن موقع کاربران نمی‌توانند پرداخت کنند.
        <button type="button" class="primary-btn" @click="startNew">افزودن اولین درگاه</button>
      </div>

      <ul v-else class="list">
        <li v-for="g in items" :key="g.id" :class="{ off: !g.is_active }">
          <div class="info">
            <strong>{{ g.title }}</strong>
            <div class="tags">
              <span class="tag">{{ driverLabels[g.driver] || g.driver }}</span>
              <span v-if="g.is_default" class="tag primary">پیش‌فرض</span>
              <span v-if="g.is_sandbox" class="tag warn">Sandbox</span>
              <span v-if="!g.is_active" class="tag">غیرفعال</span>
              <span v-if="g.driver === 'zarinpal' && g.merchant_masked" class="tag mono" dir="ltr">{{ g.merchant_masked }}</span>
            </div>
            <small v-if="g.description">{{ g.description }}</small>
          </div>

          <div class="ops">
            <button v-if="!g.is_default && g.is_active" type="button" class="link" :disabled="busyId === g.id" @click="toggle(g, 'is_default')">پیش‌فرض کن</button>
            <button type="button" class="link" :disabled="busyId === g.id" @click="toggle(g, 'is_active')">{{ g.is_active ? 'غیرفعال' : 'فعال' }}</button>
            <button type="button" class="link" @click="startEdit(g)">ویرایش</button>
            <template v-if="confirmDeleteId === g.id">
              <button type="button" class="link danger" :disabled="busyId === g.id" @click="remove(g)">حذف شود؟ بله</button>
              <button type="button" class="link" @click="confirmDeleteId = null">خیر</button>
            </template>
            <button v-else type="button" class="link danger" @click="confirmDeleteId = g.id">حذف</button>
          </div>
        </li>
      </ul>

      <aside class="help">
        <strong>راهنما</strong>
        <p>مرچنت‌کد را از پنل زرین‌پال (بخش «درگاه‌های پرداخت») بردار. برای تست، حالت Sandbox را روشن کن؛ آدرس بازگشت پرداخت به‌صورت خودکار ساخته می‌شود.</p>
      </aside>
    </template>
  </section>
</template>

<style scoped>
.gateways-page { padding: 34px; max-width: 980px; display: grid; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
h1 { margin: 6px 0; font-size: 28px; }
h2 { margin: 0; font-size: 17px; }
p { margin: 0; color: #64748b; }
.primary-btn { border: 0; background: var(--color-primary); color: #fff; padding: 11px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
.primary-btn:disabled { opacity: .5; }
.ghost-btn { border: 1px solid #e5e7eb; background: #fff; padding: 11px 18px; border-radius: 12px; cursor: pointer; font-family: inherit; }
.msg { padding: 10px 14px; border-radius: 12px; font-size: 14px; }
.msg.ok { background: #f0fdf4; color: #166534; } .msg.bad { background: #fef2f2; color: #b91c1c; }
.form { background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 22px; display: grid; gap: 16px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
.grid .wide { grid-column: 1 / -1; }
.grid small { color: #94a3b8; font-weight: 400; }
input[type=text], select { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 12px; font-family: inherit; font-size: 14px; background: #fff; }
.checks { display: grid; gap: 8px; font-size: 14px; }
.checks label { display: flex; gap: 8px; align-items: center; }
.form-actions { display: flex; gap: 8px; }
.state { background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; display: grid; gap: 12px; justify-items: center; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.list li { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: center; }
.list li.off { opacity: .65; }
.info { display: grid; gap: 8px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { background: #f1f5f9; color: #475569; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
.tag.primary { background: #ede9fe; color: #6d28d9; } .tag.warn { background: #fef3c7; color: #92400e; } .tag.mono { font-family: monospace; }
small { color: #94a3b8; }
.ops { display: flex; gap: 10px; flex-wrap: wrap; }
.link { border: 0; background: none; color: var(--color-primary); cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 700; padding: 4px; }
.link.danger { color: #dc2626; }
.help { background: #f8fafc; border-radius: 14px; padding: 14px 16px; font-size: 13px; }
.help strong { display: block; margin-bottom: 4px; }
@media (max-width: 640px) { .gateways-page { padding: 20px 16px; } .grid { grid-template-columns: 1fr; } }
</style>
