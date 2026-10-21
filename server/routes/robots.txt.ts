// robots.txt پویا؛ آدرس نقشه سایت از NUXT_PUBLIC_SITE_URL ساخته می‌شود.
export default defineEventHandler((event) => {
  const siteUrl = String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, '')

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Disallow: /dashboard',
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /payment',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})
