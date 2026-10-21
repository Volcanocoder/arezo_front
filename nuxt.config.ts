export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '@fontsource/vazirmatn/arabic-300.css',
    '@fontsource/vazirmatn/arabic-400.css',
    '@fontsource/vazirmatn/arabic-500.css',
    '@fontsource/vazirmatn/arabic-600.css',
    '@fontsource/vazirmatn/arabic-700.css',
    '@fontsource/vazirmatn/arabic-800.css',
    '~/assets/css/main.css'
  ],

  runtimeConfig: {
    public: {
      // آدرس بک‌اند؛ با NUXT_PUBLIC_API_BASE جایگزین می‌شود.
      apiBase: 'http://localhost:8000',
      // آدرس عمومی سایت برای canonical و og:url؛ با NUXT_PUBLIC_SITE_URL جایگزین می‌شود.
      siteUrl: 'http://localhost:3000',
      // ایمیل نمایشی در صفحه تماس؛ با NUXT_PUBLIC_CONTACT_EMAIL جایگزین می‌شود (خالی = نمایش داده نمی‌شود).
      contactEmail: ''
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      },
      title: 'آرزو',
      meta: [
        {
          name: 'description',
          content: 'پلتفرمی برای ثبت و برآورده کردن آرزوها'
        },
        { property: 'og:site_name', content: 'آرزو' },
        { property: 'og:locale', content: 'fa_IR' },
        { property: 'og:type', content: 'website' },
        { name: 'theme-color', content: '#6d5dfc' }
      ]
    }
  },

  routeRules: {
    '/dashboard': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/dashboard/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/admin': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/admin/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/login': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/register': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/forgot-password': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/payment/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
})
