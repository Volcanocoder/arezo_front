export default defineNuxtConfig({
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

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
        }
      ]
    }
  },
  routeRules: {
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },
  
})