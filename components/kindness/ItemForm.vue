<script setup lang="ts">
export interface KindnessFormValues {
  title: string
  category: string
  description: string
  condition: string
  city: string
}

const props = withDefaults(defineProps<{
  initial?: Partial<KindnessFormValues>
  imageUrl?: string | null
  submitLabel?: string
  busy?: boolean
  error?: string
}>(), { initial: () => ({}), imageUrl: null, submitLabel: 'ثبت', busy: false, error: '' })

const emit = defineEmits<{ submit: [body: FormData], cancel: [] }>()

// لیست دسته‌ها باید با KindnessItem::CATEGORIES بک‌اند یکی بماند.
const categories = ['لوازم خانه', 'پوشاک', 'کتاب و لوازم تحریر', 'لوازم کودک', 'لوازم برقی', 'مبلمان', 'سایر']
const conditions = [
  { value: 'like_new', label: 'در حد نو' },
  { value: 'good', label: 'سالم' },
  { value: 'fair', label: 'قابل استفاده' },
]

const form = reactive<KindnessFormValues>({
  title: props.initial.title ?? '',
  category: props.initial.category ?? categories[0],
  description: props.initial.description ?? '',
  condition: props.initial.condition ?? 'good',
  city: props.initial.city ?? '',
})

const file = ref<File | null>(null)
const preview = ref<string | null>(null)
const removeImage = ref(false)
const localError = ref('')

const shownImage = computed(() => preview.value ?? (removeImage.value ? null : props.imageUrl))

function pick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  localError.value = ''

  if (f && f.size > 3 * 1024 * 1024) {
    localError.value = 'حجم تصویر باید کمتر از ۳ مگابایت باشد.'
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  if (preview.value) URL.revokeObjectURL(preview.value)
  file.value = f
  preview.value = f ? URL.createObjectURL(f) : null
  if (f) removeImage.value = false
}

onBeforeUnmount(() => { if (preview.value) URL.revokeObjectURL(preview.value) })

function submit() {
  const body = new FormData()
  body.append('title', form.title.trim())
  body.append('category', form.category)
  body.append('description', form.description.trim())
  body.append('condition', form.condition)
  body.append('city', form.city.trim())
  if (file.value) body.append('image', file.value)
  else if (removeImage.value) body.append('remove_image', '1')
  emit('submit', body)
}
</script>

<template>
  <form class="item-form" @submit.prevent="submit">
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
      <small>{{ form.description.length }} / ۱۵۰۰</small>
    </label>

    <div class="image-box">
      <img v-if="shownImage" :src="shownImage" alt="تصویر آگهی">
      <label class="file">{{ shownImage ? 'تغییر تصویر' : 'افزودن تصویر (اختیاری، تا ۳ مگابایت)' }}
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="pick">
      </label>
      <label v-if="imageUrl && !preview" class="check">
        <input v-model="removeImage" type="checkbox"> حذف تصویر فعلی
      </label>
    </div>

    <p v-if="localError || error" class="err" role="alert">{{ localError || error }}</p>

    <div class="actions">
      <button type="submit" class="primary" :disabled="busy">{{ busy ? 'در حال ارسال...' : submitLabel }}</button>
      <button type="button" class="ghost" @click="emit('cancel')">انصراف</button>
    </div>
  </form>
</template>

<style scoped>
.item-form { display: grid; gap: 14px; }
label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
small { font-weight: 400; color: #94a3b8; }
input, select, textarea { width: 100%; padding: 11px 12px; border: 1px solid #e3e3ea; border-radius: 12px; font: inherit; font-size: 16px; font-weight: 400; background: #fff; }
input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.image-box { display: grid; gap: 10px; padding: 12px; border: 1px dashed #d1d5db; border-radius: 14px; }
.image-box img { max-height: 220px; width: auto; max-width: 100%; border-radius: 12px; object-fit: cover; justify-self: start; }
.check { display: flex; align-items: center; gap: 8px; font-weight: 400; }
.check input { width: auto; }
.err { margin: 0; padding: 10px 14px; border-radius: 12px; background: #fff0f0; color: #b42318; font-size: 13px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.primary, .ghost { min-height: 46px; padding: 0 24px; border-radius: 14px; font: inherit; font-weight: 800; cursor: pointer; }
.primary { border: 0; background: var(--color-primary); color: #fff; }
.ghost { border: 1px solid #e5e7eb; background: #fff; color: #475569; }
.primary:disabled { opacity: .6; cursor: wait; }
@media (max-width: 600px) { .row { grid-template-columns: 1fr; } }
</style>
