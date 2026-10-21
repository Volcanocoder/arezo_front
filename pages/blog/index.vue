<script setup lang="ts">
import type { BlogListResponse } from '~/composables/useBlog'

definePageMeta({ layout: 'default' })

const route = useRoute()
const apiBase = useApiBase()
const siteUrl = useRuntimeConfig().public.siteUrl

const search = ref(String(route.query.q ?? ''))

const query = computed(() => ({
  q: route.query.q ? String(route.query.q) : undefined,
  category: route.query.category ? String(route.query.category) : undefined,
  page: route.query.page ? Number(route.query.page) || 1 : undefined,
}))

const { data, pending, error, refresh } = await useAsyncData<BlogListResponse>(
  'blog-list',
  () => $fetch<BlogListResponse>(`${apiBase}/api/blog/posts`, {
    headers: { Accept: 'application/json' },
    query: query.value,
  }),
  { watch: [query] },
)

const posts = computed(() => data.value?.data ?? [])
const categories = computed(() => data.value?.categories ?? [])
const currentPage = computed(() => data.value?.current_page ?? 1)
const lastPage = computed(() => data.value?.last_page ?? 1)

const isFiltered = computed(() => Boolean(query.value.q || query.value.category))

const title = computed(() => {
  if (query.value.category) return `مقاله‌های ${query.value.category}`
  if (query.value.page && query.value.page > 1) return `وبلاگ آرزو (صفحه ${query.value.page})`
  return 'وبلاگ آرزو'
})
const description = 'مقاله‌ها و راهنمای‌هایی درباره ثبت آرزو، کمک به دیگران و اعتمادسازی در پلتفرم آرزو.'

useSeoMeta({
  title: () => `${title.value} | آرزو`,
  description,
  ogTitle: () => title.value,
  ogDescription: description,
  // نتیجه جستجو و صفحه‌های فیلترشده نباید ایندکس شوند.
  robots: () => (route.query.q ? 'noindex, follow' : 'index, follow'),
})

useHead({
  link: [{
    rel: 'canonical',
    href: () => {
      const params = new URLSearchParams()
      if (query.value.category) params.set('category', query.value.category)
      if (query.value.page && query.value.page > 1) params.set('page', String(query.value.page))
      const qs = params.toString()
      return `${siteUrl}/blog${qs ? `?${qs}` : ''}`
    },
  }],
})

function go(extra: Record<string, string | undefined>) {
  const next: Record<string, string> = {}
  const merged = { q: query.value.q, category: query.value.category, ...extra }

  for (const [key, value] of Object.entries(merged)) {
    if (value) next[key] = value
  }

  return navigateTo({ path: '/blog', query: next })
}

function submitSearch() {
  return go({ q: search.value.trim() || undefined, page: undefined })
}

function pageLink(page: number) {
  const params: Record<string, string> = {}
  if (query.value.q) params.q = query.value.q
  if (query.value.category) params.category = query.value.category
  if (page > 1) params.page = String(page)
  return { path: '/blog', query: params }
}
</script>

<template>
  <main class="blog-page">
    <header class="page-header">
      <span class="badge">وبلاگ آرزو</span>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </header>

    <section class="container">
      <form class="toolbar" role="search" @submit.prevent="submitSearch">
        <label class="search-box">
          <span class="sr-only">جستجو در مقاله‌ها</span>
          <input v-model="search" type="search" placeholder="جستجو در مقاله‌ها..." />
        </label>
        <button type="submit" class="search-btn">جستجو</button>
      </form>

      <nav v-if="categories.length" class="categories" aria-label="دسته‌بندی مقاله‌ها">
        <NuxtLink :to="{ path: '/blog' }" class="cat" :class="{ active: !query.category }">همه</NuxtLink>
        <NuxtLink
          v-for="category in categories"
          :key="category"
          :to="{ path: '/blog', query: { category } }"
          class="cat"
          :class="{ active: query.category === category }"
        >
          {{ category }}
        </NuxtLink>
      </nav>

      <div v-if="error" class="state error" role="alert">
        <h2>دریافت مقاله‌ها ناموفق بود</h2>
        <p>ارتباط با سرور برقرار نشد. کمی بعد دوباره تلاش کن.</p>
        <button type="button" class="search-btn" @click="refresh()">تلاش دوباره</button>
      </div>

      <div v-else-if="posts.length" class="grid" :aria-busy="pending">
        <BlogCard v-for="post in posts" :key="post.id" :post="post" />
      </div>

      <div v-else class="state">
        <h2>{{ isFiltered ? 'مقاله‌ای پیدا نشد' : 'هنوز مقاله‌ای منتشر نشده است' }}</h2>
        <p>{{ isFiltered ? 'عبارت جستجو یا دسته‌بندی را تغییر بده.' : 'به‌زودی مقاله‌های تازه اینجا قرار می‌گیرند.' }}</p>
        <NuxtLink v-if="isFiltered" to="/blog" class="search-btn link">نمایش همه مقاله‌ها</NuxtLink>
      </div>

      <nav v-if="lastPage > 1" class="pagination" aria-label="صفحه‌بندی">
        <NuxtLink v-if="currentPage > 1" :to="pageLink(currentPage - 1)" rel="prev" class="page-btn">قبلی</NuxtLink>
        <span class="page-info">صفحه {{ currentPage }} از {{ lastPage }}</span>
        <NuxtLink v-if="currentPage < lastPage" :to="pageLink(currentPage + 1)" rel="next" class="page-btn">بعدی</NuxtLink>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.blog-page { background: #fff; padding-bottom: 100px; }
.page-header { padding: 80px 20px 60px; text-align: center; background: #f8f8fc; }
.badge { display: inline-flex; padding: 8px 15px; border-radius: 999px; background: #eceaff; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.page-header h1 { margin: 18px 0 10px; font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.4; }
.page-header p { max-width: 640px; margin: 0 auto; color: var(--color-muted); font-size: 15px; line-height: 2; }
.container { width: min(1150px, calc(100% - 40px)); margin: 0 auto; padding-top: 40px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
.search-box { flex: 1; }
.search-box input { width: 100%; height: 48px; padding: 0 16px; border: 1px solid #e7e7eb; border-radius: 13px; font-size: 14px; font-family: inherit; color: var(--color-text); }
.search-box input:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
.search-btn { min-height: 48px; padding: 0 22px; border: 0; border-radius: 13px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
.search-btn:hover { background: var(--color-primary-dark); }
.search-btn:focus-visible, .cat:focus-visible, .page-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px; }
.cat { padding: 8px 16px; border: 1px solid #e7e7eb; border-radius: 999px; color: var(--color-text); font-size: 13px; text-decoration: none; }
.cat:hover { border-color: var(--color-primary); }
.cat.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; border: 1px dashed #ddd; border-radius: 24px; text-align: center; }
.state h2 { margin: 0; font-size: 20px; font-weight: 800; }
.state p { margin: 0; color: var(--color-muted); font-size: 14px; line-height: 1.9; }
.state.error { border-color: #f1c5c9; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 40px; }
.page-btn { padding: 10px 20px; border: 1px solid #e7e7eb; border-radius: 12px; color: var(--color-text); font-size: 13px; font-weight: 700; text-decoration: none; }
.page-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.page-info { color: var(--color-muted); font-size: 13px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 980px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .toolbar { flex-direction: column; } .page-header { padding: 60px 16px 40px; } }
</style>
