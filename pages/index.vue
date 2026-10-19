<template>
  <main class="home" dir="rtl">
    <section class="hero">
      <div class="hero-orb hero-orb-one" aria-hidden="true"></div>
      <div class="hero-orb hero-orb-two" aria-hidden="true"></div>
      <div class="hero-grid" aria-hidden="true"></div>

      <div class="hero-container">
        <div class="hero-copy">
          <div class="badge">
            <span class="badge-mark">✦</span>
            جایی برای واقعی شدن آرزوها
          </div>

          <h1>
            گاهی یک قدم کوچک،
            <span>شروع یک اتفاق بزرگ است.</span>
          </h1>

          <p class="hero-description">
            اینجا می‌توانی آرزویت را با دیگران به اشتراک بگذاری یا قدمی برای برآورده شدن آرزوی شخص دیگری برداری.
            شاید کمک تو همان امیدی باشد که کسی منتظرش است.
          </p>

          <div class="hero-actions">
            <NuxtLink to="/create-wish" class="primary-btn">
              <span>آرزویی دارم</span>
              <span class="btn-arrow" aria-hidden="true">←</span>
            </NuxtLink>

            <NuxtLink to="/wishes" class="secondary-btn">
              <span class="secondary-icon" aria-hidden="true">♡</span>
              می‌خواهم کمک کنم
            </NuxtLink>
          </div>

          <div class="hero-note">
            <span class="note-check" aria-hidden="true">✓</span>
            <span>آرزوها پیش از نمایش عمومی بررسی می‌شوند.</span>
          </div>
        </div>

        <div class="hero-visual" role="img" aria-label="تصویرسازی مفهومی از ثبت آرزو و کمک به دیگران">
          <div class="visual-halo halo-one" aria-hidden="true"></div>
          <div class="visual-halo halo-two" aria-hidden="true"></div>
          <div class="visual-spark spark-one" aria-hidden="true">✦</div>
          <div class="visual-spark spark-two" aria-hidden="true">✧</div>

          <div class="floating-note floating-note-top">
            <span class="floating-icon heart-icon" aria-hidden="true">♡</span>
            <span>هر قدم، ارزشمند است</span>
          </div>

          <div class="wish-illustration-card">
            <div class="illustration-card-top">
              <span class="sample-label">یک ایده از آرزو</span>
              <span class="illustration-heart" aria-hidden="true">♡</span>
            </div>

            <div class="illustration-art" aria-hidden="true">
              <div class="art-circle art-circle-back"></div>
              <div class="art-circle art-circle-front"></div>
              <div class="book book-back"></div>
              <div class="book book-front">
                <span class="book-line line-one"></span>
                <span class="book-line line-two"></span>
                <span class="book-line line-three"></span>
              </div>
              <div class="art-star star-left">✦</div>
              <div class="art-star star-right">✧</div>
              <div class="art-leaf leaf-left"></div>
              <div class="art-leaf leaf-right"></div>
            </div>

            <div class="illustration-copy">
              <span class="illustration-category">تحصیلی · امیدبخش</span>
              <h2>هر آرزو، یک شروع تازه</h2>
              <p>گاهی یک همراهی کوچک، مسیر رسیدن به یک هدف را هموارتر می‌کند.</p>
            </div>

            <div class="illustration-footer">
              <span class="footer-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span>با هم، برای امیدهای بیشتر</span>
            </div>
          </div>

          <div class="floating-note floating-note-bottom">
            <span class="floating-icon hands-icon" aria-hidden="true">✳</span>
            <span>از توان خودت شروع کن</span>
          </div>
        </div>
      </div>

      <div class="hero-bottom" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </section>

    <PriorityWishes />
    <HowItWorks />
    <WishCategories />
    <LatestWishes />
    <WishCta />
  </main>
</template>

<style scoped>
.home {
  min-height: calc(100vh - 82px);
  overflow: hidden;
  background: #fff;
}

.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 690px;
  display: flex;
  align-items: center;
  padding: 66px 24px 74px;
  background:
    radial-gradient(ellipse at 82% 18%, rgba(121, 103, 245, 0.10), transparent 36%),
    radial-gradient(ellipse at 12% 83%, rgba(196, 187, 255, 0.15), transparent 30%),
    #fbfaff;
}

.hero-grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: .2;
  background-image: radial-gradient(#bbb5e9 0.8px, transparent 0.8px);
  background-size: 23px 23px;
  mask-image: linear-gradient(90deg, transparent 0%, #000 30%, #000 80%, transparent 100%);
}

.hero-orb {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
}

.hero-orb-one {
  width: 430px;
  height: 430px;
  top: -230px;
  right: -130px;
  border: 1px solid rgba(112, 95, 226, .13);
}

.hero-orb-two {
  width: 310px;
  height: 310px;
  bottom: -210px;
  left: 8%;
  background: rgba(221, 216, 255, .30);
}

.hero-container {
  width: min(1160px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, .95fr);
  align-items: center;
  gap: clamp(38px, 7vw, 95px);
}

.hero-copy {
  max-width: 610px;
  padding: 15px 0;
}

.badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 15px;
  margin-bottom: 25px;
  border: 1px solid #e5e0ff;
  border-radius: 999px;
  background: rgba(255, 255, 255, .82);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 750;
  box-shadow: 0 6px 24px rgba(72, 57, 162, .045);
}

.badge-mark {
  color: #8a7af0;
  font-size: 15px;
}

.hero h1 {
  margin: 0;
  color: #23213b;
  font-size: clamp(37px, 4.3vw, 62px);
  line-height: 1.45;
  font-weight: 900;
  letter-spacing: -1.2px;
}

.hero h1 span {
  display: block;
  color: var(--color-primary);
}

.hero-description {
  max-width: 570px;
  margin: 23px 0 30px;
  color: #747286;
  font-size: 15px;
  line-height: 2.25;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.primary-btn,
.secondary-btn {
  min-height: 53px;
  padding: 0 21px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 15px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}

.primary-btn {
  color: #fff;
  background: var(--color-primary);
  box-shadow: 0 10px 22px rgba(92, 75, 200, .20);
}

.primary-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 14px 27px rgba(92, 75, 200, .25);
}

.btn-arrow {
  font-size: 18px;
  transition: transform .2s ease;
}

.primary-btn:hover .btn-arrow {
  transform: translateX(-3px);
}

.secondary-btn {
  border: 1px solid #e7e5f2;
  background: rgba(255, 255, 255, .78);
  color: #39364f;
}

.secondary-btn:hover {
  border-color: #d5cffb;
  background: #fff;
  transform: translateY(-2px);
}

.secondary-icon {
  color: var(--color-primary);
  font-size: 21px;
  line-height: 1;
}

.hero-note {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  color: #858397;
  font-size: 11px;
  line-height: 1.8;
}

.note-check {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e9f7ef;
  color: #29915d;
  font-size: 11px;
  font-weight: 900;
}

/* Decorative wish illustration */
.hero-visual {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-halo {
  position: absolute;
  border: 1px solid rgba(121, 105, 232, .17);
  border-radius: 50%;
  pointer-events: none;
}

.halo-one {
  width: 400px;
  height: 400px;
}

.halo-two {
  width: 475px;
  height: 475px;
  border-style: dashed;
  border-color: rgba(121, 105, 232, .13);
}

.wish-illustration-card {
  position: relative;
  z-index: 2;
  width: min(345px, 80%);
  padding: 19px;
  border: 1px solid rgba(255,255,255,.95);
  border-radius: 25px;
  background: rgba(255, 255, 255, .91);
  box-shadow: 0 30px 90px rgba(60, 49, 132, .15), 0 5px 20px rgba(60, 49, 132, .05);
  transform: rotate(-2deg);
  backdrop-filter: blur(12px);
}

.illustration-card-top,
.illustration-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sample-label {
  color: #89869c;
  font-size: 10px;
  font-weight: 700;
}

.illustration-heart {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f1eeff;
  color: var(--color-primary);
  font-size: 21px;
}

.illustration-art {
  position: relative;
  height: 180px;
  margin: 14px 0 18px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(145deg, #f1efff 0%, #e9e5ff 58%, #faf9ff 100%);
}

.art-circle {
  position: absolute;
  border-radius: 50%;
}

.art-circle-back {
  width: 152px;
  height: 152px;
  top: 17px;
  right: 83px;
  background: rgba(255,255,255,.56);
}

.art-circle-front {
  width: 94px;
  height: 94px;
  top: 64px;
  right: 118px;
  background: rgba(189, 179, 255, .55);
}

.book {
  position: absolute;
  top: 49px;
  width: 83px;
  height: 102px;
  border-radius: 7px 10px 10px 7px;
  box-shadow: 0 10px 18px rgba(65, 54, 140, .12);
}

.book-back {
  right: 105px;
  background: #8c7ae8;
  transform: rotate(12deg);
}

.book-front {
  right: 135px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 23px;
  background: #fff;
  border-right: 5px solid #c2b8ff;
  transform: rotate(-8deg);
}

.book-line {
  display: block;
  height: 4px;
  border-radius: 10px;
  background: #e8e4ff;
}

.line-one { width: 43px; }
.line-two { width: 34px; }
.line-three { width: 39px; }

.art-star {
  position: absolute;
  color: #8a79e9;
  font-size: 22px;
}

.star-left { top: 37px; left: 47px; }
.star-right { right: 49px; bottom: 34px; font-size: 28px; }

.art-leaf {
  position: absolute;
  width: 13px;
  height: 25px;
  border-radius: 100% 0 100% 0;
  background: #a9c9b7;
}

.leaf-left { bottom: 21px; left: 82px; transform: rotate(-25deg); }
.leaf-right { bottom: 36px; left: 66px; transform: rotate(23deg); }

.illustration-copy {
  padding: 0 2px 17px;
}

.illustration-category {
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 800;
}

.illustration-copy h2 {
  margin: 7px 0 5px;
  color: #292641;
  font-size: 18px;
  font-weight: 900;
}

.illustration-copy p {
  margin: 0;
  color: #828094;
  font-size: 10px;
  line-height: 2;
}

.illustration-footer {
  padding-top: 13px;
  border-top: 1px solid #f0eef8;
  color: #89869d;
  font-size: 9px;
}

.footer-dots {
  display: inline-flex;
  direction: ltr;
  align-items: center;
  gap: 4px;
}

.footer-dots i {
  width: 5px;
  height: 5px;
  display: block;
  border-radius: 50%;
  background: #c7c0fa;
}

.footer-dots i:nth-child(2) { background: #9a8ded; }
.footer-dots i:nth-child(3) { background: #6f5ddd; }

.floating-note {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border: 1px solid rgba(255,255,255,.95);
  border-radius: 14px;
  background: rgba(255,255,255,.94);
  color: #55516d;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 12px 35px rgba(60, 49, 132, .10);
  white-space: nowrap;
}

.floating-note-top { top: 70px; right: -3px; }
.floating-note-bottom { bottom: 63px; left: -8px; }

.floating-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 20px;
}

.heart-icon { background: #f2efff; color: #7c6ce4; }
.hands-icon { background: #e9f6ef; color: #389a69; }

.visual-spark {
  position: absolute;
  z-index: 1;
  color: #9a8ce9;
}

.spark-one { top: 32px; left: 27px; font-size: 23px; }
.spark-two { right: 25px; bottom: 22px; font-size: 31px; }

.hero-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.hero-bottom span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d3cef4;
}

.hero-bottom span:nth-child(2) {
  width: 19px;
  border-radius: 99px;
  background: var(--color-primary);
}

@media (max-width: 980px) {
  .hero {
    min-height: auto;
    padding: 65px 24px 75px;
  }

  .hero-container {
    grid-template-columns: minmax(0, 1fr) minmax(300px, .8fr);
    gap: 24px;
  }

  .hero h1 {
    font-size: clamp(35px, 4.7vw, 50px);
  }

  .hero-visual { min-height: 430px; }
  .halo-one { width: 330px; height: 330px; }
  .halo-two { width: 390px; height: 390px; }
  .floating-note-top { right: -5px; }
  .floating-note-bottom { left: -5px; }
}

@media (max-width: 720px) {
  .hero {
    padding: 50px 20px 55px;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .hero-copy {
    max-width: 580px;
    margin: 0 auto;
    text-align: center;
  }

  .badge { margin: 0 auto 22px; }

  .hero h1 {
    font-size: clamp(35px, 8vw, 48px);
    letter-spacing: -.7px;
  }

  .hero-description {
    margin: 18px auto 25px;
    font-size: 14px;
  }

  .hero-actions { justify-content: center; }
  .hero-note { justify-content: center; }
  .hero-visual { min-height: 420px; margin-top: 4px; }
  .wish-illustration-card { width: min(330px, 78%); }
  .floating-note-top { top: 48px; right: 1%; }
  .floating-note-bottom { bottom: 38px; left: 1%; }
  .hero-bottom { display: none; }
}

@media (max-width: 430px) {
  .hero { padding: 43px 16px 48px; }
  .hero h1 { font-size: 34px; line-height: 1.55; }
  .hero-description { font-size: 13px; }
  .hero-actions { width: 100%; flex-direction: column; }
  .primary-btn, .secondary-btn { width: 100%; }
  .hero-visual { min-height: 375px; }
  .wish-illustration-card { width: 78%; padding: 14px; }
  .illustration-art { height: 155px; }
  .art-circle-back { right: 53px; }
  .art-circle-front { right: 88px; }
  .book-back { right: 75px; }
  .book-front { right: 105px; }
  .floating-note { gap: 6px; padding: 8px 10px; font-size: 9px; }
  .floating-note-top { top: 30px; }
  .floating-note-bottom { bottom: 25px; }
  .halo-one { width: 290px; height: 290px; }
  .halo-two { width: 340px; height: 340px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
