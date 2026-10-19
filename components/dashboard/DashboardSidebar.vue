<script setup lang="ts">
const menuItems = [
  {
    label: 'نمای کلی',
    to: '/dashboard',
    icon: '⌂'
  },
  {
    label: 'آرزوهای من',
    to: '/dashboard/my-wishes',
    icon: '♡'
  },
  {
    label: 'کمک‌های من',
    to: '/dashboard/my-contributions',
    icon: '🤝'
  },
  {
    label: 'پیام‌ها',
    to: '/dashboard/messages',
    icon: '💬'
  },
  {
    label: 'اعلان‌ها',
    to: '/dashboard/notifications',
    icon: '🔔'
  },
  {
    label: 'تنظیمات حساب',
    to: '/dashboard/settings',
    icon: '⚙'
  }
]
</script>

<template>
  <aside class="sidebar">

    <div class="sidebar-top">

      <NuxtLink
        to="/"
        class="brand"
      >
        <span class="brand-icon">
          آ
        </span>

        <div>
          <strong>آرزو</strong>
          <small>پنل کاربری</small>
        </div>
      </NuxtLink>

    </div>

    <nav class="nav">

      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        exact-active-class="active"
      >
        <span class="icon">
          {{ item.icon }}
        </span>

        <span>
          {{ item.label }}
        </span>
      </NuxtLink>

    </nav>

    <div class="sidebar-bottom">

      <NuxtLink
        to="/create-wish"
        class="create-wish"
      >
        <span>＋</span>
        ثبت آرزو
      </NuxtLink>

      <button
        type="button"
        class="logout-btn"
      >
        خروج از حساب
      </button>

    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-height: 100vh;

  position: sticky;
  top: 0;

  display: flex;
  flex-direction: column;

  padding: 24px 16px;

  border-left: 1px solid #eeeeee;

  background: #ffffff;
}

.sidebar-top {
  padding: 0 8px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;

  color: var(--color-text);
}

.brand-icon {
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 13px;

  background: var(--color-primary);
  color: #ffffff;

  font-weight: 800;
}

.brand div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand strong {
  font-size: 16px;
}

.brand small {
  color: var(--color-muted);
  font-size: 9px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 7px;

  margin-top: 38px;
}

.nav-item {
  min-height: 48px;

  display: flex;
  align-items: center;

  gap: 12px;

  padding: 0 14px;

  border-radius: 13px;

  color: #656570;

  font-size: 12px;
  font-weight: 600;

  transition: 0.2s ease;
}

.nav-item:hover {
  background: #f7f7fb;
  color: var(--color-primary);
}

.nav-item.active {
  background: #f0eeff;
  color: var(--color-primary);
}

.icon {
  width: 24px;

  display: flex;
  justify-content: center;

  font-size: 16px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin-top: auto;
}

.create-wish {
  min-height: 48px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 7px;

  border-radius: 13px;

  background: var(--color-primary);
  color: #ffffff;

  font-size: 12px;
  font-weight: 700;
}

.create-wish:hover {
  background: var(--color-primary-dark);
}

.logout-btn {
  min-height: 44px;

  border: 0;
  border-radius: 12px;

  background: #f8f8fa;
  color: #777782;

  font-family: inherit;
  font-size: 11px;

  cursor: pointer;
}

@media (max-width: 850px) {
  .sidebar {
    width: 82px;
    padding: 20px 10px;
  }

  .brand div,
  .nav-item span:last-child,
  .create-wish {
    display: none;
  }

  .brand {
    justify-content: center;
  }

  .nav-item {
    justify-content: center;
    padding: 0;
  }
}
</style>