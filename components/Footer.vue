<template>
    <footer class="footer">
      <div class="footer-container">
  
        <!-- Brand -->
        <div class="brand">
          <NuxtLink to="/" class="logo">
            <div class="logo-icon">
              آ
            </div>
  
            <div class="logo-text">
              <span>آرزو</span>
              <small>هر آرزو، یک امید</small>
            </div>
          </NuxtLink>
  
          <p>
            فضایی برای به اشتراک گذاشتن آرزوها و پیدا کردن آدم‌هایی
            که می‌توانند آن‌ها را به واقعیت تبدیل کنند.
          </p>
        </div>
  
        <!-- Links -->
        <div class="footer-column">
          <h3>آرزو</h3>
  
          <NuxtLink to="/">
            خانه
          </NuxtLink>
  
          <NuxtLink to="/wishes">
            آرزوها
          </NuxtLink>
  
          <NuxtLink to="/create-wish">
            ثبت آرزو
          </NuxtLink>
        </div>
  
        <div class="footer-column">
          <h3>درباره ما</h3>
  
          <NuxtLink to="/about">
            درباره ما
          </NuxtLink>
  
          <NuxtLink to="/how-it-works">
            چطور کار می‌کند؟
          </NuxtLink>
  
          <NuxtLink to="/contact">
            تماس با ما
          </NuxtLink>
        </div>
  
        <div class="footer-column">
          <h3>حساب کاربری</h3>
  
          <NuxtLink to="/login">
            ورود
          </NuxtLink>
  
          <NuxtLink to="/register">
            ثبت‌نام
          </NuxtLink>
  
          <NuxtLink to="/dashboard">
            داشبورد
          </NuxtLink>
        </div>
  
      </div>
  
      <div class="footer-bottom">
        <span>
          © {{ new Date().getFullYear() }} تمامی حقوق برای آرزو محفوظ است.
        </span>
  
        <div class="socials">
          <a href="#" aria-label="Instagram">
            Instagram
          </a>
  
          <a href="#" aria-label="Telegram">
            Telegram
          </a>
        </div>
      </div>
    </footer>
  </template>
  
  <style scoped>
  .footer {
    background: #17151f;
    color: #ffffff;
    padding: 80px 20px 25px;
  }
  
  .footer-container {
    width: min(1150px, 100%);
    margin: 0 auto;
  
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px;
  }
  
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  
  .logo-icon {
    width: 42px;
    height: 42px;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    border-radius: 13px;
  
    background: var(--color-primary);
    color: #ffffff;
  
    font-size: 21px;
    font-weight: 800;
  }
  
  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  
  .logo-text span {
    font-size: 18px;
    font-weight: 800;
  }
  
  .logo-text small {
    margin-top: 4px;
    color: #a9a6b6;
    font-size: 10px;
  }
  
  .brand p {
    max-width: 390px;
    margin: 22px 0 0;
  
    color: #aaa7b5;
    font-size: 13px;
    line-height: 2.1;
  }
  
  .footer-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  
  .footer-column h3 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 800;
  }
  
  .footer-column a {
    color: #aaa7b5;
    font-size: 13px;
    transition: 0.2s ease;
  }
  
  .footer-column a:hover {
    color: #ffffff;
  }
  
  .footer-bottom {
    width: min(1150px, 100%);
    margin: 60px auto 0;
    padding-top: 22px;
  
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  
    display: flex;
    align-items: center;
    justify-content: space-between;
  
    color: #858290;
    font-size: 11px;
  }
  
  .socials {
    display: flex;
    gap: 18px;
  }
  
  .socials a {
    color: #aaa7b5;
    transition: 0.2s ease;
  }
  
  .socials a:hover {
    color: #ffffff;
  }
  
  @media (max-width: 800px) {
    .footer-container {
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
    }
  
    .brand {
      grid-column: 1 / -1;
    }
  
    .footer-bottom {
      flex-direction: column;
      gap: 18px;
      text-align: center;
    }
  }
  
  @media (max-width: 500px) {
    .footer-container {
      grid-template-columns: 1fr 1fr;
    }
  
    .footer {
      padding-top: 60px;
    }
  }
  </style>