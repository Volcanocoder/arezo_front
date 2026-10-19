
<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

type NotificationFilter = 'all' | 'unread' | 'read'

interface NotificationItem {
  id: number
  type: 'wish' | 'message' | 'progress' | 'success' | 'system'
  title: string
  description: string
  date: string
  read: boolean
  link: string
}

const activeFilter = ref<NotificationFilter>('all')

const notifications = ref<NotificationItem[]>([
  {
    id: 1,
    type: 'wish',
    title: 'یک نفر به آرزوی تو علاقه‌مند شده است',
    description:
      'یکی از کاربران برای برآورده کردن آرزوی «یک لپ‌تاپ برای ادامه تحصیل» اعلام آمادگی کرده است.',
    date: '۱۰ دقیقه پیش',
    read: false,
    link: '/wishes/1'
  },
  {
    id: 2,
    type: 'message',
    title: 'پیام جدید از محمد',
    description:
      'سلام، خیلی ممنون که آرزوی من را دیدید. اگر اطلاعات بیشتری لازم دارید با کمال میل در اختیارتان می‌گذارم.',
    date: '۳۰ دقیقه پیش',
    read: false,
    link: '/dashboard/messages'
  },
  {
    id: 3,
    type: 'progress',
    title: 'آرزوی مورد علاقه‌ات پیشرفت کرده است',
    description:
      'میزان تأمین هزینه آرزوی «خرید یک ویلچر مناسب» به ۵۰ درصد رسیده است.',
    date: '۲ ساعت پیش',
    read: false,
    link: '/wishes/2'
  },
  {
    id: 4,
    type: 'success',
    title: 'یک آرزو برآورده شد ❤️',
    description:
      'آرزوی «یک تجربه زیبا برای تولد» به‌طور کامل تأمین شده است.',
    date: 'دیروز',
    read: true,
    link: '/wishes/6'
  },
  {
    id: 5,
    type: 'system',
    title: 'به آرزو خوش آمدی',
    description:
      'از اینکه بخشی از این مسیر هستی خوشحالیم. با ثبت آرزو یا کمک به دیگران، می‌توانی در ساختن اتفاق‌های خوب سهیم باشی.',
    date: '۲ روز پیش',
    read: true,
    link: '/dashboard'
  },
  {
    id: 6,
    type: 'progress',
    title: 'یک آرزو به مرحله جدیدی رسیده است',
    description:
      'آرزوی «دوچرخه برای رفت‌وآمد» به مرحله نزدیک به تکمیل رسیده است.',
    date: '۳ روز پیش',
    read: true,
    link: '/wishes/3'
  }
])

const unreadCount = computed(() =>
  notifications.value.filter((item) => !item.read).length
)

const readCount = computed(() =>
  notifications.value.filter((item) => item.read).length
)

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'unread') {
    return notifications.value.filter((item) => !item.read)
  }

  if (activeFilter.value === 'read') {
    return notifications.value.filter((item) => item.read)
  }

  return notifications.value
})

const markAsRead = (id: number) => {
  const notification = notifications.value.find(
    (item) => item.id === id
  )

  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach((item) => {
    item.read = true
  })
}

const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(
    (item) => item.id !== id
  )
}

const clearReadNotifications = () => {
  notifications.value = notifications.value.filter(
    (item) => !item.read
  )
}

const getIcon = (type: NotificationItem['type']) => {
  const icons: Record<NotificationItem['type'], string> = {
    wish: '🤝',
    message: '💬',
    progress: '📈',
    success: '❤️',
    system: '✨'
  }

  return icons[type]
}
</script>

<template>
  <main class="notifications-page">

    <!-- Page Header -->
    <header class="page-header">
      <div>
        <span class="eyebrow">پنل کاربری</span>

        <h1>اعلان‌ها</h1>

        <p>
          از اتفاق‌های تازه درباره آرزوها و فعالیت‌هایت باخبر شو.
        </p>
      </div>

      <button
        v-if="unreadCount > 0"
        type="button"
        class="mark-all-btn"
        @click="markAllAsRead"
      >
        ✓ علامت‌گذاری همه به‌عنوان خوانده‌شده
      </button>
    </header>

    <!-- Summary -->
    <section class="summary-grid">

      <article class="summary-card">
        <div class="summary-icon total-icon">🔔</div>

        <div>
          <span>کل اعلان‌ها</span>
          <strong>{{ notifications.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon unread-icon">●</div>

        <div>
          <span>خوانده‌نشده</span>
          <strong>{{ unreadCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon read-icon">✓</div>

        <div>
          <span>خوانده‌شده</span>
          <strong>{{ readCount }}</strong>
        </div>
      </article>

    </section>

    <!-- Filters -->
    <section class="notifications-toolbar">

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          همه
          <span>{{ notifications.length }}</span>
        </button>

        <button
          type="button"
          class="tab"
          :class="{ active: activeFilter === 'unread' }"
          @click="activeFilter = 'unread'"
        >
          خوانده‌نشده
          <span>{{ unreadCount }}</span>
        </button>

        <button
          type="button"
          class="tab"
          :class="{ active: activeFilter === 'read' }"
          @click="activeFilter = 'read'"
        >
          خوانده‌شده
          <span>{{ readCount }}</span>
        </button>
      </div>

      <button
        v-if="readCount > 0"
        type="button"
        class="clear-read-btn"
        @click="clearReadNotifications"
      >
        حذف اعلان‌های خوانده‌شده
      </button>

    </section>

    <!-- Notification List -->
    <section class="notification-list">

      <article
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="notification-card"
        :class="{ unread: !notification.read }"
      >
        <div class="notification-icon">
          {{ getIcon(notification.type) }}
        </div>

        <div class="notification-content">

          <div class="notification-heading">
            <h2>{{ notification.title }}</h2>

            <span
              v-if="!notification.read"
              class="unread-indicator"
              aria-label="خوانده‌نشده"
            />
          </div>

          <p>{{ notification.description }}</p>

          <div class="notification-footer">
            <time>{{ notification.date }}</time>

            <div class="notification-actions">

              <NuxtLink
                :to="notification.link"
                class="view-link"
                @click="markAsRead(notification.id)"
              >
                مشاهده
                <span>←</span>
              </NuxtLink>

              <button
                v-if="!notification.read"
                type="button"
                class="read-btn"
                @click="markAsRead(notification.id)"
              >
                خواندم
              </button>

              <button
                type="button"
                class="delete-btn"
                :aria-label="`حذف اعلان ${notification.title}`"
                @click="removeNotification(notification.id)"
              >
                حذف
              </button>

            </div>
          </div>

        </div>
      </article>

      <!-- Empty State -->
      <div
        v-if="filteredNotifications.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">🔔</div>

        <h2>
          {{
            activeFilter === 'unread'
              ? 'اعلان خوانده‌نشده‌ای نداری'
              : activeFilter === 'read'
                ? 'هنوز اعلانی را نخوانده‌ای'
                : 'اعلانی وجود ندارد'
          }}
        </h2>

        <p>
          وقتی اتفاق تازه‌ای درباره آرزوهایت رخ دهد، اینجا به تو اطلاع می‌دهیم.
        </p>

        <button
          type="button"
          class="show-all-btn"
          @click="activeFilter = 'all'"
        >
          مشاهده همه اعلان‌ها
        </button>
      </div>

    </section>

    <p class="demo-note">
      این اعلان‌ها نمونه نمایشی هستند و هنوز از سرور دریافت نمی‌شوند.
    </p>

  </main>
</template>

<style scoped>
.notifications-page {
  min-height: 100vh;
  padding: 35px 40px 70px;
}

/* Header */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
}

.page-header h1 {
  margin: 7px 0;
  font-size: 31px;
  font-weight: 800;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 2;
}

.mark-all-btn {
  min-height: 43px;
  padding: 0 15px;
  border: 1px solid #e7e3ff;
  border-radius: 12px;
  background: #f4f2ff;
  color: var(--color-primary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.mark-all-btn:hover {
  background: #eae6ff;
}

/* Summary */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 28px;
}

.summary-card {
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #eeeeee;
  border-radius: 17px;
  background: #ffffff;
}

.summary-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  font-size: 17px;
  font-weight: 800;
}

.total-icon {
  background: #f0eeff;
}

.unread-icon {
  background: #fff3e5;
  color: #de8a24;
  font-size: 12px;
}

.read-icon {
  background: #eaf8f0;
  color: #29915d;
}

.summary-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-card span {
  color: var(--color-muted);
  font-size: 11px;
}

.summary-card strong {
  font-size: 23px;
  font-weight: 800;
}

/* Toolbar */

.notifications-toolbar {
  min-height: 63px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 15px;
}

.tabs {
  display: flex;
  gap: 5px;
  padding: 5px;
  border-radius: 13px;
  background: #eeeeF4;
}

.tab {
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #777782;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s ease;
}

.tab span {
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 7px;
  background: rgba(120, 120, 140, 0.1);
  font-size: 9px;
}

.tab.active {
  background: #ffffff;
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(30, 25, 70, 0.06);
}

.clear-read-btn {
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #c45e68;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.clear-read-btn:hover {
  background: #fff0f1;
}

/* Notification cards */

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px;
  border: 1px solid #eeeeee;
  border-radius: 18px;
  background: #ffffff;
  transition: border-color 0.2s ease;
}

.notification-card.unread {
  border-color: #ddd8ff;
  background: #fdfcff;
}

.notification-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #f0eeff;
  font-size: 21px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-heading {
  display: flex;
  align-items: center;
  gap: 9px;
}

.notification-heading h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.9;
}

.unread-indicator {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary);
}

.notification-content > p {
  margin: 8px 0 15px;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 2.1;
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.notification-footer time {
  color: #9999a3;
  font-size: 10px;
}

.notification-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 13px;
}

.view-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 700;
}

.view-link:hover {
  color: var(--color-primary-dark);
}

.read-btn,
.delete-btn {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.read-btn {
  color: #29915d;
}

.delete-btn {
  color: #bb6a72;
}

/* Empty state */

.empty-state {
  padding: 75px 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px dashed #dddddf;
  border-radius: 18px;
  background: #ffffff;
  text-align: center;
}

.empty-icon {
  margin-bottom: 14px;
  font-size: 43px;
}

.empty-state h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.empty-state p {
  max-width: 420px;
  margin: 0 0 20px;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 2;
}

.show-all-btn {
  min-height: 40px;
  padding: 0 15px;
  border: 0;
  border-radius: 10px;
  background: var(--color-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

/* Demo note */

.demo-note {
  margin: 20px 0 0;
  color: #9999a3;
  font-size: 10px;
  text-align: center;
}

/* Responsive */

@media (max-width: 850px) {
  .notifications-page {
    padding: 28px 25px 60px;
  }
}

@media (max-width: 650px) {
  .notifications-page {
    padding: 22px 15px 50px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .mark-all-btn {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .notifications-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .tabs {
    overflow-x: auto;
  }

  .notification-card {
    gap: 12px;
    padding: 16px;
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    font-size: 18px;
  }

  .notification-heading h2 {
    font-size: 12px;
  }

  .notification-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .notification-actions {
    gap: 15px;
  }
}
</style>