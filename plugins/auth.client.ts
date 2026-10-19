export default defineNuxtPlugin(async () => {
    const { fetchUser } = useAuth()
  
    try {
      // بازیابی کاربر از نشست Laravel هنگام باز شدن سایت
      await fetchUser()
    } catch {
      // اگر کاربر وارد نشده باشد، سایت همچنان قابل استفاده است.
    }
  })