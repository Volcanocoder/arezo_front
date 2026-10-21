// نقشه سایت پویا: صفحه‌های ثابت + آرزوهای تأییدشده از بک‌اند.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const apiBase = String(config.public.apiBase).replace(/\/$/, '')

  const staticPaths = ['/', '/wishes', '/blog', '/about', '/how-it-works', '/contact', '/terms', '/privacy']
  const urls: { loc: string, lastmod?: string }[] = staticPaths.map(path => ({
    loc: `${siteUrl}${path}`,
  }))

  try {
    const response = await $fetch<unknown>(`${apiBase}/api/wishes`, {
      headers: { Accept: 'application/json' },
    })
    const records = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data ?? []

    for (const item of records as { id?: number, created_at?: string }[]) {
      if (!item?.id) continue
      urls.push({
        loc: `${siteUrl}/wishes/${item.id}`,
        lastmod: item.created_at ? new Date(item.created_at).toISOString() : undefined,
      })
    }
  } catch {
    // اگر بک‌اند در دسترس نبود، فقط صفحه‌های ثابت منتشر می‌شوند.
  }

  try {
    const posts = await $fetch<{ slug: string, updated_at?: string }[]>(`${apiBase}/api/blog/sitemap`, {
      headers: { Accept: 'application/json' },
    })

    for (const post of posts) {
      urls.push({
        loc: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
        lastmod: post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
      })
    }
  } catch {
    // مقاله‌ها فقط وقتی بک‌اند در دسترس باشد در نقشه سایت می‌آیند.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return body
})
