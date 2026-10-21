<script setup lang="ts">
const year = new Date().getFullYear().toLocaleString('fa-IR', { useGrouping: false })

const columns = [
  {
    title: 'آرزو',
    links: [
      { to: '/', label: 'خانه' },
      { to: '/wishes', label: 'آرزوها' },
      { to: '/create-wish', label: 'ثبت آرزو' },
      { to: '/blog', label: 'وبلاگ' },
    ],
  },
  {
    title: 'راهنما',
    links: [
      { to: '/how-it-works', label: 'چطور کار می‌کند؟' },
      { to: '/blog', label: 'آموزش‌ها و راهنماها' },
      { to: '/about', label: 'درباره ما' },
      { to: '/contact', label: 'تماس با ما' },
    ],
  },
  {
    title: 'حساب کاربری',
    links: [
      { to: '/login', label: 'ورود' },
      { to: '/register', label: 'ثبت‌نام' },
      { to: '/dashboard', label: 'داشبورد' },
      { to: '/dashboard/notifications', label: 'اعلان‌ها' },
    ],
  },
]
</script>

<template>
  <footer class="footer">
    <div class="footer-cta">
      <div>
        <strong>آرزویی داری که منتظر یک شروع است؟</strong>
        <span>در چند دقیقه ثبتش کن تا آدم‌های خوب آن را ببینند.</span>
      </div>
      <NuxtLink to="/create-wish" class="cta-btn">ثبت آرزو</NuxtLink>
    </div>

    <div class="footer-container">
      <div class="brand">
        <NuxtLink to="/" class="logo">
          <span class="logo-icon">آ</span>
          <span class="logo-text">
            <span>آرزو</span>
            <small>هر آرزو، یک امید</small>
          </span>
        </NuxtLink>

        <p>
          فضایی برای به اشتراک گذاشتن آرزوها و پیدا کردن آدم‌هایی
          که می‌توانند آن‌ها را به واقعیت تبدیل کنند.
        </p>
      </div>

      <nav v-for="col in columns" :key="col.title" class="footer-column" :aria-label="col.title">
        <h3>{{ col.title }}</h3>
        <NuxtLink v-for="l in col.links" :key="l.label" :to="l.to">{{ l.label }}</NuxtLink>
      </nav>
    </div>

    <div class="footer-bottom">
      <span>© {{ year }} تمامی حقوق برای آرزو محفوظ است.</span>
      <nav class="legal" aria-label="قوانین">
        <NuxtLink to="/terms">قوانین و شرایط</NuxtLink>
        <NuxtLink to="/privacy">حریم خصوصی</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer a { text-decoration: none; }

.footer {
  background: #14121c;
  color: #fff;
  padding: 0 20px 24px;
  margin-top: 70px;
}

.footer-cta {
  width: min(1150px, 100%);
  margin: 0 auto;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 26px 32px;
  border-radius: 22px;
  background: linear-gradient(120deg, #7b6bff, #5848e8);
  box-shadow: 0 18px 40px rgba(88, 72, 232, 0.35);
}
.footer-cta div { display: grid; gap: 4px; }
.footer-cta strong { font-size: 19px; }
.footer-cta span { color: #e6e2ff; font-size: 14px; }
.cta-btn {
  background: #fff;
  color: #4b3fd1;
  font-weight: 800;
  padding: 12px 26px;
  border-radius: 14px;
  transition: transform 0.2s ease;
}
.cta-btn:hover { transform: translateY(-2px); }

.footer-container {
  width: min(1150px, 100%);
  margin: -10px auto 0;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  padding-top: 8px;
}

.logo { display: inline-flex; align-items: center; gap: 10px; }
.logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #8b7bff, #5848e8);
  font-size: 22px;
  font-weight: 800;
}
.logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.logo-text > span { font-size: 18px; font-weight: 800; }
.logo-text small { margin-top: 3px; color: #a29fb8; font-size: 10px; }

.brand p { margin: 18px 0 0; color: #a29fb8; line-height: 2; font-size: 14px; max-width: 380px; }

.footer-column { display: flex; flex-direction: column; gap: 12px; }
.footer-column h3 { margin: 0 0 6px; font-size: 15px; }
.footer-column a { color: #a29fb8; font-size: 14px; width: fit-content; transition: color 0.2s ease, transform 0.2s ease; }
.footer-column a:hover { color: #fff; transform: translateX(-3px); }

.legal { display: flex; gap: 18px; }
.legal a { color: #a29fb8; }
.legal a:hover { color: #fff; }

.footer-bottom {
  width: min(1150px, 100%);
  margin: 48px auto 0;
  padding-top: 20px;
  border-top: 1px solid #2a2738;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  color: #8a869f;
  font-size: 13px;
}

@media (max-width: 900px) {
  .footer-container { grid-template-columns: 1fr 1fr; gap: 32px; }
  .brand { grid-column: 1 / -1; }
  .footer-cta { padding: 22px; }
}
@media (max-width: 520px) {
  .footer-container { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; }
}
</style>
