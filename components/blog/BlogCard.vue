<script setup lang="ts">
import type { BlogPostSummary } from '~/composables/useBlog'

defineProps<{ post: BlogPostSummary }>()
</script>

<template>
  <article class="blog-card">
    <NuxtLink :to="`/blog/${post.slug}`" class="cover" tabindex="-1" aria-hidden="true">
      <img
        v-if="post.cover_image_url"
        :src="post.cover_image_url"
        :alt="post.cover_image_alt"
        width="640"
        height="360"
        loading="lazy"
      />
      <span v-else class="cover-placeholder">آ</span>
    </NuxtLink>

    <div class="content">
      <div class="meta">
        <span v-if="post.category" class="chip">{{ post.category }}</span>
        <span>{{ formatBlogDate(post.published_at) }}</span>
        <span>{{ formatReadingTime(post.reading_time) }}</span>
      </div>

      <h2>
        <NuxtLink :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink>
      </h2>

      <p>{{ post.excerpt }}</p>

      <NuxtLink :to="`/blog/${post.slug}`" class="more">
        ادامه مطلب <span aria-hidden="true">←</span>
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.blog-card { display: flex; flex-direction: column; min-width: 0; border: 1px solid #eee; border-radius: 20px; background: #fff; overflow: hidden; transition: .2s ease; }
.blog-card:hover { border-color: #dcd7ff; box-shadow: 0 12px 30px rgba(40, 30, 100, .06); transform: translateY(-2px); }
.cover { display: block; aspect-ratio: 16 / 9; background: #f5f3ff; overflow: hidden; }
.cover img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f1ff, #fafaff); color: var(--color-primary); font-size: 54px; font-weight: 800; }
.content { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; color: var(--color-muted); font-size: 12px; }
.chip { padding: 5px 10px; border-radius: 999px; background: #f0eeff; color: var(--color-primary); font-size: 11px; font-weight: 700; }
h2 { margin: 0; font-size: 18px; line-height: 1.8; font-weight: 800; }
h2 a { color: inherit; text-decoration: none; }
h2 a:hover { color: var(--color-primary); }
p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 2; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.more { margin-top: auto; color: var(--color-primary); font-size: 13px; font-weight: 700; text-decoration: none; }
.more:hover { text-decoration: underline; }
</style>
