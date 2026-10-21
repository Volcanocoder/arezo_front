<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const API_BASE_URL = useApiBase()

interface AccountUser {
  id: number
  name: string
  mobile: string
  email: string | null
  city: string | null
  bio: string | null
  avatar_url?: string | null
  preferences?: {
    wish_updates: boolean
    new_messages: boolean
    wish_completed: boolean
    email_updates: boolean
  }
}

interface ApiResponse<T = unknown> {
  message?: string
  user?: AccountUser
  preferences?: {
    wish_updates: boolean
    new_messages: boolean
    wish_completed: boolean
    email_updates: boolean
  }
  errors?: Record<string, string[]>
  data?: T
}

const profile = reactive({
  fullName: '',
  mobile: '',
  email: '',
  city: 'سایر',
  bio: '',
})

const password = reactive({
  current: '',
  new: '',
  confirmation: '',
})

const preferences = reactive({
  wishUpdates: true,
  newMessages: true,
  wishCompleted: true,
  emailUpdates: false,
})

const { user: authUser } = useAuth()
const { api } = useApi()
const avatarPreview = ref<string | null>(null)
const avatarUrl = ref<string | null>(null)
const isUploadingAvatar = ref(false)
const profileMessage = ref('')
const passwordMessage = ref('')
const preferencesMessage = ref('')
const passwordError = ref('')
const settingsError = ref('')
const isLoading = ref(true)
const isSavingProfile = ref(false)
const isSavingPreferences = ref(false)
const isChangingPassword = ref(false)

const cities = [
  'تهران',
  'اصفهان',
  'شیراز',
  'مشهد',
  'تبریز',
  'کرج',
  'رشت',
  'اهواز',
  'قم',
  'سایر',
]

const avatarLetter = computed(() => profile.fullName.trim().charAt(0) || 'ع')

const readResponse = async (response: Response): Promise<ApiResponse> => {
  try {
    return await response.json() as ApiResponse
  } catch {
    return {}
  }
}

const getErrorMessage = (payload: ApiResponse, status: number) => {
  const firstValidationError = payload.errors
    ? Object.values(payload.errors).flat()[0]
    : undefined

  if (status === 401) {
    return 'نشست ورود معتبر نیست. دوباره وارد حساب کاربری‌ات شو.'
  }

  return firstValidationError || payload.message || `درخواست ناموفق بود (کد ${status}).`
}

const getXsrfToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('دریافت توکن امنیتی از سرور ناموفق بود. سرور بک‌اند را بررسی کن.')
  }

  const tokenCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))

  if (!tokenCookie) {
    throw new Error('توکن امنیتی پیدا نشد. آدرس‌های فرانت‌اند و بک‌اند باید هر دو از localhost استفاده کنند.')
  }

  return decodeURIComponent(tokenCookie.substring('XSRF-TOKEN='.length))
}

const apiRequest = async <T = ApiResponse>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xsrfToken = await getXsrfToken()
    headers.set('X-XSRF-TOKEN', xsrfToken)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  const payload = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status))
  }

  return payload as T
}

const applyUser = (user: AccountUser) => {
  profile.fullName = user.name || ''
  profile.mobile = user.mobile || ''
  profile.email = user.email || ''
  profile.city = user.city || 'سایر'
  profile.bio = user.bio || ''
  avatarUrl.value = user.avatar_url || null

  if (user.preferences) {
    preferences.wishUpdates = Boolean(user.preferences.wish_updates)
    preferences.newMessages = Boolean(user.preferences.new_messages)
    preferences.wishCompleted = Boolean(user.preferences.wish_completed)
    preferences.emailUpdates = Boolean(user.preferences.email_updates)
  }
}

const loadSettings = async () => {
  isLoading.value = true
  settingsError.value = ''

  try {
    const response = await apiRequest<ApiResponse<AccountUser>>('/api/account/settings')
    if (!response.user) {
      throw new Error('اطلاعات حساب در پاسخ سرور پیدا نشد.')
    }
    applyUser(response.user)
  } catch (error) {
    settingsError.value = error instanceof Error
      ? error.message
      : 'دریافت اطلاعات حساب ناموفق بود.'
  } finally {
    isLoading.value = false
  }
}

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    profileMessage.value = 'لطفاً تصویر JPG، PNG یا WEBP انتخاب کن.'
    input.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    profileMessage.value = 'حجم تصویر باید کمتر از ۲ مگابایت باشد.'
    input.value = ''
    return
  }

  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = URL.createObjectURL(file)
  isUploadingAvatar.value = true
  profileMessage.value = ''

  try {
    const body = new FormData()
    body.append('avatar', file)
    const res = await api<{ message: string, avatar_url: string | null }>('/api/account/settings/avatar', { method: 'POST', body })
    avatarUrl.value = res.avatar_url
    if (authUser.value) authUser.value = { ...authUser.value, avatar_url: res.avatar_url }
    profileMessage.value = res.message
  } catch (error) {
    profileMessage.value = apiErrorMessage(error, 'آپلود تصویر انجام نشد.')
  } finally {
    isUploadingAvatar.value = false
    avatarPreview.value = null
    input.value = ''
  }
}

const removeAvatar = async () => {
  isUploadingAvatar.value = true
  try {
    await api('/api/account/settings/avatar', { method: 'DELETE' })
    avatarUrl.value = null
    if (authUser.value) authUser.value = { ...authUser.value, avatar_url: null }
    profileMessage.value = 'تصویر پروفایل حذف شد.'
  } catch (error) {
    profileMessage.value = apiErrorMessage(error, 'حذف تصویر انجام نشد.')
  } finally {
    isUploadingAvatar.value = false
  }
}

const saveProfile = async () => {
  profileMessage.value = ''

  if (!profile.fullName.trim()) {
    profileMessage.value = 'نام و نام خانوادگی را وارد کن.'
    return
  }
  if (!/^09\d{9}$/.test(profile.mobile.trim())) {
    profileMessage.value = 'شماره موبایل باید ۱۱ رقم و با 09 شروع شود.'
    return
  }

  isSavingProfile.value = true
  try {
    const response = await apiRequest<ApiResponse<AccountUser>>('/api/account/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: profile.fullName.trim(),
        mobile: profile.mobile.trim(),
        email: profile.email.trim() || null,
        city: profile.city || null,
        bio: profile.bio.trim() || null,
      }),
    })

    if (response.user) applyUser(response.user)
    profileMessage.value = response.message || 'اطلاعات حساب با موفقیت ذخیره شد.'
  } catch (error) {
    profileMessage.value = error instanceof Error ? error.message : 'ذخیره اطلاعات ناموفق بود.'
  } finally {
    isSavingProfile.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordMessage.value = ''

  if (!password.current || !password.new || !password.confirmation) {
    passwordError.value = 'تمام فیلدهای رمز عبور را تکمیل کن.'
    return
  }
  if (password.new.length < 8) {
    passwordError.value = 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.'
    return
  }
  if (password.new !== password.confirmation) {
    passwordError.value = 'رمز عبور جدید و تکرار آن یکسان نیستند.'
    return
  }
  if (password.current === password.new) {
    passwordError.value = 'رمز عبور جدید باید با رمز فعلی متفاوت باشد.'
    return
  }

  isChangingPassword.value = true
  try {
    const response = await apiRequest<ApiResponse>('/api/account/settings/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: password.current,
        new_password: password.new,
        new_password_confirmation: password.confirmation,
      }),
    })

    passwordMessage.value = response.message || 'رمز عبور با موفقیت تغییر کرد.'
    password.current = ''
    password.new = ''
    password.confirmation = ''
  } catch (error) {
    passwordError.value = error instanceof Error ? error.message : 'تغییر رمز عبور ناموفق بود.'
  } finally {
    isChangingPassword.value = false
  }
}

const savePreferences = async () => {
  preferencesMessage.value = ''
  isSavingPreferences.value = true

  try {
    const response = await apiRequest<ApiResponse>('/api/account/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        wish_updates: preferences.wishUpdates,
        new_messages: preferences.newMessages,
        wish_completed: preferences.wishCompleted,
        email_updates: preferences.emailUpdates,
      }),
    })

    if (response.preferences) {
      preferences.wishUpdates = Boolean(response.preferences.wish_updates)
      preferences.newMessages = Boolean(response.preferences.new_messages)
      preferences.wishCompleted = Boolean(response.preferences.wish_completed)
      preferences.emailUpdates = Boolean(response.preferences.email_updates)
    }
    preferencesMessage.value = response.message || 'تنظیمات اعلان‌ها ذخیره شد.'
  } catch (error) {
    preferencesMessage.value = error instanceof Error ? error.message : 'ذخیره تنظیمات اعلان‌ها ناموفق بود.'
  } finally {
    isSavingPreferences.value = false
  }
}

onMounted(loadSettings)
</script>



<template>
  <main class="settings-page">

    <!-- Page Header -->
    <header class="page-header">
      <div>
        <span class="eyebrow">پنل کاربری</span>
        <h1>تنظیمات حساب</h1>
        <p>
          اطلاعات شخصی و نحوه دریافت اعلان‌هایت را مدیریت کن.
        </p>
      </div>
    </header>

    <!-- Profile -->
    <section class="settings-card">

      <div class="card-heading">
        <div class="heading-icon">👤</div>

        <div>
          <h2>اطلاعات شخصی</h2>
          <p>اطلاعات پروفایل و مشخصات حساب کاربری</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile">

        <div class="profile-photo">

          <div class="avatar">
            <img
              v-if="avatarPreview || avatarUrl"
              :src="avatarPreview || avatarUrl || ''"
              alt="تصویر پروفایل"
            />

            <span v-else>
              {{ avatarLetter }}
            </span>
          </div>

          <div class="photo-info">
            <strong>تصویر پروفایل</strong>

            <p>
              تصویر JPG یا PNG با حداکثر حجم ۲ مگابایت
            </p>

            <label class="upload-btn">
              {{ isUploadingAvatar ? 'در حال آپلود...' : avatarUrl ? 'تغییر تصویر' : 'انتخاب تصویر' }}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                :disabled="isUploadingAvatar"
                @change="handleAvatarChange"
              />
            </label>

            <button v-if="avatarUrl" type="button" class="upload-btn remove-avatar" :disabled="isUploadingAvatar" @click="removeAvatar">
              حذف تصویر
            </button>
          </div>

        </div>

        <div class="form-grid">

          <div class="field">
            <label for="fullName">نام و نام خانوادگی</label>

            <input
              id="fullName"
              v-model="profile.fullName"
              type="text"
              autocomplete="name"
              placeholder="نام کامل"
              required
            />
          </div>

          <div class="field">
            <label for="mobile">شماره موبایل</label>

            <input
              id="mobile"
              v-model="profile.mobile"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              placeholder="09123456789"
              required
            />

            <small>
              تأیید شماره موبایل در نسخه متصل به Backend انجام می‌شود.
            </small>
          </div>

          <div class="field">
            <label for="email">ایمیل (اختیاری)</label>

            <input
              id="email"
              v-model="profile.email"
              type="email"
              autocomplete="email"
              placeholder="example@email.com"
            />
          </div>

          <div class="field">
            <label for="city">شهر محل سکونت</label>

            <select
              id="city"
              v-model="profile.city"
            >
              <option
                v-for="city in cities"
                :key="city"
                :value="city"
              >
                {{ city }}
              </option>
            </select>
          </div>

          <div class="field full-width">
            <label for="bio">درباره من</label>

            <textarea
              id="bio"
              v-model="profile.bio"
              rows="3"
              maxlength="250"
              placeholder="چند جمله درباره خودت بنویس..."
            />

            <small>
              {{ profile.bio.length }} از ۲۵۰ کاراکتر
            </small>
          </div>

        </div>

        <div class="form-footer">
          <p
            v-if="profileMessage"
            class="feedback"
            role="status"
          >
            {{ profileMessage }}
          </p>

          <button
            type="submit"
            class="primary-btn"
          >
            ذخیره اطلاعات
          </button>
        </div>

      </form>

    </section>

    <!-- Password -->
    <section class="settings-card">

      <div class="card-heading">
        <div class="heading-icon">🔒</div>

        <div>
          <h2>امنیت و رمز عبور</h2>
          <p>برای امنیت بیشتر، رمز عبور قوی انتخاب کن.</p>
        </div>
      </div>

      <form @submit.prevent="changePassword">

        <div class="password-grid">

          <div class="field">
            <label for="currentPassword">رمز عبور فعلی</label>

            <input
              id="currentPassword"
              v-model="password.current"
              type="password"
              autocomplete="current-password"
              placeholder="رمز عبور فعلی"
              required
            />
          </div>

          <div class="field">
            <label for="newPassword">رمز عبور جدید</label>

            <input
              id="newPassword"
              v-model="password.new"
              type="password"
              autocomplete="new-password"
              placeholder="حداقل ۸ کاراکتر"
              minlength="8"
              required
            />
          </div>

          <div class="field full-width">
            <label for="confirmPassword">تکرار رمز عبور جدید</label>

            <input
              id="confirmPassword"
              v-model="password.confirmation"
              type="password"
              autocomplete="new-password"
              placeholder="رمز عبور جدید را تکرار کن"
              minlength="8"
              required
            />
          </div>

        </div>

        <p
          v-if="passwordError"
          class="feedback error"
          role="alert"
        >
          {{ passwordError }}
        </p>

        <p
          v-if="passwordMessage"
          class="feedback"
          role="status"
        >
          {{ passwordMessage }}
        </p>

        <div class="form-footer">
          <button
            type="submit"
            class="primary-btn"
          >
            تغییر رمز عبور
          </button>
        </div>

      </form>

    </section>

    <!-- Notification Preferences -->
    <section class="settings-card">

      <div class="card-heading">
        <div class="heading-icon">🔔</div>

        <div>
          <h2>تنظیمات اعلان‌ها</h2>
          <p>
            انتخاب کن چه رویدادهایی برایت اهمیت دارند.
          </p>
        </div>
      </div>

      <form @submit.prevent="savePreferences">

        <div class="preference-list">

          <label class="preference-row">
            <div class="preference-info">
              <strong>به‌روزرسانی آرزوها</strong>
              <span>
                اطلاع از پیشرفت آرزوهایی که دنبال می‌کنی.
              </span>
            </div>

            <input
              v-model="preferences.wishUpdates"
              type="checkbox"
            />
          </label>

          <label class="preference-row">
            <div class="preference-info">
              <strong>پیام‌های جدید</strong>
              <span>
                اطلاع از دریافت پیام در گفتگوها.
              </span>
            </div>

            <input
              v-model="preferences.newMessages"
              type="checkbox"
            />
          </label>

          <label class="preference-row">
            <div class="preference-info">
              <strong>برآورده شدن آرزوها</strong>
              <span>
                اطلاع از تکمیل شدن آرزوهای مورد علاقه‌ات.
              </span>
            </div>

            <input
              v-model="preferences.wishCompleted"
              type="checkbox"
            />
          </label>

          <label class="preference-row">
            <div class="preference-info">
              <strong>اعلان‌های ایمیلی</strong>
              <span>
                دریافت ایمیل درباره رویدادهای مهم حساب.
              </span>
            </div>

            <input
              v-model="preferences.emailUpdates"
              type="checkbox"
            />
          </label>

        </div>

        <div class="form-footer">
          <p
            v-if="preferencesMessage"
            class="feedback"
            role="status"
          >
            {{ preferencesMessage }}
          </p>

          <button
            type="submit"
            class="primary-btn"
          >
            ذخیره تنظیمات
          </button>
        </div>

      </form>

    </section>


  </main>
</template>

<style scoped>
.remove-avatar { margin-inline-start: 8px; color: #b91c1c; border: 1px solid #fecaca; background: #fff; cursor: pointer; font-family: inherit; }
.settings-page {
  min-height: 100vh;
  padding: 35px 40px 70px;
}

.page-header {
  margin-bottom: 28px;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
}

.page-header h1 {
  margin: 7px 0;
  font-size: 31px;
  font-weight: 800;
}

.page-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 2;
}

.settings-card {
  margin-bottom: 22px;
  padding: 28px;
  border: 1px solid #eeeeee;
  border-radius: 20px;
  background: #ffffff;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 26px;
}

.heading-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #f0eeff;
  font-size: 20px;
}

.card-heading h2 {
  margin: 0 0 5px;
  font-size: 17px;
  font-weight: 800;
}

.card-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.9;
}

/* Profile photo */

.profile-photo {
  display: flex;
  align-items: center;
  gap: 17px;
  padding-bottom: 25px;
  margin-bottom: 25px;
  border-bottom: 1px solid #eeeeee;
}

.avatar {
  width: 82px;
  height: 82px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eeeaff;
  color: var(--color-primary);
  font-size: 30px;
  font-weight: 800;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-info {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
}

.photo-info strong {
  font-size: 13px;
}

.photo-info p {
  margin: 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.upload-btn {
  padding: 8px 12px;
  border: 1px solid #e5e1ff;
  border-radius: 9px;
  background: #f5f3ff;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

/* Forms */

.form-grid,
.password-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 18px;
}

.field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.field label {
  margin-bottom: 9px;
  font-size: 12px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #e4e4ea;
  border-radius: 12px;
  outline: none;
  background: #ffffff;
  color: var(--color-text);
  font-family: inherit;
  font-size: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input,
.field select {
  height: 48px;
  padding: 0 13px;
}

.field textarea {
  padding: 13px;
  resize: vertical;
  line-height: 2;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(109, 93, 252, 0.08);
}

.field input::placeholder,
.field textarea::placeholder {
  color: #aaaab3;
}

.field small {
  margin-top: 7px;
  color: var(--color-muted);
  font-size: 9px;
  line-height: 1.8;
}

.full-width {
  grid-column: 1 / -1;
}

/* Feedback and buttons */

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 25px;
}

.primary-btn {
  min-height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 11px;
  background: var(--color-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.primary-btn:hover {
  background: var(--color-primary-dark);
}

.feedback {
  margin: 0;
  color: #268653;
  font-size: 10px;
  line-height: 1.9;
}

.feedback.error {
  margin-top: 17px;
  color: #c44f5c;
}

/* Notification preferences */

.preference-list {
  display: flex;
  flex-direction: column;
}

.preference-row {
  min-height: 77px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #eeeeee;
  cursor: pointer;
}

.preference-row:last-child {
  border-bottom: 0;
}

.preference-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preference-info strong {
  font-size: 12px;
}

.preference-info span {
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.9;
}

.preference-row input {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.demo-note {
  margin: 5px 0 0;
  color: #9999a3;
  font-size: 10px;
  line-height: 2;
  text-align: center;
}

/* Responsive */

@media (max-width: 850px) {
  .settings-page {
    padding: 28px 25px 60px;
  }
}

@media (max-width: 600px) {
  .settings-page {
    padding: 22px 15px 45px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .settings-card {
    padding: 21px 17px;
    border-radius: 17px;
  }

  .form-grid,
  .password-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .full-width {
    grid-column: auto;
  }

  .form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-btn {
    width: 100%;
  }

  .preference-row {
    gap: 12px;
  }
}
</style>