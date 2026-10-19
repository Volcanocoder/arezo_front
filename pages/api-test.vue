
<script setup lang="ts">
type HealthResponse = {
  success: boolean
  message: string
}

const apiResponse = ref<HealthResponse | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    apiResponse.value = await $fetch<HealthResponse>(
      'http://127.0.0.1:8000/api/health'
    )
  } catch (error) {
    console.error('API connection error:', error)
    errorMessage.value =
      'ارتباط با بک‌اند برقرار نشد. کنسول مرورگر را بررسی کن.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main dir="rtl" style="padding: 32px; font-family: sans-serif;">
    <h1>تست اتصال آرزو</h1>

    <p v-if="loading">در حال اتصال به بک‌اند...</p>

    <section v-else-if="apiResponse">
      <h2>اتصال موفق بود ✅</h2>
      <p>وضعیت: {{ apiResponse.success ? 'فعال' : 'ناموفق' }}</p>
      <p>پیام سرور: {{ apiResponse.message }}</p>
    </section>

    <p v-else style="color: #dc2626;">
      {{ errorMessage }}
    </p>
  </main>
</template>