<script setup lang="ts">
import { computed } from 'vue'
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const statusCode = computed(() => Number(props.error?.statusCode || 500))
const isNotFound = computed(() => statusCode.value === 404)
const isForbidden = computed(() => statusCode.value === 403)

const title = computed(() => {
  if (isNotFound.value) return 'این آرزو در این مسیر نیست!'
  if (isForbidden.value) return 'اجازه دسترسی نداری'
  return 'یک مشکلی پیش آمده'
})

const description = computed(() => {
  if (isNotFound.value) return 'صفحه‌ای که دنبالش هستی پیدا نشد؛ شاید آدرس تغییر کرده یا صفحه حذف شده باشد.'
  if (isForbidden.value) return 'برای دیدن این بخش، اجازه دسترسی لازم را نداری.'
  return 'هنگام باز کردن این صفحه مشکلی پیش آمد. می‌توانی به خانه برگردی و دوباره تلاش کنی.'
})

function goHome() {
  clearError({ redirect: '/' })
}

function goToWishes() {
  clearError({ redirect: '/wishes' })
}
</script>

<template>
  <main class="error-page" dir="rtl">
    <div class="error-shell">
      <NuxtLink to="/" class="brand" @click="goHome">
        <span class="brand-icon">آ</span>
        <span><strong>آرزو</strong><small>هر آرزو، یک امید</small></span>
      </NuxtLink>

      <section class="error-content">
        <div class="illustration" aria-hidden="true">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="paper">
            <span class="paper-face">♡</span>
            <i></i><i></i><i></i>
          </div>
          <span class="floating-star star-one">✦</span>
          <span class="floating-star star-two">✧</span>
          <span class="floating-heart">♡</span>
        </div>

        <span class="error-code">خطای {{ statusCode }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>

        <div class="actions">
          <button type="button" class="primary-button" @click="goHome">بازگشت به صفحه اصلی</button>
          <button type="button" class="secondary-button" @click="goToWishes">مشاهده آرزوها</button>
        </div>
        <span class="footnote">گاهی مسیر گم می‌شود؛ امید را می‌توان دوباره پیدا کرد. ♡</span>
      </section>
    </div>
  </main>
</template>

<style scoped>
.error-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 20px; overflow:hidden; background:linear-gradient(180deg,#fbfaff 0%,#f5f3ff 100%); color:#242338; }
.error-shell { width:min(100%,760px); }
.brand { display:inline-flex; align-items:center; gap:10px; color:inherit; text-decoration:none; }
.brand-icon { width:43px; height:43px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:var(--color-primary,#6d5dfc); color:#fff; font-size:22px; font-weight:800; }
.brand > span:last-child { display:flex; flex-direction:column; gap:4px; }
.brand strong { font-size:17px; font-weight:800; }
.brand small { color:#88869a; font-size:10px; }
.error-content { display:flex; flex-direction:column; align-items:center; padding:32px 18px 10px; text-align:center; }
.illustration { position:relative; width:250px; height:225px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; }
.orbit { position:absolute; border:1px solid #ded9ff; border-radius:50%; transform:rotate(-18deg); }
.orbit-one { width:210px; height:145px; }
.orbit-two { width:160px; height:205px; transform:rotate(32deg); border-color:#e8e4ff; }
.paper { position:relative; z-index:1; width:100px; height:132px; display:flex; flex-direction:column; align-items:center; padding:18px 14px; gap:10px; border:1px solid #e4e0ff; border-radius:18px; background:#fff; box-shadow:0 18px 45px rgba(77,62,165,.12); transform:rotate(-7deg); }
.paper-face { width:43px; height:43px; display:flex; align-items:center; justify-content:center; margin-bottom:3px; border-radius:14px; background:#f0eeff; color:var(--color-primary,#6d5dfc); font-size:30px; }
.paper i { width:100%; height:5px; display:block; border-radius:99px; background:#eeecf8; }
.paper i:last-child { width:65%; align-self:flex-start; }
.floating-star,.floating-heart { position:absolute; color:var(--color-primary,#6d5dfc); }
.star-one { top:36px; right:30px; font-size:23px; }
.star-two { left:26px; bottom:46px; font-size:29px; color:#a49aff; }
.floating-heart { right:25px; bottom:42px; font-size:25px; color:#b5aaff; }
.error-code { margin-top:4px; padding:7px 12px; border-radius:999px; background:#ece9ff; color:var(--color-primary,#6d5dfc); font-size:11px; font-weight:800; }
.error-content h1 { margin:17px 0 10px; font-size:clamp(26px,4vw,36px); line-height:1.5; font-weight:800; }
.error-content p { max-width:500px; margin:0; color:#777588; font-size:14px; line-height:2.1; }
.actions { display:flex; flex-wrap:wrap; justify-content:center; gap:11px; margin-top:27px; }
.primary-button,.secondary-button { min-height:47px; padding:0 20px; border-radius:12px; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; transition:transform .2s ease,background .2s ease; }
.primary-button { border:1px solid var(--color-primary,#6d5dfc); background:var(--color-primary,#6d5dfc); color:#fff; }
.primary-button:hover { background:var(--color-primary-dark,#5746e8); transform:translateY(-2px); }
.secondary-button { border:1px solid #e2defd; background:#fff; color:#4e477e; }
.secondary-button:hover { background:#f5f3ff; transform:translateY(-2px); }
.footnote { margin-top:30px; color:#a09db1; font-size:10px; }
@media(max-width:520px) { .error-page { padding:24px 16px; } .error-content { padding-inline:0; } .illustration { transform:scale(.88); margin-block:-7px; } .error-content p { font-size:12px; } .actions { width:100%; flex-direction:column; } .primary-button,.secondary-button { width:100%; } }
</style>
