// اجرای فرانت با pm2:  pm2 start deploy/ecosystem.config.cjs && pm2 save
// آدرس‌ها را با دامنه واقعی خودت جایگزین کن.
module.exports = {
  apps: [
    {
      name: 'arezoo-front',
      script: '.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
        NUXT_PUBLIC_API_BASE: 'https://api.example.ir',
        NUXT_PUBLIC_SITE_URL: 'https://example.ir',
        NUXT_PUBLIC_CONTACT_EMAIL: 'info@example.ir',
      },
    },
  ],
}
