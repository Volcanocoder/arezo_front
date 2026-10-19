<template>
    <section class="cta">
      <div class="cta-box">
  
        <div class="content">
          <span class="badge">
            یک قدم کوچک، یک اتفاق بزرگ
          </span>
  
          <h2>
            شاید آرزوی یک نفر
            <span>با کمک تو واقعی شود.</span>
          </h2>
  
          <p>
            آرزوها را ببین، یکی را انتخاب کن و بخشی از یک اتفاق خوب باش.
          </p>
  
          <div class="actions">
            <NuxtLink
              to="/wishes"
              class="primary-btn"
            >
              دیدن آرزوها
            </NuxtLink>
  
            <NuxtLink
              to="/create-wish"
              class="secondary-btn"
            >
              ثبت آرزو
            </NuxtLink>
          </div>
        </div>
  
        <div class="visual">
          <div class="heart">
            ❤️
          </div>
        </div>
  
      </div>
    </section>
  </template>
  
  <style scoped>
  .cta {
    padding: 120px 20px;
    background: #ffffff;
  }
  
  .cta-box {
    width: min(1150px, 100%);
    min-height: 420px;
  
    margin: 0 auto;
  
    padding: 70px;
  
    display: flex;
    align-items: center;
    justify-content: space-between;
  
    gap: 50px;
  
    border-radius: 32px;
  
    background:
      linear-gradient(
        135deg,
        #f0eeff 0%,
        #fafaff 100%
      );
  }
  
  .content {
    max-width: 680px;
  }
  
  .badge {
    display: inline-flex;
  
    padding: 8px 15px;
  
    border-radius: 999px;
  
    background: #ffffff;
  
    color: var(--color-primary);
  
    font-size: 12px;
    font-weight: 700;
  }
  
  h2 {
    margin: 20px 0 15px;
  
    font-size: clamp(32px, 4vw, 52px);
    line-height: 1.4;
    font-weight: 800;
  }
  
  h2 span {
    display: block;
    color: var(--color-primary);
  }
  
  p {
    margin: 0;
  
    color: var(--color-muted);
  
    font-size: 15px;
    line-height: 2;
  }
  
  .actions {
    display: flex;
    gap: 12px;
  
    margin-top: 30px;
  }
  
  .primary-btn,
  .secondary-btn {
    height: 50px;
    padding: 0 24px;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    border-radius: 13px;
  
    font-size: 13px;
    font-weight: 700;
  
    transition: 0.2s ease;
  }
  
  .primary-btn {
    background: var(--color-primary);
    color: #ffffff;
  }
  
  .primary-btn:hover {
    background: var(--color-primary-dark);
  }
  
  .secondary-btn {
    background: #ffffff;
    color: var(--color-text);
  }
  
  .secondary-btn:hover {
    background: #f2f2f6;
  }
  
  .visual {
    width: 240px;
    height: 240px;
    flex-shrink: 0;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    border-radius: 50%;
  
    background: rgba(255, 255, 255, 0.7);
  }
  
  .heart {
    font-size: 92px;
  
    animation: float 3s ease-in-out infinite;
  }
  
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
  
    50% {
      transform: translateY(-10px);
    }
  }
  
  @media (max-width: 800px) {
    .cta-box {
      padding: 45px 25px;
  
      flex-direction: column;
      text-align: center;
    }
  
    .actions {
      justify-content: center;
    }
  
    .visual {
      width: 160px;
      height: 160px;
    }
  
    .heart {
      font-size: 65px;
    }
  }
  
  @media (max-width: 500px) {
    .actions {
      flex-direction: column;
    }
  
    .primary-btn,
    .secondary-btn {
      width: 100%;
    }
  }
  </style>