<script setup lang="ts">
const open = ref(false)
const route = useRoute()
const unread = useUnread()

watch(() => route.fullPath, () => { open.value = false })
watch(open, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div class="dashboard-layout">
    <header class="mobile-bar">
      <button type="button" class="burger" :aria-expanded="open" aria-label="باز کردن منو" @click="open = true">
        <span /><span /><span />
      </button>

      <NuxtLink to="/dashboard" class="mobile-brand">
        <span>آ</span> آرزو
      </NuxtLink>

      <NuxtLink to="/dashboard/notifications" class="mobile-bell" aria-label="اعلان‌ها">
        🔔
        <i v-if="unread.count.value" />
      </NuxtLink>
    </header>

    <div v-if="open" class="backdrop" @click="open = false" />

    <DashboardSidebar :open="open" @close="open = false" />

    <main class="dashboard-main">
      <slot />
    </main>
  </div>
</template>

<style>
.dashboard-layout a { text-decoration: none; }
</style>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  background: #f6f5fc;
}

.dashboard-main {
  flex: 1;
  min-width: 0;
}

.mobile-bar, .backdrop { display: none; }

@media (max-width: 900px) {
  .dashboard-layout { flex-direction: column; }

  .mobile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 60;
    height: 60px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #eceaf7;
  }

  .burger {
    width: 42px;
    height: 42px;
    border: 0;
    border-radius: 12px;
    background: #f4f2ff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }
  .burger span { width: 18px; height: 2px; border-radius: 4px; background: #4b3fd1; }

  .mobile-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--color-text); }
  .mobile-brand span {
    width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center;
    background: linear-gradient(135deg, #8b7bff, #5848e8); color: #fff;
  }

  .mobile-bell { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; background: #f8f8fc; }
  .mobile-bell i { position: absolute; top: 8px; inset-inline-start: 9px; width: 9px; height: 9px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; }

  .backdrop { display: block; position: fixed; inset: 0; background: rgba(20, 18, 28, 0.5); z-index: 70; }
}
</style>
