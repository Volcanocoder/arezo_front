<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'دسته‌بندی‌ها | آرزو' })

type CategoryType = 'wish' | 'blog'

interface AdminCategory {
  id: number
  type: CategoryType
  name: string
  icon: string | null
  color: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  usage_count: number
}

const { api } = useApi()
const fa = (value: number) => new Intl.NumberFormat('fa-IR').format(value)

const type = ref<CategoryType>('wish')
const items = ref<AdminCategory[]>([])
const loading = ref(true)
const loadError = ref('')
const notice = ref('')
const noticeIsError = ref(false)
const busyId = ref<number | null>(null)

const editingId = ref<number | 'new' | null>(null)
const draft = reactive({ name: '', icon: '', color: '#EEF0FF', description: '', is_active: true })
const saving = ref(false)
const confirmDeleteId = ref<number | null>(null)

const palette = ['#EEF0FF', '#FFF0F3', '#FFF6E8', '#F0F9FF', '#F4F0FF', '#EEF8F2', '#FDF2F8', '#FEFCE8']

function flash(text: string, isError = false) {
  notice.value = text
  noticeIsError.value = isError
}

async function load() {
  loading.value = true
  loadError.value = ''

  try {
    const result = await api<{ data: AdminCategory[] }>('/api/admin/categories', { query: { type: type.value } })
    items.value = result.data
  } catch (error) {
    loadError.value = apiErrorMessage(error, 'دریافت دسته‌بندی‌ها ناموفق بود.')
  } finally {
    loading.value = false
  }
}

function switchType(next: CategoryType) {
  if (type.value === next) return
  type.value = next
  editingId.value = null
  notice.value = ''
  load()
}

function startNew() {
  Object.assign(draft, { name: '', icon: '', color: '#EEF0FF', description: '', is_active: true })
  editingId.value = 'new'
}

function startEdit(item: AdminCategory) {
  Object.assign(draft, {
    name: item.name,
    icon: item.icon ?? '',
    color: item.color ?? '#EEF0FF',
    description: item.description ?? '',
    is_active: item.is_active,
  })
  editingId.value = item.id
}

async function save() {
  if (!draft.name.trim()) {
    flash('نام دسته‌بندی را وارد کن.', true)
    return
  }

  saving.value = true
  notice.value = ''

  const body = {
    name: draft.name.trim(),
    icon: draft.icon.trim() || null,
    color: type.value === 'wish' ? draft.color : null,
    description: draft.description.trim() || null,
    is_active: draft.is_active,
  }

  try {
    if (editingId.value === 'new') {
      await api('/api/admin/categories', { method: 'POST', body: { ...body, type: type.value } })
      flash('دسته‌بندی ساخته شد.')
    } else {
      await api(`/api/admin/categories/${editingId.value}`, { method: 'PUT', body })
      flash('دسته‌بندی به‌روز شد.')
    }

    editingId.value = null
    await load()
  } catch (error) {
    flash(apiErrorMessage(error), true)
  } finally {
    saving.value = false
  }
}

async function toggleActive(item: AdminCategory) {
  busyId.value = item.id

  try {
    await api(`/api/admin/categories/${item.id}`, {
      method: 'PUT',
      body: {
        name: item.name,
        icon: item.icon,
        color: item.color,
        description: item.description,
        is_active: !item.is_active,
      },
    })
    item.is_active = !item.is_active
    flash(item.is_active ? 'دسته‌بندی فعال شد.' : 'دسته‌بندی غیرفعال شد و در فرم‌ها نمایش داده نمی‌شود.')
  } catch (error) {
    flash(apiErrorMessage(error), true)
  } finally {
    busyId.value = null
  }
}

async function move(index: number, direction: -1 | 1) {
  const target = index + direction

  if (target < 0 || target >= items.value.length) return

  const next = [...items.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  items.value = next

  try {
    await api('/api/admin/categories/reorder', {
      method: 'PUT',
      body: { type: type.value, ids: next.map(item => item.id) },
    })
  } catch (error) {
    flash(apiErrorMessage(error), true)
    await load()
  }
}

async function remove(item: AdminCategory) {
  busyId.value = item.id

  try {
    await api(`/api/admin/categories/${item.id}`, { method: 'DELETE' })
    flash('دسته‌بندی حذف شد.')
    confirmDeleteId.value = null
    await load()
  } catch (error) {
    flash(apiErrorMessage(error), true)
    confirmDeleteId.value = null
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="categories-page" dir="rtl">
    <header class="page-header">
      <div>
        <span class="eyebrow">مرکز مدیریت</span>
        <h1>دسته‌بندی‌ها</h1>
        <p>دسته‌های آرزو و مقاله را بساز، ویرایش کن و ترتیب نمایش آن‌ها را تعیین کن.</p>
      </div>
      <button type="button" class="primary-btn" @click="startNew">+ دسته‌بندی جدید</button>
    </header>

    <div class="tabs" role="tablist" aria-label="نوع دسته‌بندی">
      <button type="button" role="tab" :aria-selected="type === 'wish'" :class="{ active: type === 'wish' }" @click="switchType('wish')">دسته‌های آرزو</button>
      <button type="button" role="tab" :aria-selected="type === 'blog'" :class="{ active: type === 'blog' }" @click="switchType('blog')">دسته‌های وبلاگ</button>
    </div>

    <p v-if="notice" class="notice" :class="{ error: noticeIsError }" :role="noticeIsError ? 'alert' : 'status'">{{ notice }}</p>

    <form v-if="editingId !== null" class="editor" @submit.prevent="save">
      <h2>{{ editingId === 'new' ? 'دسته‌بندی جدید' : 'ویرایش دسته‌بندی' }}</h2>

      <div class="grid">
        <label class="field">
          <span>نام</span>
          <input v-model="draft.name" type="text" maxlength="80" required />
        </label>

        <label class="field">
          <span>آیکن (ایموجی)</span>
          <input v-model="draft.icon" type="text" maxlength="8" placeholder="🎓" />
        </label>

        <label class="field wide">
          <span>توضیح کوتاه</span>
          <input v-model="draft.description" type="text" maxlength="200" />
        </label>

        <div v-if="type === 'wish'" class="field wide">
          <span>رنگ پس‌زمینه کارت</span>
          <div class="swatches">
            <button
              v-for="color in palette"
              :key="color"
              type="button"
              class="swatch"
              :class="{ selected: draft.color === color }"
              :style="{ backgroundColor: color }"
              :aria-label="`رنگ ${color}`"
              :aria-pressed="draft.color === color"
              @click="draft.color = color"
            ></button>
            <input v-model="draft.color" type="color" class="color-input" aria-label="رنگ دلخواه" />
          </div>
        </div>
      </div>

      <label class="check">
        <input v-model="draft.is_active" type="checkbox" />
        فعال (در فرم‌ها و فیلترها نمایش داده شود)
      </label>

      <div class="editor-actions">
        <button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'در حال ذخیره...' : 'ذخیره' }}</button>
        <button type="button" class="ghost-btn" @click="editingId = null">انصراف</button>
      </div>
    </form>

    <div v-if="loading" class="state" role="status">در حال دریافت...</div>
    <div v-else-if="loadError" class="state error" role="alert">
      {{ loadError }}
      <button type="button" class="primary-btn small" @click="load">تلاش دوباره</button>
    </div>
    <div v-else-if="!items.length" class="state">هنوز دسته‌بندی‌ای نساخته‌ای.</div>

    <ul v-else class="list">
      <li v-for="(item, index) in items" :key="item.id" class="row" :class="{ inactive: !item.is_active }">
        <span v-if="type === 'wish'" class="badge" :style="{ backgroundColor: item.color || '#EEF0FF' }" aria-hidden="true">
          {{ item.icon || '•' }}
        </span>
        <span v-else class="badge plain" aria-hidden="true">{{ item.icon || '#' }}</span>

        <div class="info">
          <strong>{{ item.name }}</strong>
          <small>{{ item.description || 'بدون توضیح' }}</small>
        </div>

        <span class="usage">{{ fa(item.usage_count) }} {{ type === 'wish' ? 'آرزو' : 'مقاله' }}</span>

        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="item.is_active"
          :aria-label="`فعال بودن ${item.name}`"
          :disabled="busyId === item.id"
          @click="toggleActive(item)"
        >
          <span></span>
        </button>

        <div class="row-actions">
          <button type="button" class="icon-btn" :disabled="index === 0" aria-label="انتقال به بالا" @click="move(index, -1)">↑</button>
          <button type="button" class="icon-btn" :disabled="index === items.length - 1" aria-label="انتقال به پایین" @click="move(index, 1)">↓</button>
          <button type="button" class="link" @click="startEdit(item)">ویرایش</button>

          <template v-if="confirmDeleteId === item.id">
            <button type="button" class="link danger" :disabled="busyId === item.id" @click="remove(item)">حذف شود؟ بله</button>
            <button type="button" class="link" @click="confirmDeleteId = null">خیر</button>
          </template>
          <button v-else type="button" class="link danger" @click="confirmDeleteId = item.id">حذف</button>
        </div>
      </li>
    </ul>

    <p class="hint">
      اگر دسته‌ای در حال استفاده است، حذف نمی‌شود؛ آن را غیرفعال کن تا در فرم‌های جدید نمایش داده نشود. با تغییر نام یک دسته، نام آن در همه آرزوها و مقاله‌های قبلی هم به‌روز می‌شود.
    </p>
  </main>
</template>

<style scoped>
.categories-page { padding: 34px; max-width: 1000px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.page-header h1 { margin: 7px 0; font-size: 30px; font-weight: 800; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 13px; }
.primary-btn { min-height: 44px; padding: 0 18px; border: 0; border-radius: 11px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-btn.small { min-height: 38px; padding: 0 14px; font-size: 12px; }
.primary-btn:hover:not(:disabled) { background: var(--color-primary-dark); }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.ghost-btn { min-height: 44px; padding: 0 18px; border: 1px solid #e0e0e8; border-radius: 11px; background: #fff; font-family: inherit; font-size: 13px; cursor: pointer; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.tabs { display: inline-flex; gap: 6px; padding: 5px; margin-bottom: 20px; border: 1px solid #eee; border-radius: 13px; background: #fff; }
.tabs button { padding: 9px 18px; border: 0; border-radius: 9px; background: transparent; color: var(--color-muted); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.tabs button.active { background: var(--color-primary); color: #fff; }
.notice { margin: 0 0 14px; padding: 11px 14px; border-radius: 10px; background: #edf8f1; color: #278451; font-size: 13px; }
.notice.error { background: #fff1f1; color: #c0392b; }
.editor { margin-bottom: 22px; padding: 22px; border: 1px solid #dcd7ff; border-radius: 16px; background: #fcfcff; display: flex; flex-direction: column; gap: 16px; }
.editor h2 { margin: 0; font-size: 17px; font-weight: 800; }
.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 7px; font-size: 13px; }
.field.wide { grid-column: 1 / -1; }
.field > span { font-weight: 700; }
.field input[type=text] { height: 44px; padding: 0 12px; border: 1px solid #e0e0e8; border-radius: 10px; font-family: inherit; font-size: 14px; }
.swatches { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.swatch { width: 34px; height: 34px; border: 2px solid #e5e5ee; border-radius: 10px; cursor: pointer; }
.swatch.selected { border-color: var(--color-primary); box-shadow: 0 0 0 3px #e5e1ff; }
.color-input { width: 44px; height: 34px; padding: 0; border: 1px solid #e0e0e8; border-radius: 8px; background: #fff; cursor: pointer; }
.check { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.editor-actions { display: flex; gap: 10px; }
.state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 50px 20px; border: 1px dashed #ddd; border-radius: 16px; background: #fff; color: var(--color-muted); font-size: 14px; text-align: center; }
.state.error { border-color: #f1c5c9; color: #c0392b; }
.list { margin: 0; padding: 0; list-style: none; border: 1px solid #eee; border-radius: 16px; background: #fff; overflow: hidden; }
.row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #f0f0f4; }
.row:last-child { border-bottom: 0; }
.row.inactive { opacity: .6; }
.badge { width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 13px; font-size: 22px; }
.badge.plain { background: #f0eeff; color: var(--color-primary); font-weight: 800; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.info strong { font-size: 14px; }
.info small { color: var(--color-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.usage { flex-shrink: 0; padding: 5px 10px; border-radius: 999px; background: #f4f4f8; color: var(--color-muted); font-size: 12px; }
.switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; padding: 0; border: 0; border-radius: 999px; background: #d6d6df; cursor: pointer; transition: background .2s; }
.switch span { position: absolute; top: 3px; inset-inline-start: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: inset-inline-start .2s; }
.switch[aria-checked=true] { background: var(--color-primary); }
.switch[aria-checked=true] span { inset-inline-start: 21px; }
.row-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.icon-btn { width: 30px; height: 30px; border: 1px solid #e5e5ee; border-radius: 8px; background: #fff; cursor: pointer; }
.icon-btn:disabled { opacity: .35; cursor: not-allowed; }
.link { padding: 0; border: 0; background: transparent; color: var(--color-primary); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.link.danger { color: #c0392b; }
.hint { margin-top: 16px; color: var(--color-muted); font-size: 12px; line-height: 2; }
@media (max-width: 760px) {
  .categories-page { padding: 20px 14px; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .row { flex-wrap: wrap; }
  .row-actions { width: 100%; justify-content: flex-start; }
  .grid { grid-template-columns: 1fr; }
}
</style>
