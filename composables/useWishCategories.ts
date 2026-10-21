export interface WishCategory {
  name: string
  icon: string
  color: string
  description: string
}

// اگر API در دسترس نباشد، فهرست پیش‌فرض نمایش داده می‌شود.
const FALLBACK: WishCategory[] = [
  { name: 'تحصیلی', icon: '🎓', color: '#EEF0FF', description: 'کتاب، لپ‌تاپ، شهریه و آموزش' },
  { name: 'درمانی', icon: '❤️', color: '#FFF0F3', description: 'دارو، درمان و تجهیزات پزشکی' },
  { name: 'وسایل ضروری', icon: '🛍️', color: '#FFF6E8', description: 'وسایل مورد نیاز زندگی' },
  { name: 'آموزشی', icon: '📚', color: '#F0F9FF', description: 'دوره و مهارت‌آموزی' },
  { name: 'تجربه و تفریح', icon: '✨', color: '#F4F0FF', description: 'ساختن یک خاطره زیبا' },
  { name: 'خانواده', icon: '🏠', color: '#EEF8F2', description: 'کمک به خانواده و عزیزان' },
  { name: 'سایر', icon: '💫', color: '#F1F5F9', description: 'آرزوهای متفاوت و خاص' },
]

// دسته‌بندی‌های فعال آرزو؛ از پنل مدیریت قابل تغییر است.
export async function useWishCategories() {
  const apiBase = useApiBase()

  const { data } = await useAsyncData<WishCategory[]>('wish-categories', async () => {
    try {
      const res = await $fetch<{ data: WishCategory[] }>(`${apiBase}/api/categories`, {
        query: { type: 'wish' },
        headers: { Accept: 'application/json' },
      })

      return res.data.length ? res.data : FALLBACK
    } catch {
      return FALLBACK
    }
  })

  return computed(() => data.value ?? FALLBACK)
}
