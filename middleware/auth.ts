export default defineNuxtRouteMiddleware(async (to) => {
    // بررسی نشست در مرورگر انجام می‌شود.
    if (import.meta.server) {
      return
    }
  
    const { user, fetchUser } = useAuth()
  
    // اگر اطلاعات کاربر در حافظه نیست، از Laravel بگیر.
    if (!user.value) {
      try {
        await fetchUser()
      } catch {
        return navigateTo({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      }
    }
  
    // اگر ورود تأیید نشد، اجازه ورود نده.
    if (!user.value) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  })