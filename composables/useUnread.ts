// تعداد اعلان‌های خوانده‌نشده؛ بین هدر، سایدبار داشبورد و صفحه اعلان‌ها مشترک است.
export function useUnread() {
  const count = useState<number>('unread-notifications', () => 0)
  const { user } = useAuth()

  async function refresh() {
    if (!import.meta.client || !user.value) {
      count.value = 0
      return
    }

    try {
      const result = await $fetch<{ unread_count: number }>(`${useApiBase()}/api/notifications/unread-count`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })

      count.value = result.unread_count
    } catch {
      // نبود اتصال نباید صفحه را مختل کند.
    }
  }

  return { count, refresh }
}
