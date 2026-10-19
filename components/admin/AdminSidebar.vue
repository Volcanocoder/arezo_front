<script setup lang="ts">
const menuItems = [
  { label: 'نمای کلی', to: '/admin', icon: '⌂' },
  { label: 'بررسی آرزوها', to: '/admin/wishes', icon: '♡' },
  { label: 'مدیریت کاربران', to: '/admin/users', icon: '♙' },
  { label: 'گزارش‌های کاربران', to: '/admin/reports', icon: '⚑' },
  { label: 'دسته‌بندی‌ها', to: '/admin/categories', icon: '▦' },
  { label: 'تنظیمات سایت', to: '/admin/settings', icon: '⚙' }
]
</script>

<template>
  <aside class="admin-sidebar">
    <NuxtLink to="/admin" class="brand">
      <span class="brand-icon">آ</span>

      <span class="brand-info">
        <strong>آرزو</strong>
        <small>پنل مدیریت</small>
      </span>
    </NuxtLink>

    <div class="admin-label">مدیریت سایت</div>

    <nav class="navigation">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        exact-active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-bottom">
      <div class="admin-profile">
        <div class="avatar">م</div>

        <div class="profile-info">
          <strong>مدیر سایت</strong>
          <span>مدیریت آرزو</span>
        </div>
      </div>

      <NuxtLink to="/" class="back-to-site">
        ← بازگشت به سایت
      </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  width: 250px;
  min-height: 100vh;
  flex-shrink: 0;

  position: sticky;
  top: 0;

  display: flex;
  flex-direction: column;

  padding: 25px 15px;

  background: #ffffff;
  border-left: 1px solid #eeeeee;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 0 8px 27px;

  color: var(--color-text);
  border-bottom: 1px solid #eeeeee;
}

.brand-icon {
  width: 43px;
  height: 43px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 13px;
  background: var(--color-primary);
  color: white;

  font-size: 21px;
  font-weight: 800;
}

.brand-info,
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-info strong {
  font-size: 16px;
}

.brand-info small {
  color: var(--color-muted);
  font-size: 10px;
}

.admin-label {
  margin: 27px 10px 13px;

  color: #a0a0aa;
  font-size: 10px;
  font-weight: 700;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.nav-item {
  min-height: 46px;

  display: flex;
  align-items: center;
  gap: 12px;

  padding: 0 13px;

  border-radius: 12px;

  color: #686875;
  font-size: 12px;
  font-weight: 600;

  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: #f8f7ff;
  color: var(--color-primary);
}

.nav-item.active {
  background: #f0eeff;
  color: var(--color-primary);
  font-weight: 800;
}

.nav-icon {
  width: 23px;
  flex-shrink: 0;
  text-align: center;
  font-size: 17px;
}

.sidebar-bottom {
  margin-top: auto;
  padding-top: 25px;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 15px 8px;

  border-top: 1px solid #eeeeee;
}

.avatar {
  width: 39px;
  height: 39px;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  background: #eeeaff;
  color: var(--color-primary);

  font-size: 14px;
  font-weight: 800;
}

.profile-info strong {
  font-size: 11px;
}

.profile-info span {
  color: var(--color-muted);
  font-size: 9px;
}

.back-to-site {
  min-height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: 8px;

  border-radius: 10px;
  background: #f8f8fc;
  color: #676774;

  font-size: 11px;
  font-weight: 700;
}

.back-to-site:hover {
  background: #f0eeff;
  color: var(--color-primary);
}

@media (max-width: 850px) {
  .admin-sidebar {
    width: 75px;
    padding: 20px 9px;
  }

  .brand {
    justify-content: center;
    padding-inline: 0;
  }

  .brand-info,
  .admin-label,
  .nav-item > span:last-child,
  .profile-info,
  .back-to-site {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 0;
  }

  .admin-profile {
    justify-content: center;
    padding-inline: 0;
  }
}
</style>