<script setup lang="ts">
useHead({
  title: 'نتیجه پرداخت | آرزو',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const route = useRoute()
const status = computed(() => String(route.query.status || 'failed'))
const wishId = computed(() => Number(route.query.wish) || null)
const amount = computed(() => Number(route.query.amount) || 0)
const ref = computed(() => String(route.query.ref || ''))

const content = computed(() => {
  switch (status.value) {
    case 'success':
      return { icon: '🎉', tone: 'ok', title: 'پرداخت با موفقیت انجام شد', text: 'ممنون از حمایتت. این کمک به آرزو اضافه شد و صاحب آرزو از آن باخبر می‌شود.' }
    case 'cancelled':
      return { icon: '↩️', tone: 'warn', title: 'پرداخت لغو شد', text: 'پرداخت را نیمه‌کاره رها کردی و مبلغی از حسابت کم نشده است.' }
    default:
      return { icon: '⚠️', tone: 'bad', title: 'پرداخت ناموفق بود', text: 'پرداخت تأیید نشد. اگر مبلغی از حسابت کم شده، معمولاً تا ۷۲ ساعت به حسابت برمی‌گردد.' }
  }
})
</script>

<template>
  <main class="result-page">
    <section class="card" :class="content.tone">
      <div class="icon">{{ content.icon }}</div>
      <h1>{{ content.title }}</h1>
      <p>{{ content.text }}</p>

      <dl v-if="status === 'success'">
        <div v-if="amount"><dt>مبلغ</dt><dd>{{ new Intl.NumberFormat('fa-IR').format(amount) }} تومان</dd></div>
        <div v-if="ref"><dt>شماره پیگیری</dt><dd dir="ltr">{{ ref }}</dd></div>
      </dl>

      <div class="actions">
        <NuxtLink v-if="wishId" :to="`/wishes/${wishId}`" class="primary">بازگشت به آرزو</NuxtLink>
        <NuxtLink to="/wishes" class="ghost">آرزوهای دیگر</NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.result-page { min-height: 70vh; display: grid; place-items: center; padding: 40px 20px; background: #f8f8fc; }
.card { width: min(520px, 100%); background: #fff; border: 1px solid #eee; border-radius: 28px; padding: 40px 28px; text-align: center; display: grid; gap: 14px; box-shadow: 0 20px 50px rgba(31, 24, 80, .08); }
.icon { font-size: 56px; }
h1 { margin: 0; font-size: 24px; }
p { margin: 0; color: var(--color-muted); line-height: 2; }
.card.ok h1 { color: #166534; } .card.bad h1 { color: #b91c1c; } .card.warn h1 { color: #92400e; }
dl { margin: 6px 0; display: grid; gap: 8px; }
dl div { display: flex; justify-content: space-between; background: #f8f8fc; border-radius: 12px; padding: 10px 14px; }
dt { color: var(--color-muted); } dd { margin: 0; font-weight: 800; }
.actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 6px; }
.actions a { padding: 12px 22px; border-radius: 14px; font-weight: 700; text-decoration: none; }
.primary { background: var(--color-primary); color: #fff; }
.ghost { background: #f4f2ff; color: var(--color-primary-dark); }
</style>
