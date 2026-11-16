<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

interface Person {
  id: number
  name: string
  mobile: string
  email?: string | null
  city?: string | null
  bio?: string | null
  joined_at?: string | null
  items_count?: number
  given_count?: number
  received_count?: number
}

interface Req {
  id: number
  status: string
  message: string
  review_note: string | null
  created_at: string
  completed_at: string | null
  requester: Person | null
}

interface Item {
  id: number
  title: string
  category: string
  description: string
  condition: string
  condition_label: string
  city: string
  status: string
  review_note: string | null
  has_image: boolean
  created_at: string
  reviewed_at: string | null
  owner: Person | null
  requests: Req[]
}

const route = useRoute()
const { api } = useApi()
const apiBase = useApiBase()

const item = ref<Item | null>(null)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busy = ref(false)
const editing = ref(false)
const formError = ref('')
const rejecting = ref<{ kind: 'item' | 'request', id: number } | null>(null)
const reason = ref('')
const imageKey = ref(0)

useHead({ title: () => (item.value ? `${item.value.title} | بررسی آگهی` : 'بررسی آگهی') })

const itemLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده', reserved: 'رزروشده', given: 'تحویل‌شده',
}
const requestLabels: Record<string, string> = {
  pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده', completed: 'تحویل‌شده',
}

const date = (v?: string | null) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v)) : '—')
const num = (v?: number) => new Intl.NumberFormat('fa-IR').format(v ?? 0)
const imageUrl = computed(() => (item.value?.has_image ? `${apiBase}/api/admin/kindness/items/${item.value.id}/image?v=${imageKey.value}` : null))

async function load() {
  try {
    item.value = (await api<{ data: Item }>(`/api/admin/kindness/items/${route.params.id}`)).data
  } catch (e) {
    error.value = apiErrorMessage(e, 'آگهی پیدا نشد.')
  } finally {
    loading.value = false
  }
}

async function run(fn: () => Promise<unknown>, ok: string) {
  if (busy.value) return

  busy.value = true
  error.value = ''
  notice.value = ''

  try {
    await fn()
    notice.value = ok
    rejecting.value = null
    reason.value = ''
    await load()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const setItem = (status: 'approved' | 'rejected') => run(
  () => api(`/api/admin/kindness/items/${item.value!.id}/status`, { method: 'PATCH', body: { status, review_note: reason.value.trim() || undefined } }),
  status === 'approved' ? 'آگهی تأیید شد.' : 'آگهی رد شد.',
)

const setRequest = (r: Req, status: 'approved' | 'rejected' | 'completed') => run(
  () => api(`/api/admin/kindness/requests/${r.id}/status`, { method: 'PATCH', body: { status, review_note: reason.value.trim() || undefined } }),
  'وضعیت درخواست به‌روز شد.',
)

function confirmReject() {
  if (!rejecting.value || !reason.value.trim()) {
    error.value = 'دلیل رد را بنویس.'
    return
  }

  if (rejecting.value.kind === 'item') setItem('rejected')
  else setRequest(item.value!.requests.find(r => r.id === rejecting.value!.id)!, 'rejected')
}

function complete(r: Req) {
  if (window.confirm('تحویل کالا انجام شد؟')) setRequest(r, 'completed')
}

async function saveEdit(body: FormData) {
  formError.value = ''
  await run(async () => {
    try {
      await api(`/api/admin/kindness/items/${item.value!.id}`, { method: 'POST', body })
      editing.value = false
      imageKey.value++
    } catch (e) {
      formError.value = apiErrorMessage(e)
      throw e
    }
  }, 'آگهی ویرایش شد و صاحبش خبردار شد.')
}

onMounted(load)
</script>

<template>
  <section class="detail">
    <NuxtLink to="/admin/kindness" class="back">← بازگشت به فهرست</NuxtLink>

    <p v-if="loading" class="state">در حال دریافت...</p>
    <p v-else-if="!item" class="state bad">{{ error || 'آگهی پیدا نشد.' }}</p>

    <template v-else>
      <header class="head">
        <div>
          <span class="eyebrow">بررسی آگهی دیوار مهربانی</span>
          <h1>{{ item.title }}</h1>
          <p class="meta">ثبت‌شده در {{ date(item.created_at) }}<template v-if="item.reviewed_at"> · آخرین بررسی {{ date(item.reviewed_at) }}</template></p>
        </div>
        <span class="badge" :class="item.status">{{ itemLabels[item.status] ?? item.status }}</span>
      </header>

      <p v-if="notice" class="msg ok" role="status">{{ notice }}</p>
      <p v-if="error" class="msg bad" role="alert">{{ error }}</p>

      <div class="grid">
        <div class="main">
          <article class="box">
            <template v-if="!editing">
              <img v-if="imageUrl" class="photo" :src="imageUrl" :alt="item.title">
              <dl class="facts">
                <div><dt>دسته‌بندی</dt><dd>{{ item.category }}</dd></div>
                <div><dt>وضعیت کالا</dt><dd>{{ item.condition_label }}</dd></div>
                <div><dt>شهر</dt><dd>{{ item.city }}</dd></div>
              </dl>
              <h2>توضیح</h2>
              <p class="desc">{{ item.description }}</p>
              <p v-if="item.review_note" class="note">یادداشت بررسی: {{ item.review_note }}</p>

              <div v-if="rejecting?.kind === 'item'" class="reject">
                <label for="why">دلیل رد یا حذف (برای صاحب آگهی ارسال می‌شود)</label>
                <textarea id="why" v-model="reason" rows="3" maxlength="1000" />
                <div class="acts">
                  <button class="no" :disabled="busy" @click="confirmReject">ثبت رد</button>
                  <button class="ghost" @click="rejecting = null; reason = ''">انصراف</button>
                </div>
              </div>

              <div v-else class="acts">
                <button v-if="item.status === 'pending'" class="ok" :disabled="busy" @click="setItem('approved')">تأیید آگهی</button>
                <button v-if="item.status === 'pending'" class="no" :disabled="busy" @click="rejecting = { kind: 'item', id: item.id }">رد آگهی</button>
                <button v-if="item.status === 'approved'" class="no" :disabled="busy" @click="rejecting = { kind: 'item', id: item.id }">حذف از دیوار</button>
                <button class="ghost" @click="editing = true">ویرایش آگهی</button>
              </div>
            </template>

            <template v-else>
              <h2>ویرایش آگهی</h2>
              <KindnessItemForm
                :initial="item"
                :image-url="imageUrl"
                submit-label="ذخیره تغییرات"
                :busy="busy"
                :error="formError"
                @submit="saveEdit"
                @cancel="editing = false"
              />
            </template>
          </article>

          <section class="box">
            <h2>درخواست‌ها ({{ num(item.requests.length) }})</h2>
            <p v-if="!item.requests.length" class="meta">هنوز درخواستی برای این آگهی ثبت نشده.</p>

            <article v-for="r in item.requests" :key="r.id" class="req">
              <div class="top">
                <strong>{{ r.requester?.name ?? 'کاربر حذف‌شده' }}</strong>
                <span class="badge" :class="r.status">{{ requestLabels[r.status] ?? r.status }}</span>
              </div>
              <p class="meta">{{ date(r.created_at) }}<template v-if="r.completed_at"> · تحویل {{ date(r.completed_at) }}</template></p>
              <p class="desc">«{{ r.message }}»</p>

              <dl v-if="r.requester" class="person">
                <div><dt>موبایل</dt><dd dir="ltr"><a :href="`tel:${r.requester.mobile}`">{{ r.requester.mobile }}</a></dd></div>
                <div v-if="r.requester.email"><dt>ایمیل</dt><dd dir="ltr">{{ r.requester.email }}</dd></div>
                <div v-if="r.requester.city"><dt>شهر</dt><dd>{{ r.requester.city }}</dd></div>
                <div><dt>عضویت</dt><dd>{{ date(r.requester.joined_at) }}</dd></div>
                <div><dt>سابقه</dt><dd>{{ num(r.requester.received_count) }} کالا دریافت · {{ num(r.requester.given_count) }} کالا بخشیده</dd></div>
                <div v-if="r.requester.bio" class="wide"><dt>درباره او</dt><dd>{{ r.requester.bio }}</dd></div>
              </dl>

              <p v-if="r.review_note" class="note">یادداشت: {{ r.review_note }}</p>

              <div v-if="rejecting?.kind === 'request' && rejecting.id === r.id" class="reject">
                <label :for="`why-${r.id}`">دلیل رد یا لغو</label>
                <textarea :id="`why-${r.id}`" v-model="reason" rows="3" maxlength="1000" />
                <div class="acts">
                  <button class="no" :disabled="busy" @click="confirmReject">ثبت رد</button>
                  <button class="ghost" @click="rejecting = null; reason = ''">انصراف</button>
                </div>
              </div>

              <div v-else class="acts">
                <button v-if="r.status === 'pending'" class="ok" :disabled="busy || item.status !== 'approved'" :title="item.status !== 'approved' ? 'ابتدا آگهی باید تأیید و آزاد باشد' : ''" @click="setRequest(r, 'approved')">تأیید درخواست</button>
                <button v-if="r.status === 'pending'" class="no" :disabled="busy" @click="rejecting = { kind: 'request', id: r.id }">رد</button>
                <button v-if="r.status === 'approved'" class="ok" :disabled="busy" @click="complete(r)">ثبت تحویل</button>
                <button v-if="r.status === 'approved'" class="no" :disabled="busy" @click="rejecting = { kind: 'request', id: r.id }">لغو</button>
              </div>
            </article>
          </section>
        </div>

        <aside class="side">
          <section v-if="item.owner" class="box">
            <h2>آگهی‌دهنده</h2>
            <p class="name">{{ item.owner.name }}</p>
            <dl class="person">
              <div><dt>موبایل</dt><dd dir="ltr"><a :href="`tel:${item.owner.mobile}`">{{ item.owner.mobile }}</a></dd></div>
              <div v-if="item.owner.email"><dt>ایمیل</dt><dd dir="ltr">{{ item.owner.email }}</dd></div>
              <div v-if="item.owner.city"><dt>شهر</dt><dd>{{ item.owner.city }}</dd></div>
              <div><dt>عضویت</dt><dd>{{ date(item.owner.joined_at) }}</dd></div>
              <div><dt>آگهی‌ها</dt><dd>{{ num(item.owner.items_count) }} آگهی · {{ num(item.owner.given_count) }} تحویل‌شده</dd></div>
              <div><dt>دریافت‌ها</dt><dd>{{ num(item.owner.received_count) }} کالا</dd></div>
              <div v-if="item.owner.bio" class="wide"><dt>درباره او</dt><dd>{{ item.owner.bio }}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.detail { padding: 34px; max-width: 1080px; display: grid; gap: 16px; }
.back { color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: 14px; }
.head { display: flex; justify-content: space-between; align-items: start; gap: 12px; flex-wrap: wrap; }
.eyebrow { color: var(--color-primary); font-weight: 800; font-size: 12px; }
h1 { margin: 6px 0 4px; font-size: 26px; }
h2 { margin: 0 0 10px; font-size: 16px; }
.meta { margin: 0; font-size: 13px; color: #94a3b8; }
.state { padding: 28px; text-align: center; background: #fff; border: 1px dashed #d1d5db; border-radius: 16px; }
.state.bad { color: #b91c1c; background: #fef2f2; }
.msg { margin: 0; padding: 10px 14px; border-radius: 12px; font-size: 14px; }
.msg.ok { background: #ecfdf3; color: #15803d; }
.msg.bad { background: #fef2f2; color: #b91c1c; }
.grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
.main, .side { display: grid; gap: 16px; }
.side { position: sticky; top: 16px; }
.box { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; display: grid; gap: 10px; }
.photo { width: 100%; max-height: 360px; object-fit: cover; border-radius: 12px; background: #f1f5f9; }
.facts { display: flex; gap: 10px; flex-wrap: wrap; margin: 0; }
.facts div { background: #f8f8fc; border-radius: 10px; padding: 8px 14px; }
dt { font-size: 12px; color: #94a3b8; }
dd { margin: 2px 0 0; font-weight: 700; color: #1e293b; font-size: 14px; }
.desc { margin: 0; color: #334155; line-height: 2.1; white-space: pre-line; }
.note { margin: 0; color: #b45309; font-size: 13px; }
.name { margin: 0; font-weight: 800; font-size: 17px; }
.person { margin: 0; display: grid; gap: 8px; }
.person a { color: var(--color-primary); text-decoration: none; }
.req { border-top: 1px solid #f1f5f9; padding-top: 14px; display: grid; gap: 8px; }
.req:first-of-type { border-top: 0; padding-top: 0; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.req .person { background: #f8f8fc; border-radius: 12px; padding: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.wide { grid-column: 1 / -1; }
.badge { padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #eef2ff; color: #4338ca; }
.badge.approved, .badge.completed, .badge.given { background: #ecfdf3; color: #15803d; }
.badge.rejected { background: #fef2f2; color: #b91c1c; }
.badge.reserved { background: #fff7ed; color: #c2410c; }
.reject { display: grid; gap: 8px; padding: 12px; background: #fff7f7; border-radius: 12px; }
.reject label { font-size: 13px; font-weight: 700; }
textarea { width: 100%; padding: 10px; border: 1px solid #e3e3ea; border-radius: 10px; font: inherit; font-size: 16px; }
.acts { display: flex; gap: 8px; flex-wrap: wrap; }
.acts button { border: 0; border-radius: 10px; min-height: 42px; padding: 0 18px; font-family: inherit; font-weight: 800; cursor: pointer; }
.ok { background: #16a34a; color: #fff; }
.no { background: #fee2e2; color: #b91c1c; }
.ghost { background: #fff; color: #475569; border: 1px solid #e5e7eb !important; }
.acts button:disabled { opacity: .55; cursor: not-allowed; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
@media (max-width: 860px) { .detail { padding: 20px 16px; } .grid { grid-template-columns: 1fr; } .side { position: static; order: -1; } .req .person { grid-template-columns: 1fr; } }
</style>
