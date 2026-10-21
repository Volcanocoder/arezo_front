// آدرس بک‌اند از runtimeConfig خوانده می‌شود (متغیر NUXT_PUBLIC_API_BASE).
export function useApiBase(): string {
  return useRuntimeConfig().public.apiBase as string
}
