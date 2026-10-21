
type AuthUser = {
    id: number
    name: string
    email: string
    mobile: string | null
    role: string
    avatar_url?: string | null
  }
  
  type AuthResponse = {
    message: string
    user: AuthUser
  }
  
  type AuthPayload = Record<string, string>
  
  export function useAuth() {
    const user = useState<AuthUser | null>(
      'arezoo-auth-user',
      () => null,
    )
  
    const pending = useState<boolean>(
      'arezoo-auth-pending',
      () => false,
    )
  
    const apiBase = useApiBase()
  
    function getXsrfToken(): string {
      const match = document.cookie.match(
        /(?:^|;\s*)XSRF-TOKEN=([^;]+)/,
      )
  
      return match ? decodeURIComponent(match[1]) : ''
    }
  
    async function prepareCsrf(): Promise<string> {
      await $fetch(`${apiBase}/sanctum/csrf-cookie`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })
  
      const token = getXsrfToken()
  
      if (!token) {
        throw new Error(
          'توکن امنیتی دریافت نشد. تنظیمات CSRF و کوکی را بررسی کن.',
        )
      }
  
      return token
    }
  
    async function post<T>(
      path: string,
      body: AuthPayload = {},
    ): Promise<T> {
      const token = await prepareCsrf()
  
      return await $fetch<T>(`${apiBase}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-XSRF-TOKEN': token,
        },
        body,
      })
    }
  
    async function register(
      payload: {
        name: string
        email: string
        mobile: string
        password: string
        password_confirmation: string
      },
    ): Promise<AuthResponse> {
      pending.value = true
    
      try {
        const result = await post<AuthResponse>(
          '/api/auth/register',
          payload,
        )
    
        user.value = result.user
        return result
      } finally {
        pending.value = false
      }
    }
  
    
async function login(
  payload: {
    mobile: string
    password: string
  },
): Promise<AuthResponse> {
  pending.value = true

  try {
    const result = await post<AuthResponse>(
      '/api/auth/login',
      payload,
    )

    user.value = result.user
    return result
  } finally {
    pending.value = false
  }
}
  
    async function forgotPassword(mobile: string): Promise<{ message: string }> {
      pending.value = true

      try {
        return await post<{ message: string }>(
          '/api/auth/password/forgot',
          { mobile },
        )
      } finally {
        pending.value = false
      }
    }

    async function resetPassword(
      payload: {
        mobile: string
        code: string
        password: string
        password_confirmation: string
      },
    ): Promise<{ message: string }> {
      pending.value = true

      try {
        return await post<{ message: string }>(
          '/api/auth/password/reset',
          payload,
        )
      } finally {
        pending.value = false
      }
    }

    async function fetchUser(): Promise<AuthUser> {
      try {
        const result = await $fetch<{ user: AuthUser }>(
          `${apiBase}/api/auth/me`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )
  
        user.value = result.user
        return result.user
      } catch (error) {
        user.value = null
        throw error
      }
    }
  
    async function logout(): Promise<{ message: string }> {
      pending.value = true
  
      try {
        const result = await post<{ message: string }>(
          '/api/auth/logout',
        )
  
        user.value = null
        return result
      } finally {
        pending.value = false
      }
    }
  
    return {
      user,
      pending,
      register,
      login,
      forgotPassword,
      resetPassword,
      fetchUser,
      logout,
    }
  }