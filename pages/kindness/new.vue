<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({ title: 'ثبت آگهی | دیوار مهربانی' })

const { api } = useApi()

const categories = ['لوازم خانه', 'پوشاک', 'کتاب و لوازم تحریر', 'لوازم کودک', 'لوازم برقی', 'مبلمان', 'سایر']
const conditions = [
  { value: 'like_new', label: 'در حد نو' },
  { value: 'good', label: 'سالم' },
  { value: 'fair', label: 'قابل استفاده' },
]

const form = reactive({ title: '', category: categories[0], description: '', condition: 'good', city: '' })
const image = ref<File | null>(null)
const submitting = ref(false)
const error = ref('')
const done = ref(false)

function pick(e: Event) {
  image.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submit() {
  if (submitting.value) return

  submitting.value = true
  error.value = ''

  const body = new FormData()
  body.append('title', form.title.trim())
  body.append('category', form.category)
  body.append('description', form.description.trim())
  body.append('condition', form.condition)
  body.append('city', form.city.trim())
  if (image.value) body.append('image', image.value)

  try {
    await api('/api/kindness', { method: 'POST', body })
    done.value = true
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="new-page">
    <div class="container">
      <NuxtLink to="/kindness" class="back">← دیوار مهربانی</NuxtLink>
      <h1>ثبت آگهی</h1>
      <p class="lead">وسیله سالمی که دیگر لازم نداری را معرفی کن. آگهی بعد از تأیید تیم هم‌آرزو نمایش داده می‌شود.</p>

      <div v-if="done" class="ok">
        آگهی ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.
        <NuxtLink to="/dashboard/kindness">آگهی‌های من</NuxtLink>
      </div>

      <form v-else class="card" @submit.prevent="submit">
        <label>عنوان
          <input v-model="form.title" required maxlength="150" placeholder="مثلاً: کتری برقی">
        </label>

        <div class="row">
          <label>دسته‌بندی
            <select v-model="form.category">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label>وضعیت کالا
            <select v-model="form.condition">
              <option v-for="c in conditions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </label>
        </div>

        <label>شهر
          <input v-model="form.city" required maxlength="120">
        </label>

        <label>توضیح
          <textarea v-model="form.description" required maxlength="1500" rows="5" placeholder="وضعیت، اندازه و هر نکته‌ای که لازم است" />
        </label>

        <label>تصویر (اختیاری، تا ۳ مگابایت)
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="pick">
        </label>

        <p v-if="error" class="err">{{ error }}</p>

        <button type="submit" :disabled="submitting">{{ submitting ? 'در حال ثبت...' : 'ثبت آگهی' }}</button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.new-page { padding: 36px 0 80px; }
.container { width: min(680px, 100% - 32px); margin-inline: auto; }
.back { display: inline-block; margin-bottom: 14px; color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: 14px; }
h1 { margin: 0 0 6px; font-size: 28px; }
.lead { margin: 0 0 20px; color: var(--color-muted); line-height: 2; }
.card { display: grid; gap: 14px; padding: 24px; background: #fff; border: 1px solid #eee; border-radius: 20px; }
label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
input, select, textarea { width: 100%; padding: 11px 12px; border: 1px solid #e3e3ea; border-radius: 12px; font: inherit; font-size: 16px; font-weight: 400; background: #fff; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.err { margin: 0; padding: 10px 14px; border-radius: 12px; background: #fff0f0; color: #b42318; font-size: 13px; }
.ok { padding: 18px; border-radius: 16px; background: #ecfdf3; color: #15803d; display: grid; gap: 8px; line-height: 2; }
.ok a { color: var(--color-primary); font-weight: 800; }
button { min-height: 48px; border: 0; border-radius: 14px; background: var(--color-primary); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
button:disabled { opacity: .6; cursor: wait; }
@media (max-width: 600px) { .row { grid-template-columns: 1fr; } .card { padding: 18px 14px; } }
</style>
