// درخواست به بک‌اند با کوکی نشست و توکن CSRF (برای درخواست‌های غیر GET).
export function useApi() {
  const apiBase = useApiBase()

  function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  async function api<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: Record<string, unknown> | FormData
      query?: Record<string, string | number | undefined>
    } = {},
  ): Promise<T> {
    const method = options.method ?? 'GET'
    const headers: Record<string, string> = { Accept: 'application/json' }

    if (method !== 'GET') {
      await $fetch(`${apiBase}/sanctum/csrf-cookie`, { credentials: 'include' })

      const token = xsrfToken()

      if (!token) {
        throw new Error('توکن امنیتی دریافت نشد. تنظیمات CSRF و کوکی را بررسی کن.')
      }

      headers['X-XSRF-TOKEN'] = token
    }

    return await $fetch<T>(`${apiBase}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: options.body,
      query: options.query,
    })
  }

  return { api }
}

// پیام خطای قابل‌نمایش از پاسخ Laravel
export function apiErrorMessage(error: unknown, fallback = 'درخواست انجام نشد. دوباره تلاش کن.'): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      data?: { message?: string, errors?: Record<string, string[]> }
      message?: string
    }

    if (err.data?.errors) {
      return Object.values(err.data.errors).flat().join(' ')
    }

    return err.data?.message || err.message || fallback
  }

  return fallback
}
