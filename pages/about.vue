<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'درباره ما | آرزو',
  meta: [
    { name: 'description', content: 'با هدف، ارزش‌ها و شیوه کار پلتفرم آرزو آشنا شوید.' },
  ],
})
</script>

<template>
  <main class="about-page">
    <section class="hero">
      <div class="hero-content">
        <span class="eyebrow"><span class="eyebrow-dot"></span> درباره آرزو</span>
        <h1>گاهی یک قدم کوچک،<br /><span>شروع یک اتفاق بزرگ است.</span></h1>
        <p class="hero-copy">
          آرزو فضایی است برای شنیده‌شدن نیازها و نزدیک‌تر شدن آدم‌ها به یکدیگر؛ جایی که هر آرزو با بررسی و احترام فرصت دیده‌شدن پیدا می‌کند.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/wishes" class="btn btn-primary">دیدن آرزوها <span aria-hidden="true">←</span></NuxtLink>
          <NuxtLink to="/how-it-works" class="btn btn-secondary">چطور کار می‌کند؟</NuxtLink>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="art-glow"></div>
        <div class="art-card card-back"><span class="tiny-star">✦</span></div>
        <div class="art-card card-front">
          <div class="heart-orbit"><span>♡</span></div>
          <div class="art-line long"></div>
          <div class="art-line medium"></div>
          <div class="art-tags"><span></span><span></span><span></span></div>
        </div>
        <div class="floating-note note-one"><span class="note-icon">♡</span><span>یک آرزو، یک امید</span></div>
        <div class="floating-note note-two"><span class="check-icon">✓</span><span>بررسی پیش از انتشار</span></div>
        <span class="art-spark spark-one">✦</span>
        <span class="art-spark spark-two">✧</span>
      </div>
    </section>

    <section class="mission section-wrap">
      <div class="section-heading">
        <span class="section-kicker">چرا آرزو؟</span>
        <h2>برای اینکه شنیده‌شدن،<br class="desktop-break" /> می‌تواند آغاز راه باشد.</h2>
      </div>
      <div class="mission-copy">
        <p>
          گاهی رسیدن به یک هدف، تهیه یک وسیله ضروری یا عبور از یک دوره سخت به کمک و همراهی دیگران نیاز دارد. آرزو تلاش می‌کند این نیازها را در قالب درخواست‌هایی روشن و قابل بررسی کنار هم قرار دهد.
        </p>
        <p>
          هدف ما ساختن فضایی محترمانه و قابل اعتماد است؛ فضایی که در آن درخواست‌ها پیش از انتشار بررسی شوند، اطلاعات خصوصی افراد محفوظ بماند و کاربران بتوانند درباره هر آرزو گفت‌وگو کنند.
        </p>
      </div>
    </section>

    <section class="values-section">
      <div class="section-wrap">
        <div class="center-heading">
          <span class="section-kicker">اصول ما</span>
          <h2>آرزو بر پایه چه ارزش‌هایی ساخته شده؟</h2>
          <p>همراهی وقتی ارزشمندتر است که با احترام، دقت و شفافیت همراه باشد.</p>
        </div>
        <div class="values-grid">
          <article class="value-card">
            <div class="value-icon lilac">⌕</div>
            <h3>بررسی پیش از انتشار</h3>
            <p>درخواست‌ها برای بررسی مدیر ارسال می‌شوند و فقط آرزوهای تأییدشده در فهرست عمومی قرار می‌گیرند.</p>
          </article>
          <article class="value-card">
            <div class="value-icon mint">♙</div>
            <h3>حفظ حریم خصوصی</h3>
            <p>اطلاعات تماس و مدارک خصوصی متقاضی در کارت‌های عمومی آرزو نمایش داده نمی‌شوند.</p>
          </article>
          <article class="value-card">
            <div class="value-icon peach">♡</div>
            <h3>گفت‌وگوی محترمانه</h3>
            <p>کاربران واردشده می‌توانند از طریق بخش پیام‌ها درباره آرزو گفت‌وگو و هماهنگی کنند.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="honesty section-wrap">
      <div class="honesty-icon" aria-hidden="true">i</div>
      <div>
        <h2>شفاف درباره امکانات فعلی</h2>
        <p>
          در حال حاضر ثبت و بررسی آرزوها، نمایش درخواست‌های تأییدشده و گفت‌وگو بین کاربران در دسترس است. پرداخت آنلاین هنوز فعال نشده است؛ بنابراین از طریق این سایت هنوز پرداختی انجام نمی‌شود.
        </p>
      </div>
      <NuxtLink to="/how-it-works" class="text-link">مراحل کار را ببین <span aria-hidden="true">←</span></NuxtLink>
    </section>

    <section class="final-cta">
      <div class="cta-pattern" aria-hidden="true">✦　♡　✧　♡　✦</div>
      <span class="section-kicker">هر همراهی از یک قدم شروع می‌شود</span>
      <h2>آماده‌ای یک آرزو را ببینی؟</h2>
      <p>آرزوهای تأییدشده را ببین یا درخواست خودت را برای بررسی ثبت کن.</p>
      <div class="hero-actions centered-actions">
        <NuxtLink to="/wishes" class="btn btn-white">دیدن آرزوها</NuxtLink>
        <NuxtLink to="/create-wish" class="btn btn-outline-white">ثبت یک آرزو</NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.about-page { color: var(--color-text); background: #fff; }
.hero { width: min(1180px, calc(100% - 40px)); min-height: 510px; margin: 0 auto; padding: 76px 0 66px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr); align-items: center; gap: 46px; }
.hero-content { position: relative; z-index: 1; }
.eyebrow, .section-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--color-primary); font-size: 12px; font-weight: 800; }
.eyebrow { padding: 8px 13px; border-radius: 999px; background: #f0eeff; }
.eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary); }
.hero h1 { margin: 22px 0 18px; font-size: clamp(34px, 4.4vw, 56px); font-weight: 900; line-height: 1.55; letter-spacing: -.6px; }
.hero h1 span { color: var(--color-primary); }
.hero-copy { max-width: 590px; margin: 0; color: var(--color-muted); font-size: 15px; line-height: 2.25; }
.hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
.btn { min-height: 48px; padding: 0 19px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border-radius: 13px; font-size: 12px; font-weight: 800; transition: transform .2s ease, background .2s ease, border-color .2s ease; }
.btn:hover { transform: translateY(-2px); }
.btn-primary { color: #fff; background: var(--color-primary); }
.btn-primary:hover { background: var(--color-primary-dark); }
.btn-secondary { color: var(--color-text); border: 1px solid #e9e7f3; background: #fff; }
.btn-secondary:hover { border-color: #d8d2ff; background: #faf9ff; }
.hero-art { min-height: 350px; position: relative; display: flex; align-items: center; justify-content: center; isolation: isolate; }
.art-glow { position: absolute; width: 310px; height: 310px; border-radius: 50%; background: radial-gradient(circle, #efedff 0%, #f8f7ff 56%, rgba(255,255,255,0) 72%); z-index: -1; }
.art-card { position: absolute; width: 245px; height: 270px; border-radius: 27px; border: 1px solid rgba(105, 86, 244, .11); box-shadow: 0 22px 55px rgba(46, 36, 112, .10); }
.card-back { transform: rotate(9deg) translate(10px, -2px); background: #dcd6ff; }
.card-front { padding: 30px 25px; transform: rotate(-5deg) translate(-6px, 8px); background: linear-gradient(155deg, #fff 4%, #faf9ff 100%); }
.heart-orbit { width: 112px; height: 112px; margin: 4px auto 28px; border: 1px solid #e1dcff; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #f0eeff, #fff 72%); }
.heart-orbit span { display: flex; align-items: center; justify-content: center; width: 66px; height: 66px; border-radius: 22px; transform: rotate(-8deg); background: var(--color-primary); color: #fff; font-size: 42px; line-height: 1; box-shadow: 0 10px 25px rgba(109,93,252,.25); }
.art-line { height: 8px; border-radius: 999px; background: #e8e5f9; margin: 10px auto; }
.art-line.long { width: 78%; }
.art-line.medium { width: 52%; opacity: .7; }
.art-tags { display: flex; justify-content: center; gap: 6px; margin-top: 17px; }
.art-tags span { width: 35px; height: 8px; border-radius: 20px; background: #e7e3ff; }
.art-tags span:first-child { background: #d4f2e4; }
.art-tags span:last-child { background: #ffeadc; }
.tiny-star { position: absolute; right: 26px; top: 19px; color: #fff; font-size: 30px; }
.floating-note { position: absolute; display: flex; align-items: center; gap: 9px; padding: 11px 14px; border: 1px solid #eeeafc; border-radius: 14px; background: rgba(255,255,255,.96); box-shadow: 0 12px 28px rgba(45, 35, 110, .08); color: #56536c; font-size: 10px; font-weight: 700; }
.note-one { top: 53px; right: -4px; }
.note-two { bottom: 45px; left: -8px; }
.note-icon, .check-icon { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 9px; background: #f0eeff; color: var(--color-primary); font-size: 17px; }
.check-icon { background: #e9f8f0; color: #288a59; font-size: 13px; }
.art-spark { position: absolute; color: #a69afc; }
.spark-one { top: 25px; left: 55px; font-size: 25px; }
.spark-two { bottom: 50px; right: 34px; font-size: 28px; }
.section-wrap { width: min(1080px, calc(100% - 40px)); margin: 0 auto; }
.mission { display: grid; grid-template-columns: .85fr 1.15fr; gap: 70px; padding-top: 66px; padding-bottom: 78px; border-top: 1px solid #f0eff6; }
.section-heading h2, .center-heading h2 { margin: 13px 0 0; font-size: clamp(25px, 3vw, 35px); line-height: 1.8; font-weight: 900; }
.mission-copy { padding-top: 6px; }
.mission-copy p { margin: 0 0 13px; color: var(--color-muted); font-size: 13px; line-height: 2.3; }
.values-section { padding: 72px 0 82px; background: #faf9ff; }
.center-heading { max-width: 680px; margin: 0 auto 34px; text-align: center; }
.center-heading h2 { font-size: clamp(25px, 3vw, 34px); }
.center-heading p { margin: 8px 0 0; color: var(--color-muted); font-size: 13px; line-height: 2; }
.values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.value-card { padding: 25px 23px; border: 1px solid #eeecf7; border-radius: 19px; background: #fff; }
.value-icon { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 19px; border-radius: 15px; font-size: 23px; font-weight: 800; }
.value-icon.lilac { background: #f0eeff; color: var(--color-primary); }
.value-icon.mint { background: #eaf8f0; color: #278653; }
.value-icon.peach { background: #fff0e6; color: #c27642; }
.value-card h3 { margin: 0 0 9px; font-size: 15px; font-weight: 900; }
.value-card p { margin: 0; color: var(--color-muted); font-size: 12px; line-height: 2.15; }
.honesty { display: flex; align-items: flex-start; gap: 15px; margin-top: 44px; margin-bottom: 72px; padding: 22px; border: 1px solid #e9e5ff; border-radius: 18px; background: #fcfbff; }
.honesty-icon { flex-shrink: 0; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: #f0eeff; color: var(--color-primary); font-family: serif; font-weight: 900; }
.honesty h2 { margin: 0 0 5px; font-size: 14px; font-weight: 900; }
.honesty p { margin: 0; color: var(--color-muted); font-size: 11px; line-height: 2; }
.text-link { flex-shrink: 0; margin-right: auto; padding-top: 8px; color: var(--color-primary); font-size: 11px; font-weight: 800; }
.final-cta { position: relative; overflow: hidden; padding: 60px 20px 66px; background: var(--color-primary); color: #fff; text-align: center; }
.cta-pattern { margin-bottom: 15px; color: rgba(255,255,255,.27); font-size: 19px; letter-spacing: 9px; }
.final-cta .section-kicker { color: #e4e0ff; }
.final-cta h2 { margin: 13px 0 8px; font-size: clamp(25px, 3.5vw, 36px); font-weight: 900; }
.final-cta p { margin: 0; color: rgba(255,255,255,.83); font-size: 13px; line-height: 2; }
.centered-actions { justify-content: center; margin-top: 24px; }
.btn-white { background: #fff; color: var(--color-primary); }
.btn-outline-white { color: #fff; border: 1px solid rgba(255,255,255,.55); background: transparent; }
.btn-outline-white:hover { background: rgba(255,255,255,.1); }
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; gap: 15px; padding-top: 52px; } .hero-content { text-align: center; } .hero-copy { margin: 0 auto; } .hero-actions { justify-content: center; } .hero-art { min-height: 330px; } .mission { grid-template-columns: 1fr; gap: 20px; padding-top: 50px; padding-bottom: 55px; } .values-grid { grid-template-columns: 1fr; } .value-card { display: grid; grid-template-columns: 52px 1fr; gap: 0 13px; } .value-icon { grid-row: span 2; margin-bottom: 0; } .value-card h3 { align-self: end; } .honesty { flex-wrap: wrap; } .honesty > div:nth-child(2) { flex: 1; min-width: 190px; } .text-link { width: 100%; margin-right: 49px; padding-top: 0; } }
@media (max-width: 520px) { .hero { width: min(100% - 30px, 1180px); } .hero h1 { font-size: 32px; } .hero-copy { font-size: 13px; } .hero-art { min-height: 295px; transform: scale(.9); margin: -10px 0; } .note-one { right: -2px; } .note-two { left: 0; } .section-wrap { width: calc(100% - 30px); } .center-heading { text-align: right; } .values-section { padding: 55px 0; } .honesty { margin-top: 28px; margin-bottom: 48px; padding: 17px; } .final-cta { padding: 48px 18px; } .hero-actions .btn { width: 100%; } }
</style>
