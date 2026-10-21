<script setup lang="ts">
defineProps<{ open?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { user, logout } = useAuth()
const unread = useUnread()
const loggingOut = ref(false)

const menuItems = [
  { label: 'نمای کلی', to: '/dashboard', icon: '⌂' },
  { label: 'آرزوهای من', to: '/dashboard/my-wishes', icon: '♡' },
  { label: 'کمک‌های من', to: '/dashboard/my-contributions', icon: '🤝' },
  { label: 'پیام‌ها', to: '/dashboard/messages', icon: '💬' },
  { label: 'اعلان‌ها', to: '/dashboard/notifications', icon: '🔔' },
  { label: 'تنظیمات حساب', to: '/dashboard/settings', icon: '⚙' },
]

const name = computed(() => user.value?.name?.trim() || 'کاربر آرزو')
const initial = computed(() => Array.from(name.value)[0] || 'آ')

onMounted(() => unread.refresh())

async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true

  try {
    await logout()
    unread.count.value = 0
    await navigateTo('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <aside class="sidebar" :class="{ open }">
    <div class="sidebar-top">
      <NuxtLink to="/" class="brand">
        <span class="brand-icon">آ</span>
        <div>
          <strong>آرزو</strong>
          <small>پنل کاربری</small>
        </div>
      </NuxtLink>

      <button type="button" class="close" aria-label="بستن منو" @click="emit('close')">✕</button>
    </div>

    <div class="user-card">
      <span class="avatar"><img v-if="user?.avatar_url" :src="user.avatar_url" alt="" />{{ user?.avatar_url ? '' : initial }}</span>
      <div>
        <strong>{{ name }}</strong>
        <small dir="ltr">{{ user?.mobile || '' }}</small>
      </div>
    </div>

    <nav class="nav" aria-label="منوی پنل کاربری">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        exact-active-class="active"
      >
        <span class="icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.to === '/dashboard/notifications' && unread.count.value" class="unread-badge">
          {{ unread.count.value.toLocaleString('fa-IR') }}
        </span>
      </NuxtLink>
    </nav>

    <div class="sidebar-bottom">
      <NuxtLink to="/create-wish" class="create-wish"><span>＋</span> ثبت آرزو</NuxtLink>
      <NuxtLink to="/blog" class="site-link">راهنما و مقاله‌ها</NuxtLink>
      <button type="button" class="logout-btn" :disabled="loggingOut" @click="handleLogout">
        {{ loggingOut ? 'در حال خروج...' : 'خروج از حساب' }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 270px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 16px;
  border-left: 1px solid #eceaf7;
  background: #fff;
  overflow-y: auto;
}

.sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 0 6px; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--color-text); }
.brand-icon {
  width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px;
  background: linear-gradient(135deg, #8b7bff, #5848e8); color: #fff; font-weight: 800; font-size: 20px;
  box-shadow: 0 6px 16px rgba(109, 93, 252, 0.3);
}
.brand div { display: flex; flex-direction: column; gap: 3px; }
.brand strong { font-size: 17px; }
.brand small { color: var(--color-muted); font-size: 10px; }
.close { display: none; border: 0; background: #f4f2ff; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; }

.user-card {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border-radius: 16px; background: linear-gradient(135deg, #f4f2ff, #eef6ff);
}
.avatar {
  width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0;
  background: var(--color-primary); color: #fff; font-weight: 800;
}
.avatar { overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-card div { min-width: 0; display: grid; gap: 2px; }
.user-card strong { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-card small { color: var(--color-muted); font-size: 12px; text-align: right; }

.nav { display: flex; flex-direction: column; gap: 4px; }
.nav-item {
  min-height: 46px; display: flex; align-items: center; gap: 12px; padding: 0 14px;
  border-radius: 13px; color: #5b5b6b; font-size: 13px; font-weight: 600; transition: 0.2s ease;
}
.nav-item:hover { background: #f7f6fd; color: var(--color-primary); }
.nav-item.active { background: #efecff; color: var(--color-primary-dark); font-weight: 800; box-shadow: inset -3px 0 0 var(--color-primary); }
.icon { width: 22px; text-align: center; font-size: 17px; }
.unread-badge { margin-inline-start: auto; background: #ef4444; color: #fff; border-radius: 999px; font-size: 11px; font-weight: 800; padding: 1px 8px; }

.sidebar-bottom { margin-top: auto; display: grid; gap: 8px; }
.create-wish {
  min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 14px; background: linear-gradient(135deg, #7b6bff, #5848e8); color: #fff; font-weight: 700; font-size: 14px;
  box-shadow: 0 8px 20px rgba(88, 72, 232, 0.28);
}
.site-link { text-align: center; padding: 8px; color: var(--color-muted); font-size: 12px; }
.site-link:hover { color: var(--color-primary); }
.logout-btn {
  min-height: 44px; border: 0; border-radius: 13px; background: #f7f7fb; color: #6b7280;
  font-family: inherit; font-size: 13px; cursor: pointer; transition: 0.2s ease;
}
.logout-btn:hover:not(:disabled) { background: #fef2f2; color: #b91c1c; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    top: 0;
    inset-inline-start: 0;
    z-index: 80;
    width: min(300px, 86vw);
    transform: translateX(100%);
    transition: transform 0.25s ease;
    box-shadow: -20px 0 40px rgba(20, 18, 28, 0.15);
  }
  .sidebar.open { transform: none; }
  .close { display: block; }
}
</style>
