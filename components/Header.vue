<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

// Shared authentication state from composables/useAuth.ts
const { user, fetchUser, logout } = useAuth()

const authReady = ref(false)
const loggingOut = ref(false)
const authError = ref('')

const isAuthenticated = computed(() => Boolean(user.value))

const dashboardPath = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard'
})

const displayName = computed(() => user.value?.name || 'حساب کاربری')

onMounted(async () => {
  try {
    // Avoid an unnecessary request if the auth plugin already loaded the user.
    if (!user.value) {
      await fetchUser()
    }
  } catch {
    // A guest is a normal state; show login/register once auth check finishes.
  } finally {
    authReady.value = true
  }
})

const handleLogout = async () => {
  if (loggingOut.value) return

  loggingOut.value = true
  authError.value = ''

  try {
    await logout()
    await navigateTo('/')
  } catch (error) {
    console.error('Logout failed:', error)
    authError.value = 'خروج انجام نشد. دوباره تلاش کن.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo -->
      <NuxtLink to="/" class="logo">
        <div class="logo-icon">آ</div>
        <div class="logo-text">
          <span>آرزو</span>
          <small>هر آرزو، یک امید</small>
        </div>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="nav" aria-label="منوی اصلی">
        <NuxtLink to="/" class="nav-link">خانه</NuxtLink>
        <NuxtLink to="/wishes" class="nav-link">آرزوها</NuxtLink>
        <NuxtLink to="/about" class="nav-link">درباره ما</NuxtLink>
        <NuxtLink to="/how-it-works" class="nav-link">چطور کار می‌کند؟</NuxtLink>
      </nav>

      <!-- Auth Actions: wait for the auth check to avoid briefly showing login buttons -->
      <div v-if="authReady" class="actions">
        <template v-if="isAuthenticated">
          <NuxtLink :to="dashboardPath" class="login-btn">
            {{ displayName }}
          </NuxtLink>
          <button
            type="button"
            class="register-btn"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            {{ loggingOut ? 'در حال خروج...' : 'خروج' }}
          </button>
        </template>

        <template v-else>
          <NuxtLink to="/login" class="login-btn">ورود</NuxtLink>
          <NuxtLink to="/register" class="register-btn">ثبت‌نام</NuxtLink>
        </template>
      </div>

      <span v-if="authError" class="auth-error" role="alert">{{ authError }}</span>

      <!-- Mobile menu button (keeps the existing behavior) -->
      <button class="menu-btn" type="button" aria-label="باز کردن منو">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #eeeeee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  width: min(1200px, calc(100% - 40px));
  min-height: 82px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-size: 22px;
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
  color: var(--color-text);
}

.logo-text small {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 10px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-right: auto;
  margin-left: auto;
}

.nav-link {
  position: relative;
  color: #555;
  font-size: 14px;
  font-weight: 500;
  transition: 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-primary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.login-btn,
.register-btn {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: 0.2s ease;
}

.login-btn {
  color: var(--color-text);
  background: transparent;
}

.login-btn:hover {
  background: var(--color-surface);
}

.register-btn {
  border: 0;
  color: white;
  background: var(--color-primary);
  cursor: pointer;
}

.register-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.register-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.auth-error {
  color: #c2414b;
  font-size: 11px;
}

.menu-btn {
  display: none;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 12px;
  background: var(--color-surface);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.menu-btn span {
  width: 20px;
  height: 2px;
  border-radius: 10px;
  background: var(--color-text);
}

@media (max-width: 900px) {
  .nav,
  .actions,
  .auth-error {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  .header-container {
    min-height: 72px;
    gap: 16px;
  }
}
</style>
