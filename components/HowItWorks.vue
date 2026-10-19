<template>
    <section class="how-it-works">
      <div class="container">
  
        <!-- Section Header -->
        <div class="section-header">
          <span class="section-badge">
            ساده و واقعی
          </span>
  
          <h2>
            چطور کار می‌کند؟
          </h2>
  
          <p>
            فقط سه قدم تا تبدیل یک آرزو به یک اتفاق واقعی فاصله دارید.
          </p>
        </div>
  
        <!-- Steps -->
        <div class="steps">
  
          <!-- Step 1 -->
          <div class="step-card">
            <div class="step-number">
              ۱
            </div>
  
            <div class="step-icon">
              ✨
            </div>
  
            <h3>
              آرزویت را ثبت کن
            </h3>
  
            <p>
              آرزویی که دوست داری برآورده شود را برای ما ثبت کن و داستانت را با دیگران به اشتراک بگذار.
            </p>
          </div>
  
          <!-- Step 2 -->
          <div class="step-card">
            <div class="step-number">
              ۲
            </div>
  
            <div class="step-icon">
              🤝
            </div>
  
            <h3>
              یک نفر تو را پیدا می‌کند
            </h3>
  
            <p>
              کسی که توانایی یا علاقه کمک کردن داشته باشد می‌تواند آرزوی تو را ببیند و برای برآورده کردن آن اقدام کند.
            </p>
          </div>
  
          <!-- Step 3 -->
          <div class="step-card">
            <div class="step-number">
              ۳
            </div>
  
            <div class="step-icon">
              ❤️
            </div>
  
            <h3>
              آرزو واقعی می‌شود
            </h3>
  
            <p>
              بعد از انجام شدن آرزو، داستان موفقیت ثبت می‌شود تا الهام‌بخش افراد بیشتری باشد.
            </p>
          </div>
  
        </div>
  
      </div>
    </section>
  </template>
  
  <style scoped>
  .how-it-works {
    padding: 120px 20px;
    background: #f8f8fc;
  }
  
  .container {
    width: min(1150px, 100%);
    margin: 0 auto;
  }
  
  /* Header */
  
  .section-header {
    text-align: center;
    max-width: 650px;
    margin: 0 auto 60px;
  }
  
  .section-badge {
    display: inline-flex;
    align-items: center;
  
    padding: 8px 16px;
    border-radius: 999px;
  
    background: #eceaff;
    color: var(--color-primary);
  
    font-size: 13px;
    font-weight: 700;
  }
  
  .section-header h2 {
    margin: 18px 0 12px;
  
    font-size: clamp(32px, 4vw, 48px);
    line-height: 1.3;
    font-weight: 800;
  }
  
  .section-header p {
    margin: 0;
  
    color: var(--color-muted);
    font-size: 16px;
    line-height: 2;
  }
  
  /* Steps */
  
  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  .step-card {
    position: relative;
  
    padding: 42px 30px 35px;
  
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 24px;
  
    text-align: center;
  
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }
  
  .step-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 50px rgba(40, 40, 80, 0.08);
  }
  
  .step-number {
    position: absolute;
    top: 18px;
    left: 18px;
  
    width: 34px;
    height: 34px;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    border-radius: 50%;
  
    background: #f0eeff;
    color: var(--color-primary);
  
    font-size: 13px;
    font-weight: 800;
  }
  
  .step-icon {
    width: 76px;
    height: 76px;
    margin: 0 auto 24px;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    border-radius: 22px;
  
    background: #f3f1ff;
  
    font-size: 34px;
  }
  
  .step-card h3 {
    margin: 0 0 14px;
  
    font-size: 20px;
    font-weight: 800;
  }
  
  .step-card p {
    margin: 0;
  
    color: var(--color-muted);
  
    font-size: 14px;
    line-height: 2;
  }
  
  /* Responsive */
  
  @media (max-width: 850px) {
    .steps {
      grid-template-columns: 1fr;
    }
  
    .how-it-works {
      padding: 80px 20px;
    }
  }
  </style>