<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({ title: 'دیوار مهربانی من | هم‌آرزو' })

interface MyItem {
  id: number
  title: string
  category: string
  city: string
  status: string
  review_note: string | null
  requests_count: number
  created_at: string
}

interface MyRequest {
  id: number
  message: string
  status: string
  review_note: string | null
  created_at: string
  item: { id: number, title: string } | null
}

const { api } = useApi()
const tab = ref<'items' | 'requests'>('items')
const items = ref<MyItem[]>([])
const requests = ref<MyRequest[]>([])
const loading = ref(true)
const error = ref('')

const itemLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'نمایش داده می‌شود', rejected: 'تأیید نشد', reserved: 'رزرو شده', given: 'تحویل داده شد',
}
const requestLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'تأیید شد؛ مدیر با تو تماس می‌گیرد', rejected: 'تأیید نشد', completed: 'تحویل گرفتی',
}

const date = (v: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v))

onMounted(async () => {
  try {
    const [a, b] = await Promise.all([
      api<{ data: MyItem[] }>('/api/my/kindness/items'),
      api<{ data: MyRequest[] }>('/api/my/kindness/requests'),
    ])
    items.value = a.data
    requests.value = b.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'دریافت اطلاعات انجام نشد.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="mine">
    <div class="top">
      <div>
        <span class="eyebrow">دیوار مهربانی</span>
        <h1>آگهی‌ها و درخواست‌های من</h1>
      </div>
      <NuxtLink to="/kindness/new" class="cta">+ ثبت آگهی</NuxtLink>
    </div>

    <div class="tabs">
      <button type="button" :class="{ active: tab === 'items' }" @click="tab = 'items'">آگهی‌های من</button>
      <button type="button" :class="{ active: tab === 'requests' }" @click="tab = 'requests'">درخواست‌های من</button>
    </div>

    <p v-if="error" class="state bad">{{ error }}</p>
    <p v-else-if="loading" class="state">در حال دریافت...</p>

    <template v-else-if="tab === 'items'">
      <p v-if="!items.length" class="state">هنوز آگهی‌ای ثبت نکرده‌ای.</p>
      <article v-for="i in items" :key="i.id" class="card">
        <div class="row">
          <h3>{{ i.title }}</h3>
          <span class="badge" :class="i.status">{{ itemLabels[i.status] ?? i.status }}</span>
        </div>
        <p class="meta">{{ i.category }} · {{ i.city }} · {{ date(i.created_at) }}</p>
        <p v-if="i.requests_count" class="meta">{{ new Intl.NumberFormat('fa-IR').format(i.requests_count) }} درخواست</p>
        <p v-if="i.review_note" class="note">پیام بررسی: {{ i.review_note }}</p>
      </article>
    </template>

    <template v-else>
      <p v-if="!requests.length" class="state">هنوز درخواستی ثبت نکرده‌ای.</p>
      <article v-for="r in requests" :key="r.id" class="card">
        <div class="row">
          <h3>{{ r.item?.title ?? 'کالای حذف‌شده' }}</h3>
          <span class="badge" :class="r.status">{{ requestLabels[r.status] ?? r.status }}</span>
        </div>
        <p class="meta">{{ date(r.created_at) }}</p>
        <p class="msg">«{{ r.message }}»</p>
        <p v-if="r.review_note" class="note">پیام بررسی: {{ r.review_note }}</p>
        <NuxtLink v-if="r.item" :to="`/kindness/${r.item.id}`" class="link">مشاهده آگهی</NuxtLink>
      </article>
    </template>
  </section>
</template>

<style scoped>
.mine { display: grid; gap: 14px; max-width: 820px; }
.top { display: flex; justify-content: space-between; align-items: end; gap: 12px; flex-wrap: wrap; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 4px 0 0; font-size: 26px; }
.cta { display: inline-flex; min-height: 42px; align-items: center; padding: 0 18px; border-radius: 12px; background: var(--color-primary); color: #fff; text-decoration: none; font-weight: 800; font-size: 14px; }
.tabs { display: flex; gap: 8px; }
.tabs button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-family: inherit; font-weight: 700; color: #475569; }
.tabs .active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.state { margin: 0; padding: 26px; text-align: center; background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; color: var(--color-muted); }
.state.bad { color: #b91c1c; background: #fef2f2; }
.card { display: grid; gap: 6px; padding: 16px; background: #fff; border: 1px solid #eee; border-radius: 16px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
h3 { margin: 0; font-size: 16px; }
.meta { margin: 0; color: #94a3b8; font-size: 13px; }
.msg { margin: 0; color: #334155; line-height: 2; }
.note { margin: 0; color: #b45309; font-size: 13px; }
.link { color: var(--color-primary); font-weight: 800; font-size: 13px; text-decoration: none; }
.badge { padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #eef2ff; color: #4338ca; }
.badge.approved, .badge.completed, .badge.given { background: #ecfdf3; color: #15803d; }
.badge.rejected { background: #fef2f2; color: #b91c1c; }
.badge.reserved { background: #fff7ed; color: #c2410c; }
</style>
