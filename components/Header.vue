<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const { user, fetchUser, logout } = useAuth()
const unread = useUnread()
const route = useRoute()

const authReady = ref(false)
const loggingOut = ref(false)
const authError = ref('')
const menuOpen = ref(false)
const scrolled = ref(false)

const isAuthenticated = computed(() => Boolean(user.value))

const dashboardPath = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard'
})

const displayName = computed(() => user.value?.name || 'حساب کاربری')
const initial = computed(() => displayName.value.trim().charAt(0) || 'آ')

const links = [
  { to: '/', label: 'خانه' },
  { to: '/wishes', label: 'آرزوها' },
  { to: '/blog', label: 'وبلاگ' },
  { to: '/about', label: 'درباره ما' },
  { to: '/how-it-works', label: 'چطور کار می‌کند؟' },
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`)
}

onMounted(async () => {
  const onScroll = () => { scrolled.value = window.scrollY > 6 }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  try {
    if (!user.value) await fetchUser()
  } catch {
    // مهمان بودن حالت عادی است.
  } finally {
    authReady.value = true
  }

  unread.refresh()
})

watch(() => route.fullPath, () => {
  menuOpen.value = false
  if (user.value) unread.refresh()
})

watch(menuOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})

const handleLogout = async () => {
  if (loggingOut.value) return

  loggingOut.value = true
  authError.value = ''

  try {
    await logout()
    unread.count.value = 0
    menuOpen.value = false
    await navigateTo('/')
  } catch {
    authError.value = 'خروج انجام نشد. دوباره تلاش کن.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="header" :class="{ scrolled }">
    <div class="header-container">
      <NuxtLink to="/" class="logo" aria-label="آرزو؛ صفحه اصلی">
        <span class="logo-icon">آ</span>
        <span class="logo-text">
          <span>آرزو</span>
          <small>هر آرزو، یک امید</small>
        </span>
      </NuxtLink>

      <nav class="nav" aria-label="منوی اصلی">
        <NuxtLink
          v-for="item in links"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="actions">
        <NuxtLink to="/create-wish" class="cta">
          <span aria-hidden="true">＋</span> ثبت آرزو
        </NuxtLink>

        <template v-if="authReady">
          <template v-if="isAuthenticated">
            <NuxtLink
              to="/dashboard/notifications"
              class="bell"
              :aria-label="unread.count.value ? `${unread.count.value} اعلان خوانده‌نشده` : 'اعلان‌ها'"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span v-if="unread.count.value" class="bell-badge">
                {{ unread.count.value > 99 ? '۹۹+' : unread.count.value.toLocaleString('fa-IR') }}
              </span>
            </NuxtLink>

            <NuxtLink :to="dashboardPath" class="profile">
              <span class="avatar"><img v-if="user?.avatar_url" :src="user.avatar_url" alt="" />{{ user?.avatar_url ? '' : initial }}</span>
              <span class="profile-name">{{ displayName }}</span>
            </NuxtLink>

            <button type="button" class="ghost" :disabled="loggingOut" @click="handleLogout">
              {{ loggingOut ? '...' : 'خروج' }}
            </button>
          </template>

          <template v-else>
            <NuxtLink to="/login" class="ghost">ورود</NuxtLink>
            <NuxtLink to="/register" class="solid">ثبت‌نام</NuxtLink>
          </template>
        </template>
      </div>

      <button
        class="menu-btn"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        :aria-label="menuOpen ? 'بستن منو' : 'باز کردن منو'"
        @click="menuOpen = !menuOpen"
      >
        <span :class="{ open: menuOpen }" />
        <span :class="{ open: menuOpen }" />
        <span :class="{ open: menuOpen }" />
      </button>
    </div>

    <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

    <Transition name="drawer">
      <div v-if="menuOpen" id="mobile-menu" class="mobile">
        <nav class="mobile-nav" aria-label="منوی موبایل">
          <NuxtLink
            v-for="item in links"
            :key="item.to"
            :to="item.to"
            class="mobile-link"
            :class="{ active: isActive(item.to) }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="mobile-actions">
          <NuxtLink to="/create-wish" class="cta block">＋ ثبت آرزو</NuxtLink>

          <template v-if="authReady && isAuthenticated">
            <NuxtLink :to="dashboardPath" class="ghost block">{{ displayName }}</NuxtLink>
            <NuxtLink to="/dashboard/notifications" class="ghost block">
              اعلان‌ها
              <span v-if="unread.count.value" class="bell-badge static">{{ unread.count.value.toLocaleString('fa-IR') }}</span>
            </NuxtLink>
            <button type="button" class="ghost block" :disabled="loggingOut" @click="handleLogout">خروج</button>
          </template>
          <template v-else-if="authReady">
            <NuxtLink to="/login" class="ghost block">ورود</NuxtLink>
            <NuxtLink to="/register" class="solid block">ثبت‌نام</NuxtLink>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header a { text-decoration: none; }

.header {
  width: 100%;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.header.scrolled {
  border-bottom-color: #eceaf7;
  box-shadow: 0 6px 24px rgba(31, 24, 80, 0.06);
}

.header-container {
  width: min(1200px, calc(100% - 40px));
  min-height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 28px;
}

.logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #8b7bff, var(--color-primary-dark));
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  box-shadow: 0 6px 16px rgba(109, 93, 252, 0.35);
}

.logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.logo-text > span { font-size: 18px; font-weight: 800; color: var(--color-text); }
.logo-text small { margin-top: 3px; color: var(--color-muted); font-size: 10px; }

.nav { display: flex; align-items: center; gap: 4px; margin-inline: auto; }

.nav-link {
  position: relative;
  padding: 9px 14px;
  border-radius: 10px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease, background 0.2s ease;
}

.nav-link:hover { color: var(--color-primary); background: #f4f2ff; }
.nav-link.active { color: var(--color-primary); font-weight: 700; background: #f1eeff; }

.actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.cta, .solid, .ghost {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  border: 0;
  cursor: pointer;
  transition: 0.2s ease;
}

.cta { color: var(--color-primary-dark); background: #efecff; }
.cta:hover { background: #e3deff; }
.solid { color: #fff; background: var(--color-primary); box-shadow: 0 6px 16px rgba(109, 93, 252, 0.28); }
.solid:hover { background: var(--color-primary-dark); }
.ghost { color: var(--color-text); background: transparent; }
.ghost:hover:not(:disabled) { background: var(--color-surface); }
.ghost:disabled { opacity: 0.6; cursor: wait; }

.bell {
  position: relative;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #4b5563;
  transition: 0.2s ease;
}
.bell:hover { background: var(--color-surface); color: var(--color-primary); }

.bell-badge {
  position: absolute;
  top: 2px;
  inset-inline-start: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
}
.bell-badge.static { position: static; margin-inline-start: 8px; }

.profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  max-width: 180px;
}
.profile:hover { background: #efecff; }
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--color-primary);
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}
.avatar { overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.auth-error { margin: 0; padding: 6px 20px; text-align: center; color: #c2414b; font-size: 12px; }

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
  margin-inline-start: auto;
}
.menu-btn span { width: 20px; height: 2px; border-radius: 10px; background: var(--color-text); transition: transform 0.2s ease, opacity 0.2s ease; }
.menu-btn span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.menu-btn span.open:nth-child(2) { opacity: 0; }
.menu-btn span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.mobile {
  display: none;
}

@media (max-width: 960px) {
  .nav, .actions { display: none; }
  .menu-btn { display: flex; }
  .header-container { min-height: 68px; }

  .mobile {
    display: grid;
    gap: 16px;
    position: absolute;
    inset-inline: 0;
    top: 100%;
    max-height: calc(100vh - 68px);
    overflow-y: auto;
    padding: 16px 20px 24px;
    background: #fff;
    border-bottom: 1px solid #eceaf7;
    box-shadow: 0 18px 40px rgba(31, 24, 80, 0.12);
  }
  .mobile-nav { display: grid; gap: 4px; }
  .mobile-link { padding: 13px 14px; border-radius: 12px; font-weight: 600; color: #374151; }
  .mobile-link.active { background: #f1eeff; color: var(--color-primary); }
  .mobile-actions { display: grid; gap: 8px; }
  .block { width: 100%; background-color: var(--color-surface); }
  .block.cta { background: #efecff; }
  .block.solid { background: var(--color-primary); }
}

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
