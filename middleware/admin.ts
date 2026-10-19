export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) {
      return
    }
  
    const { user, fetchUser } = useAuth()
  
    // ابتدا وضعیت ورود را بررسی کن.
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
  
    if (!user.value) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  
    // فقط مدیر و مدیر ارشد اجازه ورود دارند.
    const allowedRoles = ['admin', 'super_admin']
  
    if (!allowedRoles.includes(user.value.role)) {
      return navigateTo('/dashboard')
    }
  })