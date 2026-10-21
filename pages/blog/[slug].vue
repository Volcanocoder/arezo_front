<script setup lang="ts">
import type { BlogPost } from '~/composables/useBlog'

definePageMeta({ layout: 'default' })

const route = useRoute()
const apiBase = useApiBase()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

const slug = computed(() => String(route.params.slug ?? ''))

const { data: post, error } = await useAsyncData<BlogPost>(
  () => `blog-post-${slug.value}`,
  () => $fetch<BlogPost>(`${apiBase}/api/blog/posts/${encodeURIComponent(slug.value)}`, {
    headers: { Accept: 'application/json' },
  }),
  { watch: [slug] },
)

if (error.value) {
  const status = (error.value as { statusCode?: number }).statusCode
  throw createError({
    statusCode: status === 404 ? 404 : 500,
    statusMessage: status === 404 ? 'مقاله پیدا نشد' : 'خطا در دریافت مقاله',
    fatal: true,
  })
}

const canonical = computed(() => `${siteUrl}/blog/${encodeURIComponent(slug.value)}`)

useSeoMeta({
  title: () => `${post.value?.meta_title || post.value?.title || 'مقاله'} | آرزو`,
  description: () => post.value?.meta_description || '',
  ogTitle: () => post.value?.meta_title || post.value?.title || '',
  ogDescription: () => post.value?.meta_description || '',
  ogType: 'article',
  ogImage: () => post.value?.cover_image_url || undefined,
  articlePublishedTime: () => post.value?.published_at || undefined,
  articleModifiedTime: () => post.value?.updated_at || undefined,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: () => canonical.value }],
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.value?.title,
      description: post.value?.meta_description,
      image: post.value?.cover_image_url || undefined,
      datePublished: post.value?.published_at,
      dateModified: post.value?.updated_at || post.value?.published_at,
      inLanguage: 'fa-IR',
      author: { '@type': 'Person', name: post.value?.author_name || 'تیم آرزو' },
      publisher: { '@type': 'Organization', name: 'آرزو', url: siteUrl },
      mainEntityOfPage: canonical.value,
    }),
  }],
})
</script>

<template>
  <main v-if="post" class="article-page">
    <article class="article">
      <nav class="breadcrumb" aria-label="مسیر صفحه">
        <NuxtLink to="/">خانه</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/blog">وبلاگ</NuxtLink>
        <template v-if="post.category">
          <span aria-hidden="true">/</span>
          <NuxtLink :to="{ path: '/blog', query: { category: post.category } }">{{ post.category }}</NuxtLink>
        </template>
      </nav>

      <header class="article-header">
        <h1>{{ post.title }}</h1>
        <p v-if="post.excerpt" class="lead">{{ post.excerpt }}</p>
        <div class="meta">
          <span v-if="post.author_name">{{ post.author_name }}</span>
          <time :datetime="post.published_at || undefined">{{ formatBlogDate(post.published_at) }}</time>
          <span>{{ formatReadingTime(post.reading_time) }}</span>
        </div>
      </header>

      <img
        v-if="post.cover_image_url"
        class="cover"
        :src="post.cover_image_url"
        :alt="post.cover_image_alt"
        width="1200"
        height="675"
        fetchpriority="high"
      />

      <!-- محتوا روی سرور از Markdown ساخته و پاک‌سازی شده است (HTML خام و لینک‌های خطرناک حذف می‌شوند). -->
      <div class="prose" v-html="post.body_html"></div>

      <aside class="cta">
        <h2>آرزویی داری؟</h2>
        <p>آرزوی خودت را ثبت کن تا بعد از بررسی تیم آرزو، دیده شود.</p>
        <NuxtLink to="/create-wish" class="cta-btn">ثبت آرزو</NuxtLink>
      </aside>
    </article>

    <section v-if="post.related.length" class="related" aria-labelledby="related-title">
      <h2 id="related-title">مقاله‌های مرتبط</h2>
      <div class="related-grid">
        <BlogCard v-for="item in post.related" :key="item.id" :post="item" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.article-page { background: #fff; padding: 40px 20px 100px; }
.article { width: min(780px, 100%); margin: 0 auto; }
.breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; color: var(--color-muted); font-size: 13px; }
.breadcrumb a { color: var(--color-muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--color-primary); text-decoration: underline; }
.article-header h1 { margin: 0 0 14px; font-size: clamp(28px, 4.5vw, 42px); line-height: 1.6; font-weight: 800; }
.lead { margin: 0 0 16px; color: var(--color-muted); font-size: 17px; line-height: 2.1; }
.meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-bottom: 28px; color: var(--color-muted); font-size: 13px; }
.cover { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; margin-bottom: 36px; border-radius: 20px; background: #f5f3ff; }
.prose { color: var(--color-text); font-size: 16px; line-height: 2.2; overflow-wrap: anywhere; }
.prose :deep(h2) { margin: 2em 0 .6em; font-size: 26px; line-height: 1.7; font-weight: 800; }
.prose :deep(h3) { margin: 1.6em 0 .5em; font-size: 20px; line-height: 1.7; font-weight: 800; }
.prose :deep(p) { margin: 0 0 1.2em; }
.prose :deep(a) { color: var(--color-primary); text-decoration: underline; }
.prose :deep(ul), .prose :deep(ol) { margin: 0 0 1.2em; padding-inline-start: 1.6em; }
.prose :deep(li) { margin-bottom: .4em; }
.prose :deep(blockquote) { margin: 1.4em 0; padding: 12px 18px; border-inline-start: 4px solid var(--color-primary); background: #f8f8fc; border-radius: 8px; color: var(--color-muted); }
.prose :deep(img) { max-width: 100%; height: auto; border-radius: 14px; }
.prose :deep(pre) { direction: ltr; overflow-x: auto; padding: 16px; border-radius: 12px; background: #1f2937; color: #f3f4f6; font-size: 14px; line-height: 1.8; }
.prose :deep(code) { padding: 2px 6px; border-radius: 6px; background: #f0eeff; font-size: .9em; }
.prose :deep(pre code) { padding: 0; background: transparent; }
.prose :deep(table) { width: 100%; margin: 1.4em 0; border-collapse: collapse; font-size: 14px; display: block; overflow-x: auto; }
.prose :deep(th), .prose :deep(td) { padding: 10px 12px; border: 1px solid #e7e7eb; text-align: start; }
.prose :deep(hr) { margin: 2em 0; border: 0; border-top: 1px solid #eee; }
.cta { margin-top: 56px; padding: 32px; border-radius: 22px; background: #f0eeff; text-align: center; }
.cta h2 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
.cta p { margin: 0 0 18px; color: var(--color-muted); font-size: 14px; line-height: 2; }
.cta-btn { display: inline-flex; min-height: 46px; padding: 0 28px; align-items: center; border-radius: 13px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
.cta-btn:hover { background: var(--color-primary-dark); }
.cta-btn:focus-visible { outline: 2px solid var(--color-primary-dark); outline-offset: 3px; }
.related { width: min(1150px, 100%); margin: 70px auto 0; }
.related h2 { margin: 0 0 24px; font-size: 24px; font-weight: 800; }
.related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 980px) { .related-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .related-grid { grid-template-columns: 1fr; } .article-page { padding-top: 24px; } .cta { padding: 24px 18px; } }
</style>
