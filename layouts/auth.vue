<script setup lang="ts">
onMounted(() => { document.body.style.overflow = '' })
</script>

<template>
    <div class="auth-layout">
  
      <header class="auth-header">
        <NuxtLink to="/" class="brand">
          <img src="/logo-mark.svg" alt="" class="brand-icon" width="42" height="42" />
  
          <span class="brand-text">
            هم‌آرزو
          </span>
        </NuxtLink>
      </header>
  
      <main class="auth-main">
        <slot />
      </main>
  
      <footer class="auth-footer">
        © {{ new Date().getFullYear() }} هم‌آرزو
      </footer>
  
    </div>
  </template>
  
  <style scoped>
  .auth-layout {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
  
    display: flex;
    flex-direction: column;
  
    background:
      radial-gradient(
        circle at 85% 10%,
        rgba(109, 93, 252, 0.10),
        transparent 30%
      ),
      #f8f8fc;
  }
  
  /* Header */
  
  .auth-header {
    height: 80px;
  
    display: flex;
    align-items: center;
  
    padding: 0 35px;
  }
  
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  
    color: var(--color-text);
    text-decoration: none;
  }
  
  .brand-icon { width: 42px; height: 42px; flex-shrink: 0; object-fit: contain; }
  
  .brand-text {
    font-size: 19px;
    font-weight: 800;
  }
  
  /* Main */
  
  .auth-main {
    flex: 1;
  
    display: flex;
    align-items: center;
    justify-content: center;
  
    padding: 40px 20px;
  }
  
  /* Footer */
  
  .auth-footer {
    padding: 20px;
  
    color: #9999a3;
  
    font-size: 10px;
    text-align: center;
  }
  
  @media (max-width: 500px) {
    .auth-header {
      height: 70px;
      padding: 0 20px;
    }
  
    .auth-main {
      padding: 30px 15px 50px;
    }
  }
  </style>
