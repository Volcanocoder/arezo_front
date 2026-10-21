<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

interface PostForm {
  title: string
  slug: string
  excerpt: string
  body: string
  category: string
  cover_image_url: string
  cover_image_alt: string
  meta_title: string
  meta_description: string
  status: 'draft' | 'published'
  published_at: string
}

const route = useRoute()
const { api } = useApi()

const postId = computed(() => String(route.params.id))
const isNew = computed(() => postId.value === 'new')

useHead({ title: () => `${isNew.value ? 'مقاله جدید' : 'ویرایش مقاله'} | آرزو` })

const form = reactive<PostForm>({
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  category: '',
  cover_image_url: '',
  cover_image_alt: '',
  meta_title: '',
  meta_description: '',
  status: 'draft',
  published_at: '',
})

const loading = ref(!isNew.value)
const loadError = ref('')
const saving = ref(false)
const message = ref('')
const messageIsError = ref(false)
const previewHtml = ref('')
const previewing = ref(false)
const showPreview = ref(false)

const bodyArea = ref<HTMLTextAreaElement | null>(null)
const coverUploading = ref(false)
const inlineUploading = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const inlineInput = ref<HTMLInputElement | null>(null)
const categoryOptions = ref<string[]>([])

const MAX_IMAGE_MB = 4

function checkImage(file: File): string | null {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return 'فقط تصویر JPG، PNG، WebP یا GIF مجاز است.'
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `حجم تصویر باید کمتر از ${MAX_IMAGE_MB} مگابایت باشد.`
  return null
}

async function uploadImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('image', file)

  const result = await api<{ url: string }>('/api/admin/blog/images', { method: 'POST', body })

  return result.url
}

async function onCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  const problem = checkImage(file)

  if (problem) {
    messageIsError.value = true
    message.value = problem
    return
  }

  coverUploading.value = true
  message.value = ''

  try {
    form.cover_image_url = await uploadImage(file)

    if (!form.cover_image_alt) form.cover_image_alt = form.title
  } catch (error) {
    messageIsError.value = true
    message.value = apiErrorMessage(error, 'آپلود تصویر ناموفق بود.')
  } finally {
    coverUploading.value = false
  }
}

// تصویر داخل متن: آپلود می‌شود و در محل مکان‌نما به‌صورت Markdown درج می‌شود.
async function onInlineSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  const problem = checkImage(file)

  if (problem) {
    messageIsError.value = true
    message.value = problem
    return
  }

  inlineUploading.value = true
  message.value = ''

  try {
    const url = await uploadImage(file)
    const alt = (file.name.replace(/\.[^.]+$/, '') || 'تصویر').replace(/[\[\]]/g, '')
    const snippet = `\n\n![${alt}](${url})\n\n`
    const area = bodyArea.value
    const start = area?.selectionStart ?? form.body.length
    const end = area?.selectionEnd ?? form.body.length

    form.body = form.body.slice(0, start) + snippet + form.body.slice(end)

    await nextTick()
    area?.focus()
    area?.setSelectionRange(start + snippet.length, start + snippet.length)
  } catch (error) {
    messageIsError.value = true
    message.value = apiErrorMessage(error, 'آپلود تصویر ناموفق بود.')
  } finally {
    inlineUploading.value = false
  }
}

async function loadCategories() {
  try {
    const result = await $fetch<{ data: { name: string }[] }>(`${useApiBase()}/api/categories`, {
      query: { type: 'blog' },
    })

    categoryOptions.value = result.data.map(item => item.name)
  } catch {
    // پیشنهاد دسته‌بندی اختیاری است؛ ورود دستی همچنان ممکن است.
  }
}

function toLocalInput(value?: string | null): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function load() {
  if (isNew.value) return

  loading.value = true
  loadError.value = ''

  try {
    const { post } = await api<{ post: Record<string, string | null> }>(`/api/admin/blog/posts/${postId.value}`)

    form.title = post.title ?? ''
    form.slug = post.slug ?? ''
    form.excerpt = post.excerpt ?? ''
    form.body = post.body ?? ''
    form.category = post.category ?? ''
    form.cover_image_url = post.cover_image_url ?? ''
    form.cover_image_alt = post.cover_image_alt ?? ''
    form.meta_title = post.meta_title ?? ''
    form.meta_description = post.meta_description ?? ''
    form.status = post.status === 'published' ? 'published' : 'draft'
    form.published_at = toLocalInput(post.published_at)
  } catch (error) {
    loadError.value = apiErrorMessage(error, 'دریافت مقاله ناموفق بود.')
  } finally {
    loading.value = false
  }
}

function payload() {
  const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim())

  return {
    title: form.title.trim(),
    slug: blankToNull(form.slug),
    excerpt: blankToNull(form.excerpt),
    body: form.body,
    category: blankToNull(form.category),
    cover_image_url: blankToNull(form.cover_image_url),
    cover_image_alt: blankToNull(form.cover_image_alt),
    meta_title: blankToNull(form.meta_title),
    meta_description: blankToNull(form.meta_description),
    status: form.status,
    published_at: form.status === 'published' && form.published_at
      ? new Date(form.published_at).toISOString()
      : null,
  }
}

async function save(nextStatus?: 'draft' | 'published') {
  if (nextStatus) form.status = nextStatus

  message.value = ''
  saving.value = true

  try {
    if (isNew.value) {
      const result = await api<{ post: { id: number } }>('/api/admin/blog/posts', {
        method: 'POST',
        body: payload(),
      })

      await navigateTo(`/admin/blog/${result.post.id}`)
    } else {
      const result = await api<{ post: { slug: string, published_at: string | null } }>(
        `/api/admin/blog/posts/${postId.value}`,
        { method: 'PUT', body: payload() },
      )

      form.slug = result.post.slug
      form.published_at = toLocalInput(result.post.published_at)
      messageIsError.value = false
      message.value = form.status === 'published' ? 'ذخیره و منتشر شد.' : 'پیش‌نویس ذخیره شد.'
    }
  } catch (error) {
    messageIsError.value = true
    message.value = apiErrorMessage(error)
  } finally {
    saving.value = false
  }
}

async function preview() {
  showPreview.value = !showPreview.value

  if (!showPreview.value || !form.body.trim()) return

  previewing.value = true

  try {
    const result = await api<{ html: string }>('/api/admin/blog/preview', {
      method: 'POST',
      body: { body: form.body },
    })

    previewHtml.value = result.html
  } catch (error) {
    messageIsError.value = true
    message.value = apiErrorMessage(error)
  } finally {
    previewing.value = false
  }
}

onMounted(() => {
  load()
  loadCategories()
})
</script>

<template>
  <main class="editor-page" dir="rtl">
    <header class="page-header">
      <div>
        <NuxtLink to="/admin/blog" class="back">← بازگشت به فهرست</NuxtLink>
        <h1>{{ isNew ? 'مقاله جدید' : 'ویرایش مقاله' }}</h1>
      </div>
    </header>

    <div v-if="loading" class="state" role="status">در حال دریافت مقاله...</div>
    <div v-else-if="loadError" class="state error" role="alert">{{ loadError }}</div>

    <form v-else class="editor" @submit.prevent="save()">
      <section class="panel">
        <label class="field">
          <span>عنوان</span>
          <input v-model="form.title" type="text" maxlength="180" required />
        </label>

        <label class="field">
          <span>خلاصه (اختیاری؛ برای کارت‌ها و توضیح مقاله)</span>
          <textarea v-model="form.excerpt" rows="2" maxlength="300"></textarea>
        </label>

        <div class="field">
          <div class="field-row">
            <label for="body">متن مقاله (Markdown)</label>
            <div class="toolbar">
              <input ref="inlineInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only" tabindex="-1" @change="onInlineSelected" />
              <button type="button" class="link" :disabled="inlineUploading" @click="inlineInput?.click()">
                {{ inlineUploading ? 'در حال آپلود...' : '🖼 افزودن تصویر به متن' }}
              </button>
              <button type="button" class="link" @click="preview">
                {{ showPreview ? 'بستن پیش‌نمایش' : 'پیش‌نمایش' }}
              </button>
            </div>
          </div>
          <textarea id="body" ref="bodyArea" v-model="form.body" rows="18" required dir="auto"></textarea>
          <small class="hint">
            راهنما: <code>## عنوان بخش</code> ، <code>**پررنگ**</code> ، <code>[متن لینک](https://...)</code> ، <code>- مورد فهرست</code> ، <code>> نقل‌قول</code>.
            عنوان اصلی (H1) خودکار از «عنوان» ساخته می‌شود؛ از <code>##</code> شروع کن.
          </small>
        </div>

        <div v-if="showPreview" class="preview" aria-live="polite">
          <p v-if="previewing">در حال ساخت پیش‌نمایش...</p>
          <div v-else-if="previewHtml" class="prose" v-html="previewHtml"></div>
          <p v-else>چیزی برای نمایش نیست.</p>
        </div>
      </section>

      <aside class="side">
        <section class="panel">
          <h2>انتشار</h2>

          <label class="field">
            <span>وضعیت</span>
            <select v-model="form.status">
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشرشده</option>
            </select>
          </label>

          <label v-if="form.status === 'published'" class="field">
            <span>زمان انتشار (خالی = همین حالا)</span>
            <input v-model="form.published_at" type="datetime-local" dir="ltr" />
          </label>

          <p v-if="message" class="notice" :class="{ error: messageIsError }" :role="messageIsError ? 'alert' : 'status'">
            {{ message }}
          </p>

          <div class="buttons">
            <button type="submit" class="primary-btn" :disabled="saving">
              {{ saving ? 'در حال ذخیره...' : 'ذخیره' }}
            </button>
            <button
              v-if="form.status !== 'published'"
              type="button"
              class="primary-btn secondary"
              :disabled="saving"
              @click="save('published')"
            >
              ذخیره و انتشار
            </button>
          </div>
        </section>

        <section class="panel">
          <h2>سئو</h2>

          <label class="field">
            <span>نشانی (slug؛ خالی = از عنوان ساخته می‌شود)</span>
            <input v-model="form.slug" type="text" dir="auto" placeholder="مثلاً راهنمای-ثبت-آرزو" />
          </label>

          <label class="field">
            <span>عنوان سئو <em>{{ form.meta_title.length }}/۷۰</em></span>
            <input v-model="form.meta_title" type="text" maxlength="70" />
          </label>

          <label class="field">
            <span>توضیح متا <em>{{ form.meta_description.length }}/۱۶۰</em></span>
            <textarea v-model="form.meta_description" rows="3" maxlength="160"></textarea>
          </label>

          <label class="field">
            <span>دسته‌بندی</span>
            <input v-model="form.category" type="text" maxlength="80" list="blog-categories" />
            <datalist id="blog-categories">
              <option v-for="name in categoryOptions" :key="name" :value="name" />
            </datalist>
          </label>
        </section>

        <section class="panel">
          <h2>تصویر شاخص</h2>

          <div class="field">
            <span>تصویر شاخص</span>
            <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only" tabindex="-1" @change="onCoverSelected" />
            <div class="cover-actions">
              <button type="button" class="primary-btn secondary" :disabled="coverUploading" @click="coverInput?.click()">
                {{ coverUploading ? 'در حال آپلود...' : (form.cover_image_url ? 'تغییر تصویر' : 'انتخاب تصویر از سیستم') }}
              </button>
              <button v-if="form.cover_image_url" type="button" class="link danger" @click="form.cover_image_url = ''">حذف</button>
            </div>
            <small class="hint">JPG، PNG، WebP یا GIF؛ حداکثر ۴ مگابایت. اندازه پیشنهادی ۱۲۰۰×۶۷۵.</small>
          </div>

          <label class="field">
            <span>یا آدرس تصویر (https)</span>
            <input v-model="form.cover_image_url" type="url" dir="ltr" placeholder="https://..." />
          </label>

          <label class="field">
            <span>متن جایگزین تصویر</span>
            <input v-model="form.cover_image_alt" type="text" maxlength="200" />
          </label>

          <img v-if="form.cover_image_url" :src="form.cover_image_url" :alt="form.cover_image_alt" class="cover-preview" />
        </section>
      </aside>
    </form>
  </main>
</template>

<style scoped>
.editor-page { padding: 34px; }
.page-header { margin-bottom: 24px; }
.back { color: var(--color-muted); font-size: 13px; text-decoration: none; }
.back:hover { color: var(--color-primary); }
.page-header h1 { margin: 8px 0 0; font-size: 28px; font-weight: 800; }
.editor { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.side { display: flex; flex-direction: column; gap: 20px; }
.panel { padding: 22px; border: 1px solid #eee; border-radius: 16px; background: #fff; display: flex; flex-direction: column; gap: 16px; }
.panel h2 { margin: 0; font-size: 16px; font-weight: 800; }
.field { display: flex; flex-direction: column; gap: 7px; font-size: 13px; }
.field > span, .field-row label { font-weight: 700; }
.field em { margin-inline-start: 6px; color: var(--color-muted); font-style: normal; font-weight: 400; font-size: 11px; }
.field-row { display: flex; align-items: center; justify-content: space-between; }
input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #e0e0e8; border-radius: 10px; background: #fff; color: var(--color-text); font-family: inherit; font-size: 14px; line-height: 1.9; }
textarea { resize: vertical; }
input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
.hint { color: var(--color-muted); font-size: 12px; line-height: 2; }
.hint code { padding: 1px 5px; border-radius: 5px; background: #f0eeff; font-size: 11px; }
.toolbar { display: flex; align-items: center; gap: 16px; }
.cover-actions { display: flex; align-items: center; gap: 14px; }
.link.danger { color: #c0392b; }
.link:disabled { opacity: .5; cursor: wait; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.link { padding: 0; border: 0; background: transparent; color: var(--color-primary); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.preview { padding: 18px; border: 1px dashed #cfc9ff; border-radius: 12px; background: #fcfcff; }
.prose { font-size: 15px; line-height: 2.1; overflow-wrap: anywhere; }
.prose :deep(h2) { margin: 1.4em 0 .5em; font-size: 22px; font-weight: 800; }
.prose :deep(h3) { margin: 1.2em 0 .4em; font-size: 18px; font-weight: 800; }
.prose :deep(p) { margin: 0 0 1em; }
.prose :deep(a) { color: var(--color-primary); text-decoration: underline; }
.prose :deep(ul), .prose :deep(ol) { padding-inline-start: 1.6em; }
.prose :deep(blockquote) { margin: 1em 0; padding: 8px 14px; border-inline-start: 4px solid var(--color-primary); background: #f8f8fc; }
.prose :deep(img) { max-width: 100%; height: auto; }
.buttons { display: flex; flex-direction: column; gap: 10px; }
.primary-btn { min-height: 44px; border: 0; border-radius: 11px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.primary-btn.secondary { background: #eceaff; color: var(--color-primary); }
.primary-btn:hover:not(:disabled) { filter: brightness(.95); }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.notice { margin: 0; padding: 10px 12px; border-radius: 10px; background: #edf8f1; color: #278451; font-size: 13px; }
.notice.error { background: #fff1f1; color: #c0392b; }
.cover-preview { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 10px; }
.state { padding: 60px 20px; border: 1px dashed #ddd; border-radius: 18px; background: #fff; color: var(--color-muted); text-align: center; }
.state.error { border-color: #f1c5c9; color: #c0392b; }
@media (max-width: 1000px) { .editor { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .editor-page { padding: 20px 14px; } }
</style>
