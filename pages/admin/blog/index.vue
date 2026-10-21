<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'مدیریت وبلاگ | آرزو' })

interface AdminPostRow {
  id: number
  title: string
  slug: string
  category: string | null
  status: 'draft' | 'published'
  published_at: string | null
  updated_at: string | null
}

interface AdminPostList {
  data: AdminPostRow[]
  current_page: number
  last_page: number
  total: number
}

const { api } = useApi()

const posts = ref<AdminPostRow[]>([])
const total = ref(0)
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const status = ref<'all' | 'draft' | 'published'>('all')
const loading = ref(true)
const loadError = ref('')
const notice = ref('')
const noticeIsError = ref(false)
const confirmingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

async function load(targetPage = 1) {
  loading.value = true
  loadError.value = ''

  try {
    const result = await api<AdminPostList>('/api/admin/blog/posts', {
      query: {
        page: targetPage,
        q: search.value.trim() || undefined,
        status: status.value === 'all' ? undefined : status.value,
      },
    })

    posts.value = result.data
    total.value = result.total
    page.value = result.current_page
    lastPage.value = result.last_page
  } catch (error) {
    loadError.value = apiErrorMessage(error, 'دریافت مقاله‌ها ناموفق بود.')
  } finally {
    loading.value = false
  }
}

async function remove(post: AdminPostRow) {
  deletingId.value = post.id
  notice.value = ''

  try {
    await api(`/api/admin/blog/posts/${post.id}`, { method: 'DELETE' })
    noticeIsError.value = false
    notice.value = 'مقاله حذف شد.'
    confirmingId.value = null
    await load(posts.value.length === 1 && page.value > 1 ? page.value - 1 : page.value)
  } catch (error) {
    noticeIsError.value = true
    notice.value = apiErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

onMounted(() => load())
</script>

<template>
  <main class="blog-admin" dir="rtl">
    <header class="page-header">
      <div>
        <span class="eyebrow">مرکز مدیریت</span>
        <h1>وبلاگ</h1>
        <p>مقاله‌های سئو را بنویس، پیش‌نویس کن و منتشر کن.</p>
      </div>
      <NuxtLink to="/admin/blog/new" class="primary-btn">+ مقاله جدید</NuxtLink>
    </header>

    <form class="toolbar" @submit.prevent="load(1)">
      <input v-model="search" type="search" placeholder="جستجو در عنوان..." aria-label="جستجو در عنوان مقاله‌ها" />
      <select v-model="status" aria-label="فیلتر وضعیت" @change="load(1)">
        <option value="all">همه وضعیت‌ها</option>
        <option value="published">منتشرشده</option>
        <option value="draft">پیش‌نویس</option>
      </select>
      <button type="submit" class="primary-btn small">جستجو</button>
      <span class="total">{{ new Intl.NumberFormat('fa-IR').format(total) }} مقاله</span>
    </form>

    <p v-if="notice" class="notice" :class="{ error: noticeIsError }" :role="noticeIsError ? 'alert' : 'status'">
      {{ notice }}
    </p>

    <div v-if="loading" class="state" role="status">در حال دریافت مقاله‌ها...</div>

    <div v-else-if="loadError" class="state error" role="alert">
      {{ loadError }}
      <button type="button" class="primary-btn small" @click="load(page)">تلاش دوباره</button>
    </div>

    <div v-else-if="!posts.length" class="state">
      هنوز مقاله‌ای نیست.
      <NuxtLink to="/admin/blog/new" class="primary-btn small">اولین مقاله را بنویس</NuxtLink>
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>عنوان</th>
            <th>دسته</th>
            <th>وضعیت</th>
            <th>تاریخ انتشار</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>
              <strong>{{ post.title }}</strong>
              <small dir="ltr">/blog/{{ post.slug }}</small>
            </td>
            <td>{{ post.category || '—' }}</td>
            <td>
              <span class="chip" :class="post.status">
                {{ post.status === 'published' ? 'منتشرشده' : 'پیش‌نویس' }}
              </span>
            </td>
            <td>{{ formatBlogDate(post.published_at) || '—' }}</td>
            <td class="actions">
              <template v-if="confirmingId === post.id">
                <span>حذف شود؟</span>
                <button type="button" class="link danger" :disabled="deletingId === post.id" @click="remove(post)">
                  {{ deletingId === post.id ? '...' : 'بله' }}
                </button>
                <button type="button" class="link" @click="confirmingId = null">خیر</button>
              </template>
              <template v-else>
                <NuxtLink :to="`/admin/blog/${post.id}`" class="link">ویرایش</NuxtLink>
                <NuxtLink v-if="post.status === 'published'" :to="`/blog/${post.slug}`" target="_blank" class="link">مشاهده</NuxtLink>
                <button type="button" class="link danger" @click="confirmingId = post.id">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="lastPage > 1" class="pager" aria-label="صفحه‌بندی">
      <button type="button" class="primary-btn small" :disabled="page <= 1" @click="load(page - 1)">قبلی</button>
      <span>صفحه {{ page }} از {{ lastPage }}</span>
      <button type="button" class="primary-btn small" :disabled="page >= lastPage" @click="load(page + 1)">بعدی</button>
    </nav>
  </main>
</template>

<style scoped>
.blog-admin { padding: 34px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 26px; }
.eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.page-header h1 { margin: 7px 0; font-size: 30px; font-weight: 800; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 13px; }
.primary-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border: 0; border-radius: 11px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; }
.primary-btn.small { min-height: 40px; padding: 0 16px; font-size: 12px; }
.primary-btn:hover:not(:disabled) { background: var(--color-primary-dark); }
.primary-btn:disabled { opacity: .5; cursor: not-allowed; }
.primary-btn:focus-visible, .link:focus-visible { outline: 2px solid var(--color-primary-dark); outline-offset: 2px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 18px; }
.toolbar input, .toolbar select { height: 42px; padding: 0 12px; border: 1px solid #e8e8ee; border-radius: 11px; background: #fff; font-family: inherit; font-size: 13px; }
.toolbar input { flex: 1; min-width: 180px; }
.total { margin-inline-start: auto; color: var(--color-muted); font-size: 12px; }
.notice { margin: 0 0 14px; padding: 11px 14px; border-radius: 10px; background: #edf8f1; color: #278451; font-size: 13px; }
.notice.error { background: #fff1f1; color: #c0392b; }
.state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; border: 1px dashed #ddd; border-radius: 18px; background: #fff; color: var(--color-muted); font-size: 14px; text-align: center; }
.state.error { border-color: #f1c5c9; color: #c0392b; }
.table-wrap { overflow-x: auto; border: 1px solid #eee; border-radius: 16px; background: #fff; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 14px 16px; background: #fafafd; color: var(--color-muted); font-size: 12px; font-weight: 700; text-align: start; white-space: nowrap; }
td { padding: 14px 16px; border-top: 1px solid #f0f0f4; vertical-align: middle; }
td strong { display: block; margin-bottom: 4px; }
td small { color: var(--color-muted); font-size: 11px; }
.chip { display: inline-flex; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.chip.published { background: #eaf8f0; color: #278750; }
.chip.draft { background: #fff6e5; color: #b7791f; }
.actions { display: flex; align-items: center; gap: 12px; white-space: nowrap; }
.link { padding: 0; border: 0; background: transparent; color: var(--color-primary); font-family: inherit; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; }
.link:hover { text-decoration: underline; }
.link.danger { color: #c0392b; }
.pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 22px; font-size: 13px; color: var(--color-muted); }
@media (max-width: 640px) { .blog-admin { padding: 20px 14px; } .page-header { flex-direction: column; align-items: flex-start; } }
</style>
