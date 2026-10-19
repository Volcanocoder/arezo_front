<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'چطور کار می‌کند؟ | آرزو',
  meta: [
    { name: 'description', content: 'مراحل ثبت، بررسی و مشاهده آرزوها در پلتفرم آرزو.' },
  ],
})

const steps = [
  {
    number: '۰۱',
    icon: '✍',
    title: 'آرزویت را ثبت کن',
    description: 'پس از ورود به حساب کاربری، عنوان، توضیحات، شهر، مبلغ موردنیاز و اطلاعات لازم را وارد کن. می‌توانی در صورت نیاز تصویر و مدارک پشتیبان را هم ارسال کنی.',
    tone: 'lilac',
  },
  {
    number: '۰۲',
    icon: '⌕',
    title: 'درخواست بررسی می‌شود',
    description: 'آرزو پس از ثبت، مستقیماً در فهرست عمومی قرار نمی‌گیرد. ابتدا مدیر آن را بررسی می‌کند و در صورت نیاز می‌تواند اطلاعات تکمیلی درخواست کند.',
    tone: 'peach',
  },
  {
    number: '۰۳',
    icon: '♡',
    title: 'آرزوی تأییدشده دیده می‌شود',
    description: 'پس از تأیید، آرزو در فهرست عمومی قرار می‌گیرد تا بازدیدکنندگان بتوانند عنوان، توضیحات، شهر، مبلغ موردنیاز و تصویر عمومی آن را ببینند.',
    tone: 'mint',
  },
  {
    number: '۰۴',
    icon: '☏',
    title: 'درباره آرزو گفت‌وگو کنید',
    description: 'کاربر واردشده می‌تواند از صفحه جزئیات آرزو گفت‌وگو را شروع کند. پیام‌ها در پنل کاربری نگهداری می‌شوند و اطلاعات تماس و مدارک خصوصی در صفحه عمومی منتشر نمی‌شوند.',
    tone: 'blue',
  },
]
</script>

<template>
  <main class="how-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> راهنمای استفاده از آرزو</span>
        <h1>از ثبت یک آرزو<br /><span>تا شروع یک همراهی</span></h1>
        <p>مراحل کار ساده‌اند: درخواست ثبت می‌شود، بررسی می‌شود و پس از تأیید، برای دیگران قابل مشاهده خواهد بود.</p>
        <div class="hero-actions">
          <NuxtLink to="/create-wish" class="btn btn-primary">ثبت آرزو <span aria-hidden="true">←</span></NuxtLink>
          <NuxtLink to="/wishes" class="btn btn-secondary">دیدن آرزوها</NuxtLink>
        </div>
      </div>
      <div class="hero-side" aria-hidden="true">
        <div class="circle circle-large"></div>
        <div class="circle circle-small"></div>
        <div class="route-line"></div>
        <div class="route-point point-one"><span>۱</span></div>
        <div class="route-point point-two"><span>۲</span></div>
        <div class="route-point point-three"><span>۳</span></div>
        <div class="route-point point-four"><span>۴</span></div>
        <div class="route-card"><span class="route-heart">♡</span><strong>هر قدم، نزدیک‌تر</strong><small>با احترام و شفافیت</small></div>
      </div>
    </section>

    <section class="steps-section">
      <div class="section-wrap">
        <div class="section-heading">
          <span class="section-kicker">چهار گام ساده</span>
          <h2>آرزو چطور کار می‌کند؟</h2>
          <p>در هر مرحله تلاش می‌کنیم اطلاعات روشن باشد و حریم خصوصی افراد حفظ شود.</p>
        </div>
        <div class="steps-list">
          <article v-for="step in steps" :key="step.number" class="step-card">
            <div class="step-number">{{ step.number }}</div>
            <div class="step-icon" :class="step.tone">{{ step.icon }}</div>
            <div class="step-copy">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
            <span class="step-check" aria-hidden="true">✓</span>
          </article>
        </div>
      </div>
    </section>

    <section class="privacy-section">
      <div class="privacy-card">
        <div class="privacy-icon" aria-hidden="true">♙</div>
        <div class="privacy-copy">
          <span class="section-kicker">اعتماد و حریم خصوصی</span>
          <h2>همه اطلاعات برای همه نمایش داده نمی‌شود.</h2>
          <p>صفحه عمومی فقط اطلاعات لازم برای شناخت آرزو را نمایش می‌دهد. شماره تماس، ایمیل و مدارک خصوصی متقاضی برای بازدیدکنندگان عمومی منتشر نمی‌شوند. لطفاً در پیام‌ها نیز اطلاعات تماس یا بانکی حساس ارسال نکن.</p>
        </div>
      </div>
    </section>

    <section class="payment-note section-wrap">
      <div class="payment-icon" aria-hidden="true">ⓘ</div>
      <div>
        <h2>وضعیت پرداخت آنلاین</h2>
        <p>در حال حاضر امکان پرداخت آنلاین از طریق درگاه در آرزو فعال نشده است. می‌توانی آرزوها را ببینی و درباره آن‌ها گفت‌وگو کنی، اما این صفحه به معنی فعال بودن دریافت یا انتقال وجه نیست.</p>
      </div>
    </section>

    <section class="faq-section section-wrap">
      <div class="section-heading compact-heading">
        <span class="section-kicker">پرسش‌های رایج</span>
        <h2>قبل از شروع، این‌ها را بدان</h2>
      </div>
      <div class="faq-grid">
        <article class="faq-card">
          <h3>چرا آرزوی من فوراً نمایش داده نمی‌شود؟</h3>
          <p>درخواست‌ها ابتدا برای بررسی مدیر ارسال می‌شوند. فقط درخواست‌های تأییدشده در فهرست عمومی قرار می‌گیرند.</p>
        </article>
        <article class="faq-card">
          <h3>آیا اطلاعات تماس من منتشر می‌شود؟</h3>
          <p>اطلاعات تماس و مدارک خصوصی در صفحه عمومی نمایش داده نمی‌شوند. در گفتگو هم از فرستادن اطلاعات حساس خودداری کن.</p>
        </article>
        <article class="faq-card">
          <h3>آیا می‌توانم همین حالا پرداخت کنم؟</h3>
          <p>خیر، درگاه پرداخت هنوز فعال نشده است. بخش انتخاب مبلغ به‌تنهایی پرداخت یا تراکنش مالی ایجاد نمی‌کند.</p>
        </article>
        <article class="faq-card">
          <h3>چطور درباره یک آرزو سؤال بپرسم؟</h3>
          <p>پس از ورود به حساب، صفحه جزئیات آرزو را باز کن و از گزینه گفت‌وگو برای شروع مکالمه استفاده کن.</p>
        </article>
      </div>
    </section>

    <section class="final-cta">
      <span class="section-kicker">قدم بعدی با توست</span>
      <h2>یک آرزو را پیدا کن یا آرزوی خودت را ثبت کن.</h2>
      <p>می‌توانی از همین حالا با روند کار آشنا شوی و آرزوهای تأییدشده را ببینی.</p>
      <div class="hero-actions centered-actions">
        <NuxtLink to="/wishes" class="btn btn-white">دیدن آرزوها</NuxtLink>
        <NuxtLink to="/create-wish" class="btn btn-outline-white">ثبت آرزو</NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.how-page { color: var(--color-text); background: #fff; }
.hero { width: min(1180px, calc(100% - 40px)); min-height: 435px; margin: 0 auto; padding: 65px 0 55px; display: grid; grid-template-columns: 1.1fr .9fr; align-items: center; gap: 50px; }
.eyebrow, .section-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--color-primary); font-size: 12px; font-weight: 800; }
.eyebrow { padding: 8px 13px; border-radius: 999px; background: #f0eeff; }
.eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); }
.hero h1 { margin: 20px 0 15px; font-size: clamp(35px, 4.4vw, 54px); line-height: 1.55; font-weight: 900; }
.hero h1 span { color: var(--color-primary); }
.hero-copy > p { max-width: 570px; margin: 0; color: var(--color-muted); font-size: 14px; line-height: 2.3; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 25px; }
.btn { min-height: 48px; padding: 0 19px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border-radius: 13px; font-size: 12px; font-weight: 800; transition: .2s ease; }
.btn:hover { transform: translateY(-2px); }
.btn-primary { color: #fff; background: var(--color-primary); }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-secondary { border: 1px solid #e9e7f3; background: #fff; color: var(--color-text); }
.btn-secondary:hover { background: #faf9ff; border-color: #d8d2ff; }
.hero-side { position: relative; min-height: 300px; display: grid; place-items: center; isolation: isolate; }
.circle { position: absolute; border-radius: 50%; z-index: -1; }
.circle-large { width: 285px; height: 285px; background: #f4f1ff; }
.circle-small { width: 210px; height: 210px; border: 1px dashed #c9c0ff; }
.route-line { position: absolute; width: 175px; height: 174px; border: 2px dashed #bdb1ff; border-right-color: transparent; border-radius: 50%; transform: rotate(-28deg); }
.route-point { position: absolute; width: 39px; height: 39px; display: grid; place-items: center; border: 4px solid #fff; border-radius: 50%; color: #fff; background: var(--color-primary); box-shadow: 0 8px 18px rgba(109,93,252,.2); font-size: 12px; font-weight: 900; }
.point-one { top: 35px; right: 80px; }.point-two { top: 110px; left: 45px; background: #e99a67; }.point-three { bottom: 48px; left: 115px; background: #44aa7c; }.point-four { top: 115px; right: 40px; background: #8a7df8; }
.route-card { width: 178px; min-height: 150px; padding: 22px 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #eeeafc; border-radius: 24px; background: rgba(255,255,255,.95); box-shadow: 0 18px 45px rgba(52,43,111,.1); transform: rotate(-4deg); }
.route-heart { width: 53px; height: 53px; display: grid; place-items: center; margin-bottom: 12px; border-radius: 17px; background: #f0eeff; color: var(--color-primary); font-size: 34px; }
.route-card strong { font-size: 13px; font-weight: 900; }.route-card small { margin-top: 6px; color: var(--color-muted); font-size: 10px; }
.section-wrap { width: min(1040px, calc(100% - 40px)); margin: 0 auto; }
.steps-section { padding: 66px 0 78px; background: #faf9ff; }
.section-heading { margin-bottom: 30px; }.section-heading h2 { margin: 10px 0 8px; font-size: clamp(26px, 3vw, 35px); font-weight: 900; line-height: 1.8; }.section-heading > p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 2; }
.steps-list { position: relative; display: flex; flex-direction: column; gap: 14px; }.steps-list::before { content: ''; position: absolute; top: 46px; bottom: 46px; right: 28px; width: 2px; background: #e3defb; }
.step-card { position: relative; display: grid; grid-template-columns: 58px 55px 1fr 25px; align-items: center; gap: 18px; padding: 22px; border: 1px solid #eeecf6; border-radius: 19px; background: #fff; }
.step-number { position: relative; z-index: 1; width: 56px; height: 56px; display: grid; place-items: center; border: 1px solid #e7e2ff; border-radius: 17px; background: #f7f5ff; color: var(--color-primary); font-size: 14px; font-weight: 900; }
.step-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 15px; font-size: 23px; }.step-icon.lilac { background: #f0eeff; color: var(--color-primary); }.step-icon.peach { background: #fff0e6; color: #c27642; }.step-icon.mint { background: #e9f8f0; color: #278653; }.step-icon.blue { background: #eaf2ff; color: #477cce; }
.step-copy h3 { margin: 0 0 7px; font-size: 15px; font-weight: 900; }.step-copy p { margin: 0; color: var(--color-muted); font-size: 12px; line-height: 2.15; }
.step-check { width: 23px; height: 23px; display: grid; place-items: center; border-radius: 50%; background: #edf8f1; color: #278653; font-size: 12px; font-weight: 900; }
.privacy-section { padding: 70px 20px 20px; }.privacy-card { width: min(1040px, 100%); margin: 0 auto; padding: 27px; display: flex; align-items: flex-start; gap: 18px; border: 1px solid #e9e5ff; border-radius: 21px; background: #fcfbff; }
.privacy-icon, .payment-icon { flex-shrink: 0; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 15px; background: #f0eeff; color: var(--color-primary); font-size: 22px; font-weight: 900; }
.privacy-copy h2 { margin: 9px 0; font-size: 20px; font-weight: 900; }.privacy-copy p { margin: 0; color: var(--color-muted); font-size: 12px; line-height: 2.2; }
.payment-note { display: flex; align-items: flex-start; gap: 15px; margin-top: 22px; margin-bottom: 70px; padding: 21px; border: 1px solid #f3dfc6; border-radius: 18px; background: #fffaf3; }.payment-icon { width: 36px; height: 36px; border-radius: 11px; background: #fff0db; color: #a96b28; font-size: 17px; }.payment-note h2 { margin: 0 0 6px; font-size: 14px; font-weight: 900; }.payment-note p { margin: 0; color: #796951; font-size: 12px; line-height: 2.1; }
.faq-section { padding-bottom: 76px; }.compact-heading { margin-bottom: 25px; }.faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }.faq-card { padding: 21px; border: 1px solid #eeeef4; border-radius: 16px; background: #fff; }.faq-card h3 { margin: 0 0 9px; font-size: 13px; font-weight: 900; }.faq-card p { margin: 0; color: var(--color-muted); font-size: 11px; line-height: 2.1; }
.final-cta { padding: 58px 20px 64px; background: var(--color-primary); color: #fff; text-align: center; }.final-cta .section-kicker { color: #e4e0ff; }.final-cta h2 { margin: 13px 0 9px; font-size: clamp(24px, 3.4vw, 34px); font-weight: 900; }.final-cta p { margin: 0; color: rgba(255,255,255,.83); font-size: 13px; line-height: 2; }.centered-actions { justify-content: center; margin-top: 23px; }.btn-white { background: #fff; color: var(--color-primary); }.btn-outline-white { border: 1px solid rgba(255,255,255,.55); color: #fff; background: transparent; }.btn-outline-white:hover { background: rgba(255,255,255,.1); }
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; gap: 20px; padding-top: 48px; }.hero-copy { text-align: center; }.hero-copy > p { margin: auto; }.hero-actions { justify-content: center; }.hero-side { min-height: 285px; }.step-card { grid-template-columns: 48px 1fr 24px; gap: 13px; }.step-number { width: 47px; height: 47px; border-radius: 14px; }.step-icon { display: none; }.steps-list::before { right: 23px; }.privacy-card { padding: 21px; }.faq-grid { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .hero { width: calc(100% - 30px); }.hero h1 { font-size: 32px; }.section-wrap { width: calc(100% - 30px); }.steps-section { padding: 50px 0; }.section-heading h2 { font-size: 26px; }.step-card { grid-template-columns: 42px 1fr; padding: 17px; gap: 12px; }.step-number { width: 42px; height: 42px; font-size: 12px; }.step-check { display: none; }.step-copy h3 { font-size: 13px; }.step-copy p { font-size: 11px; }.steps-list::before { right: 21px; }.privacy-section { padding: 45px 15px 15px; }.privacy-card { gap: 12px; padding: 17px; }.privacy-icon { width: 36px; height: 36px; }.privacy-copy h2 { font-size: 16px; }.payment-note { margin-bottom: 50px; padding: 16px; }.final-cta { padding: 48px 15px; }.hero-actions .btn { width: 100%; } }
</style>
