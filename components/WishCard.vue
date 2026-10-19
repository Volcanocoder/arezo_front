<script setup lang="ts">
import { ref } from 'vue'

interface Wish {
  id: number
  title: string
  description: string
  category: string
  city: string
  amount: number
  imageUrl?: string | null
  urgency?: 'normal' | 'important' | 'urgent' | string | null
}

defineProps<{ wish: Wish }>()
const imageFailed = ref(false)

const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)
</script>

<template>
  <article class="wish-card">
    <div class="wish-image">
      <img
        v-if="wish.imageUrl && !imageFailed"
        :src="wish.imageUrl"
        :alt="`تصویر آرزو: ${wish.title}`"
        loading="lazy"
        decoding="async"
        @error="imageFailed = true"
      />
      <div v-else class="placeholder-image" aria-hidden="true">
        <span>♡</span>
        <small>تصویری برای این آرزو ثبت نشده</small>
      </div>
      <span class="category">{{ wish.category }}</span>
      <span
        v-if="wish.urgency === 'urgent' || wish.urgency === 'important'"
        class="priority"
        :class="wish.urgency === 'urgent' ? 'priority-urgent' : 'priority-important'"
      >
        {{ wish.urgency === 'urgent' ? 'فوری' : 'مهم' }}
      </span>
    </div>

    <div class="wish-content">
      <div class="wish-meta">⌖ {{ wish.city }}</div>
      <h3>{{ wish.title }}</h3>
      <p class="description">{{ wish.description }}</p>
      <div class="amount-row">
        <span>مبلغ موردنیاز</span>
        <strong>{{ formatPrice(wish.amount) }} <small>تومان</small></strong>
      </div>
      <NuxtLink :to="`/wishes/${wish.id}`" class="view-btn">مشاهده آرزو</NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.wish-card { overflow: hidden; display: flex; flex-direction: column; background: #fff; border: 1px solid #eee; border-radius: 22px; transition: transform .25s ease, box-shadow .25s ease; }
.wish-card:hover { transform: translateY(-5px); box-shadow: 0 18px 45px rgba(40,40,80,.08); }
.wish-image { position: relative; height: 210px; background: #f5f3ff; overflow: hidden; }
.wish-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.placeholder-image { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #f3f1ff, #fafaff); color: var(--color-primary); }
.placeholder-image span { font-size: 52px; line-height: 1; }
.placeholder-image small { color: var(--color-muted); font-size: 11px; }
.category { position: absolute; top: 14px; right: 14px; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,.95); color: var(--color-primary); font-size: 11px; font-weight: 700; }
.priority { position: absolute; top: 14px; left: 14px; padding: 7px 10px; border-radius: 999px; color: #fff; font-size: 10px; font-weight: 800; box-shadow: 0 3px 10px rgba(30,20,50,.12); }
.priority-urgent { background: #c63f54; }
.priority-important { background: #cc7a19; }
.wish-content { flex: 1; padding: 22px; display: flex; flex-direction: column; gap: 12px; }
.wish-meta { color: var(--color-muted); font-size: 12px; }
.wish-content h3 { margin: 0; font-size: 19px; line-height: 1.7; font-weight: 800; }
.description { margin: 0; min-height: 48px; color: var(--color-muted); font-size: 13px; line-height: 2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.amount-row { margin-top: auto; padding: 13px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-radius: 12px; background: #f9f9fc; }
.amount-row span { color: var(--color-muted); font-size: 11px; }
.amount-row strong { color: var(--color-text); font-size: 13px; white-space: nowrap; }
.amount-row small { font-size: 10px; font-weight: 500; }
.view-btn { width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 13px; background: var(--color-primary); color: #fff; font-size: 13px; font-weight: 700; transition: .2s ease; }
.view-btn:hover { background: var(--color-primary-dark); }
</style>
