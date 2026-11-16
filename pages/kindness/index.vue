<script setup lang="ts">
definePageMeta({ layout: 'default' })

const siteUrl = useRuntimeConfig().public.siteUrl
useSeoMeta({
  title: 'دیوار مهربانی | هم‌آرزو',
  description: 'وسایل دست‌دوم سالم را به کسی که نیاز دارد هدیه بده، یا اگر چیزی لازم داری درخواست بده.',
})
useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/kindness` }] })

interface KItem {
  id: number
  title: string
  category: string
  description: string
  condition_label: string
  city: string
  status: string
  image_url: string | null
}

interface ListRes {
  data: KItem[]
  current_page: number
  last_page: number
  categories: string[]
}

const apiBase = useApiBase()
const search = ref('')
const category = ref('')
const page = ref(1)

const { data, pending, error, refresh } = await useAsyncData<ListRes>('kindness-list', () =>
  $fetch<ListRes>(`${apiBase}/api/kindness`, {
    query: { q: search.value.trim() || undefined, category: category.value || undefined, page: page.value },
    headers: { Accept: 'application/json' },
  }),
)

const items = computed(() => data.value?.data ?? [])
const categories = computed(() => data.value?.categories ?? [])
const lastPage = computed(() => data.value?.last_page ?? 1)

function applyFilters() {
  page.value = 1
  refresh()
}

function goTo(p: number) {
  page.value = p
  refresh()
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main class="kindness-page">
    <section class="head">
      <div class="container">
        <span class="badge">هدیه بده، هدیه بگیر</span>
        <h1>دیوار مهربانی</h1>
        <p>وسایل دست‌دوم سالمی که دیگر لازم نداری را برای کسی که نیاز دارد بگذار، یا چیزی که لازم داری را درخواست بده. همه آگهی‌ها و درخواست‌ها پیش از انتشار توسط تیم هم‌آرزو بررسی می‌شوند.</p>
        <NuxtLink to="/kindness/new" class="cta">+ ثبت آگهی</NuxtLink>
      </div>
    </section>

    <section class="container">
      <form class="filters" @submit.prevent="applyFilters">
        <input v-model="search" type="search" placeholder="جستجوی کالا..." aria-label="جستجو">
        <select v-model="category" aria-label="دسته‌بندی" @change="applyFilters">
          <option value="">همه دسته‌ها</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <button type="submit">جستجو</button>
      </form>

      <p v-if="error" class="state bad">دریافت آگهی‌ها انجام نشد. دوباره تلاش کن.</p>
      <p v-else-if="pending && !items.length" class="state">در حال دریافت...</p>
      <p v-else-if="!items.length" class="state">هنوز آگهی‌ای نیست. اولین نفر باش!</p>

      <div v-else class="grid">
        <NuxtLink v-for="i in items" :key="i.id" :to="`/kindness/${i.id}`" class="card">
          <div class="photo">
            <img v-if="i.image_url" :src="i.image_url" :alt="i.title" loading="lazy">
            <span v-else class="ph">🎁</span>
            <span v-if="i.status === 'reserved'" class="ribbon">رزرو شده</span>
          </div>
          <div class="body">
            <h3>{{ i.title }}</h3>
            <p class="meta">{{ i.category }} · {{ i.condition_label }} · {{ i.city }}</p>
            <p class="desc">{{ i.description }}</p>
          </div>
        </NuxtLink>
      </div>

      <div v-if="lastPage > 1" class="pager">
        <button :disabled="page <= 1" @click="goTo(page - 1)">قبلی</button>
        <span>{{ page }} / {{ lastPage }}</span>
        <button :disabled="page >= lastPage" @click="goTo(page + 1)">بعدی</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.kindness-page { padding-bottom: 70px; }
.container { width: min(1120px, 100% - 32px); margin-inline: auto; }
.head { padding: 56px 0 30px; background: linear-gradient(180deg, #f3f1ff, transparent); }
.badge { display: inline-block; padding: 6px 14px; border-radius: 999px; background: #ede9fe; color: var(--color-primary-dark); font-size: 12px; font-weight: 800; }
h1 { margin: 12px 0 8px; font-size: 36px; }
.head p { max-width: 640px; margin: 0 0 18px; color: var(--color-muted); line-height: 2; }
.cta { display: inline-flex; min-height: 44px; align-items: center; padding: 0 22px; border-radius: 14px; background: var(--color-primary); color: #fff; text-decoration: none; font-weight: 800; }
.filters { display: grid; grid-template-columns: 1fr 200px auto; gap: 10px; margin: 20px 0; }
.filters input, .filters select { min-height: 46px; padding: 0 14px; border: 1px solid #e3e3ea; border-radius: 14px; font: inherit; font-size: 16px; background: #fff; }
.filters button { min-height: 46px; padding: 0 22px; border: 0; border-radius: 14px; background: var(--color-primary); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
.state { padding: 30px; text-align: center; background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; color: var(--color-muted); }
.state.bad { color: #b91c1c; background: #fef2f2; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
.card { display: flex; flex-direction: column; background: #fff; border: 1px solid #eee; border-radius: 20px; overflow: hidden; text-decoration: none; color: inherit; transition: .2s; }
.card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(30, 25, 70, .08); }
.photo { position: relative; height: 190px; background: #f5f3ff; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph { display: flex; height: 100%; align-items: center; justify-content: center; font-size: 44px; }
.ribbon { position: absolute; top: 10px; right: 10px; padding: 3px 12px; border-radius: 999px; background: #fff7ed; color: #c2410c; font-size: 12px; font-weight: 800; }
.body { padding: 14px 16px 18px; display: grid; gap: 6px; }
h3 { margin: 0; font-size: 16px; }
.meta { margin: 0; color: #94a3b8; font-size: 12px; }
.desc { margin: 0; color: #475569; font-size: 13px; line-height: 1.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 26px; }
.pager button { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 8px 16px; font: inherit; cursor: pointer; }
.pager button:disabled { opacity: .5; cursor: default; }
@media (max-width: 640px) { .filters { grid-template-columns: 1fr; } h1 { font-size: 28px; } }
</style>
