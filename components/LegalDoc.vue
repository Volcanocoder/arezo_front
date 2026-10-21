<script setup lang="ts">
defineProps<{ title: string, updated: string, intro?: string }>()
</script>

<template>
  <main class="legal">
    <article class="doc">
      <nav class="crumbs" aria-label="مسیر صفحه">
        <NuxtLink to="/">خانه</NuxtLink> / <span>{{ title }}</span>
      </nav>
      <h1>{{ title }}</h1>
      <p class="meta">آخرین به‌روزرسانی: {{ updated }}</p>
      <p v-if="intro" class="intro">{{ intro }}</p>
      <slot />
      <p class="foot">
        سؤالی داری؟ از صفحه <NuxtLink to="/contact">تماس با ما</NuxtLink> پیام بفرست.
      </p>
    </article>
  </main>
</template>

<style scoped>
.legal { background: #f8f8fc; padding: 48px 20px 90px; }
.doc { width: min(820px, 100%); margin: 0 auto; background: #fff; border: 1px solid #eee; border-radius: 24px; padding: 40px 36px; line-height: 2.1; color: #374151; }
.crumbs { font-size: 12px; color: #9ca3af; margin-bottom: 14px; }
.crumbs a { color: inherit; text-decoration: none; }
h1 { margin: 0 0 6px; font-size: 30px; color: var(--color-text); }
.meta { color: #9ca3af; font-size: 13px; margin: 0 0 18px; }
.intro { background: #f4f2ff; border-radius: 14px; padding: 14px 18px; margin: 0 0 8px; }
.doc :deep(h2) { margin: 30px 0 8px; font-size: 19px; color: var(--color-text); }
.doc :deep(p) { margin: 0 0 12px; }
.doc :deep(ul) { margin: 0 0 12px; padding-inline-start: 22px; }
.doc :deep(a), .foot a { color: var(--color-primary); }
.foot { margin-top: 32px; padding-top: 18px; border-top: 1px solid #eee; font-size: 14px; }
@media (max-width: 600px) { .doc { padding: 26px 18px; } h1 { font-size: 24px; } }
</style>
