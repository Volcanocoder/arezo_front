<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const API_BASE = useApiBase()
const route = useRoute()

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

interface ApiUser {
  id: number
  name: string
}

interface ApiWishSummary {
  id: number
  title: string
  category?: string | null
  city?: string | null
  requested_amount?: number | null
  status?: string
}

interface ApiMessage {
  id: number
  conversation_id: number
  sender_id: number
  body: string
  read_at: string | null
  created_at: string
  sender?: ApiUser
}

interface ApiConversation {
  id: number
  wish_id: number
  donor_id: number
  wish_owner_id: number
  last_message_at: string | null
  wish?: ApiWishSummary | null
  donor?: ApiUser | null
  wish_owner?: ApiUser | null
  unread_messages_count?: number
  messages?: ApiMessage[]
}

interface ChatMessage {
  id: number
  sender: 'me' | 'other'
  text: string
  time: string
  createdAt: string
}

interface Conversation {
  id: number
  wishId: number
  donorId: number
  wishOwnerId: number
  name: string
  avatar: string
  wishTitle: string
  lastMessage: string
  lastTime: string
  unread: number
  messages: ChatMessage[]
  messagesLoaded: boolean
}

const currentUserId = ref<number | null>(null)
const conversations = ref<Conversation[]>([])
const selectedConversationId = ref<number | null>(null)
const newMessage = ref('')
const search = ref('')
const loadingConversations = ref(true)
const loadingMessageId = ref<number | null>(null)
const sendingMessage = ref(false)
const pageError = ref('')
const messagesError = ref('')
const sendError = ref('')
const sendErrorType = ref<'blocked' | 'error' | ''>('')
const actionError = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null
let conversationListTimer: ReturnType<typeof setInterval> | null = null
let fetchingConversations = false
const messageRequestsInFlight = new Set<number>()

class ApiRequestError extends Error {
  status: number
  code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

const selectedConversation = computed(() =>
  conversations.value.find((conversation) => conversation.id === selectedConversationId.value) ?? null
)

const filteredConversations = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return conversations.value

  return conversations.value.filter((conversation) =>
    `${conversation.name} ${conversation.wishTitle} ${conversation.lastMessage}`
      .toLocaleLowerCase()
      .includes(query),
  )
})

const unreadTotal = computed(() =>
  conversations.value.reduce((total, conversation) => total + conversation.unread, 0),
)

function readCookie(name: string): string {
  if (!import.meta.client) return ''
  const prefix = `${name}=`
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))
  if (!item) return ''
  try {
    return decodeURIComponent(item.slice(prefix.length))
  } catch {
    return item.slice(prefix.length)
  }
}

async function refreshCsrfCookie(): Promise<void> {
  const response = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('دریافت توکن امنیتی ناموفق بود. سرور بک‌اند را بررسی کن.')
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  csrfRetried = false,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  if (isMutation) {
    // Reuse the existing CSRF cookie instead of fetching it before every message.
    if (!readCookie('XSRF-TOKEN')) {
      await refreshCsrfCookie()
    }

    const csrfToken = readCookie('XSRF-TOKEN')
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  // If the session's CSRF token has expired, refresh it and retry once.
  if (response.status === 419 && isMutation && !csrfRetried) {
    await refreshCsrfCookie()
    return apiRequest<T>(path, options, true)
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message?: unknown }).message || '')
      : ''
    const code = payload && typeof payload === 'object' && 'code' in payload
      ? String((payload as { code?: unknown }).code || '') || undefined
      : undefined

    if (response.status === 401) {
      throw new ApiRequestError('نشست ورود معتبر نیست. یک‌بار از حساب خارج شو و دوباره وارد شو.', 401, code)
    }

    if (response.status === 403) {
      throw new ApiRequestError(message || 'برای انجام این کار اجازه دسترسی نداری.', 403, code)
    }

    throw new ApiRequestError(message || `درخواست ناموفق بود (${response.status}).`, response.status, code)
  }

  return payload as T
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()

  if (sameDay) {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate()

  if (isYesterday) return 'دیروز'

  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function formatMessageTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mapConversation(item: ApiConversation): Conversation {
  const current = conversations.value.find((conversation) => conversation.id === Number(item.id))
  const isDonor = Number(item.donor_id) === currentUserId.value
  const otherUser = isDonor ? item.wish_owner : item.donor
  const name = otherUser?.name || 'کاربر آرزو'

  let lastMessage = current?.lastMessage || ''
  if (item.messages?.length) {
    lastMessage = item.messages[0]?.body || lastMessage
  }
  if (!lastMessage) {
    lastMessage = item.last_message_at ? 'برای مشاهده پیام‌ها گفتگو را باز کن' : 'هنوز پیامی ارسال نشده است'
  }

  return {
    id: Number(item.id),
    wishId: Number(item.wish_id),
    donorId: Number(item.donor_id),
    wishOwnerId: Number(item.wish_owner_id),
    name,
    avatar: name.trim().charAt(0) || '؟',
    wishTitle: item.wish?.title || 'آرزوی مربوط به این گفتگو',
    lastMessage,
    lastTime: formatDateTime(item.last_message_at),
    unread: Number(item.unread_messages_count) || 0,
    messages: current?.messages || [],
    messagesLoaded: current?.messagesLoaded || false,
  }
}

function mapMessage(item: ApiMessage): ChatMessage {
  return {
    id: Number(item.id),
    sender: Number(item.sender_id) === currentUserId.value ? 'me' : 'other',
    text: item.body,
    time: formatMessageTime(item.created_at),
    createdAt: item.created_at,
  }
}

async function fetchCurrentUser() {
  // The backend may return either { id, name, ... } or { user: { id, name, ... } }.
  const payload = await apiRequest<
    (ApiUser & { email?: string; mobile?: string; role?: string })
    | { user?: ApiUser & { email?: string; mobile?: string; role?: string } }
  >('/api/auth/me')

  const user = 'user' in payload && payload.user ? payload.user : payload as ApiUser
  const id = Number(user?.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('شناسه کاربر فعلی از پاسخ سرور دریافت نشد. یک بار دوباره تلاش کن.')
  }

  currentUserId.value = id
}

type ConversationsPayload = { data?: ApiConversation[] }

function applyConversationsPayload(payload: ConversationsPayload) {
  const records = Array.isArray(payload.data) ? payload.data : []
  const previousSelected = selectedConversationId.value
  conversations.value = records.map(mapConversation)

  if (previousSelected !== null && conversations.value.some((item) => item.id === previousSelected)) {
    selectedConversationId.value = previousSelected
  } else {
    selectedConversationId.value = conversations.value[0]?.id ?? null
  }
}

async function fetchConversations(silent = false) {
  if (fetchingConversations) return
  fetchingConversations = true
  if (!silent) {
    loadingConversations.value = true
    pageError.value = ''
  }

  try {
    const payload = await apiRequest<ConversationsPayload>('/api/conversations')
    applyConversationsPayload(payload)
  } catch (error) {
    if (!silent) {
      pageError.value = error instanceof Error ? error.message : 'دریافت گفتگوها ناموفق بود.'
    }
  } finally {
    fetchingConversations = false
    if (!silent) loadingConversations.value = false
  }
}

async function scrollMessagesToBottom() {
  await nextTick()
  const container = document.querySelector('.messages-body')
  if (container instanceof HTMLElement) container.scrollTop = container.scrollHeight
}

async function loadMessages(conversationId: number, silent = false) {
  if (messageRequestsInFlight.has(conversationId)) return
  const conversation = conversations.value.find((item) => item.id === conversationId)
  if (!conversation) return

  messageRequestsInFlight.add(conversationId)
  if (!silent) {
    loadingMessageId.value = conversationId
    messagesError.value = ''
  }

  try {
    const payload = await apiRequest<{
      conversation: { id: number; wish_id: number; wish_title?: string | null }
      messages: ApiMessage[]
    }>(`/api/conversations/${conversationId}/messages`)

    conversation.messages = (Array.isArray(payload.messages) ? payload.messages : []).map(mapMessage)
    conversation.messagesLoaded = true
    conversation.unread = 0
    if (payload.conversation?.wish_title) conversation.wishTitle = payload.conversation.wish_title

    const latest = conversation.messages[conversation.messages.length - 1]
    if (latest) {
      conversation.lastMessage = latest.text
      conversation.lastTime = formatDateTime(latest.createdAt)
    } else {
      conversation.lastMessage = 'هنوز پیامی ارسال نشده است'
      conversation.lastTime = '—'
    }

    if (selectedConversationId.value === conversationId) await scrollMessagesToBottom()
  } catch (error) {
    if (!silent) {
      messagesError.value = error instanceof Error ? error.message : 'دریافت پیام‌ها ناموفق بود.'
    }
  } finally {
    messageRequestsInFlight.delete(conversationId)
    if (loadingMessageId.value === conversationId) loadingMessageId.value = null
  }
}

async function selectConversation(conversation: Conversation) {
  selectedConversationId.value = conversation.id
  messagesError.value = ''
  sendError.value = ''
  sendErrorType.value = ''
  actionError.value = ''
  if (!conversation.messagesLoaded) await loadMessages(conversation.id)
  else await scrollMessagesToBottom()
}

async function startConversationForWish(wishId: number) {
  actionError.value = ''
  try {
    const payload = await apiRequest<{ conversation: ApiConversation; message?: string }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ wish_id: wishId }),
    })
    const conversation = mapConversation(payload.conversation)
    const existingIndex = conversations.value.findIndex((item) => item.id === conversation.id)

    if (existingIndex >= 0) conversations.value[existingIndex] = conversation
    else conversations.value.unshift(conversation)

    selectedConversationId.value = conversation.id
    await loadMessages(conversation.id)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'شروع گفتگو ناموفق بود.'
  }
}

function clearSendError() {
  sendError.value = ''
  sendErrorType.value = ''
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value)
}

async function sendMessage() {
  const body = newMessage.value.trim()
  const conversation = selectedConversation.value
  if (!body || !conversation || sendingMessage.value) return
  if (body.length > 5000) {
    sendError.value = 'متن پیام نباید بیشتر از ۵۰۰۰ نویسه باشد.'
    sendErrorType.value = 'error'
    return
  }

  sendingMessage.value = true
  sendError.value = ''
  sendErrorType.value = ''

  try {
    const payload = await apiRequest<{ data: ApiMessage; message?: string }>(
      `/api/conversations/${conversation.id}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
    )

    const sentMessage = mapMessage(payload.data)
    conversation.messages.push(sentMessage)
    conversation.messagesLoaded = true
    conversation.lastMessage = sentMessage.text
    conversation.lastTime = 'اکنون'
    newMessage.value = ''
    await scrollMessagesToBottom()
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : 'ارسال پیام ناموفق بود.'
    sendErrorType.value = error instanceof ApiRequestError && error.code === 'CHAT_MESSAGE_BLOCKED'
      ? 'blocked'
      : 'error'
    // Keep the user's draft so they can edit the message and try again.
  } finally {
    sendingMessage.value = false
  }
}

async function initialize() {
  loadingConversations.value = true
  pageError.value = ''

  try {
    // Start both initial requests together; map conversations only after user ID is known.
    const [, conversationsPayload] = await Promise.all([
      fetchCurrentUser(),
      apiRequest<ConversationsPayload>('/api/conversations'),
    ])
    applyConversationsPayload(conversationsPayload)
    loadingConversations.value = false

    const wishId = Number(route.query.wish_id)
    if (Number.isInteger(wishId) && wishId > 0) {
      await startConversationForWish(wishId)
    } else if (selectedConversationId.value !== null) {
      await loadMessages(selectedConversationId.value)
    }
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'بارگذاری پیام‌ها ناموفق بود.'
  } finally {
    loadingConversations.value = false
  }

  // Avoid frequent full-list fetches. Poll active messages more often and the list less often.
  if (import.meta.client) {
    if (pollingTimer) clearInterval(pollingTimer)
    if (conversationListTimer) clearInterval(conversationListTimer)

    pollingTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (selectedConversationId.value !== null) {
        void loadMessages(selectedConversationId.value, true)
      }
    }, 8000)

    conversationListTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchConversations(true)
      }
    }, 30000)
  }
}

onMounted(() => {
  void initialize()
})

onBeforeUnmount(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (conversationListTimer) clearInterval(conversationListTimer)
})
</script>

<template>
  <main class="messages-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">پنل کاربری</span>
        <h1>پیام‌ها</h1>
        <p>گفتگو با افرادی که در مسیر برآورده شدن آرزوها با آن‌ها در ارتباط هستی.</p>
      </div>
      <NuxtLink to="/wishes" class="find-wish-btn">دیدن آرزوها</NuxtLink>
    </header>

    <div v-if="pageError" class="page-alert" role="alert">
      <p>{{ pageError }}</p>
      <button type="button" @click="initialize">تلاش دوباره</button>
    </div>

    <div v-if="actionError" class="page-alert" role="alert">
      <p>{{ actionError }}</p>
      <button type="button" @click="actionError = ''">بستن</button>
    </div>

    <section class="messages-card">
      <aside class="conversations">
        <div class="conversations-header">
          <h2>گفتگوها</h2>
          <span>{{ conversations.length }}</span>
        </div>

        <div class="conversation-search">
          <span>⌕</span>
          <input v-model="search" type="text" placeholder="جستجوی گفتگو..." aria-label="جستجوی گفتگوها" />
        </div>

        <div v-if="loadingConversations" class="list-state" role="status">در حال دریافت گفتگوها...</div>
        <div v-else-if="!conversations.length" class="list-state">
          هنوز گفتگویی نداری.<br />برای شروع، یک آرزو را باز کن و گزینه شروع گفتگو را بزن.
        </div>
        <div v-else class="conversation-list">
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            type="button"
            class="conversation-item"
            :class="{ active: selectedConversationId === conversation.id }"
            @click="selectConversation(conversation)"
          >
            <div class="avatar-wrapper">
              <div class="avatar">{{ conversation.avatar }}</div>
            </div>
            <div class="conversation-info">
              <div class="name-row">
                <strong>{{ conversation.name }}</strong>
                <time>{{ conversation.lastTime }}</time>
              </div>
              <span class="wish-name">{{ conversation.wishTitle }}</span>
              <div class="last-row">
                <p>{{ conversation.lastMessage }}</p>
                <span v-if="conversation.unread" class="unread">{{ conversation.unread }}</span>
              </div>
            </div>
          </button>
          <div v-if="!filteredConversations.length" class="empty-conversations">گفتگویی پیدا نشد.</div>
        </div>
      </aside>

      <section v-if="selectedConversation" class="conversation">
        <header class="conversation-header">
          <div class="conversation-user">
            <div class="avatar-wrapper">
              <div class="avatar large">{{ selectedConversation.avatar }}</div>
            </div>
            <div>
              <strong>{{ selectedConversation.name }}</strong>
              <span>{{ selectedConversation.wishTitle }}</span>
            </div>
          </div>
          <NuxtLink :to="`/wishes/${selectedConversation.wishId}`" class="wish-link">مشاهده آرزو</NuxtLink>
        </header>

        <div class="messages-body">
          <div class="conversation-intro">
            <span>❤️</span>
            <strong>گفتگو درباره آرزو</strong>
            <p>ارتباط محترمانه و شفاف به شما کمک می‌کند روند برآورده شدن آرزو را بهتر هماهنگ کنید.</p>
          </div>

          <div v-if="loadingMessageId === selectedConversation.id" class="inline-state" role="status">در حال دریافت پیام‌ها...</div>
          <div v-else-if="messagesError" class="inline-state error-state" role="alert">
            <p>{{ messagesError }}</p>
            <button type="button" @click="loadMessages(selectedConversation.id)">تلاش دوباره</button>
          </div>
          <div v-else-if="!selectedConversation.messages.length" class="inline-state">هنوز پیامی در این گفتگو وجود ندارد. می‌توانی گفتگو را شروع کنی.</div>

          <div v-else class="message-list">
            <div
              v-for="message in selectedConversation.messages"
              :key="message.id"
              class="message-row"
              :class="{ mine: message.sender === 'me' }"
            >
              <div class="message-bubble">
                <p>{{ message.text }}</p>
                <time>{{ message.time }}</time>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="sendError"
          id="send-error-message"
          class="send-error"
          :class="sendErrorType"
          role="alert"
          aria-live="polite"
        >
          <span class="send-error-icon" aria-hidden="true">{{ sendErrorType === 'blocked' ? '⚠' : '!' }}</span>
          <div class="send-error-content">
            <strong>{{ sendErrorType === 'blocked' ? 'پیام ارسال نشد' : 'ارسال پیام ناموفق بود' }}</strong>
            <p>{{ sendError }}</p>
            <small v-if="sendErrorType === 'blocked'">متن پیام پاک نشده است؛ آن را اصلاح کن و دوباره بفرست.</small>
          </div>
          <button type="button" class="dismiss-send-error" aria-label="بستن پیام خطا" @click="clearSendError">×</button>
        </div>

        <form class="message-input-form" @submit.prevent="sendMessage">
          <div id="message-filter-notice" class="message-policy">
            <span aria-hidden="true">🔒</span>
            <p>برای امنیت کاربران، ارسال شماره تماس، ایمیل، لینک، اطلاعات بانکی و پیام توهین‌آمیز مجاز نیست.</p>
            <small>{{ formatCount(newMessage.length) }} از {{ formatCount(5000) }}</small>
          </div>
          <div class="message-input">
            <input
              v-model="newMessage"
              @input="clearSendError"
              type="text"
              placeholder="پیامت را بنویس..."
              autocomplete="off"
              maxlength="5000"
              aria-label="متن پیام"
              aria-describedby="message-filter-notice"
            />
            <button type="submit" :disabled="!newMessage.trim() || sendingMessage">
              {{ sendingMessage ? 'در حال ارسال...' : 'ارسال' }}
            </button>
          </div>
        </form>
      </section>

      <section v-else class="no-conversation">
        <div>💬</div>
        <h2>{{ loadingConversations ? 'در حال دریافت گفتگوها...' : 'گفتگویی را انتخاب کن' }}</h2>
        <p>وقتی گفتگویی ایجاد کنی، پیام‌هایت در این بخش نمایش داده می‌شوند.</p>
        <NuxtLink to="/wishes" class="find-wish-btn">پیدا کردن آرزو</NuxtLink>
      </section>
    </section>
  </main>
</template>

<style scoped>
.messages-page { min-height: 100vh; padding: 35px 40px 60px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 25px; margin-bottom: 28px; }
.eyebrow { color: var(--color-primary); font-size: 11px; font-weight: 800; }
.page-header h1 { margin: 7px 0; font-size: 31px; font-weight: 800; }
.page-header p { margin: 0; color: var(--color-muted); font-size: 12px; line-height: 1.9; }
.find-wish-btn { min-height: 46px; padding: 0 18px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 700; transition: .2s ease; }
.find-wish-btn:hover { background: var(--color-primary-dark); }
.page-alert { margin-bottom: 16px; padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border: 1px solid #f1c5c9; border-radius: 12px; background: #fff7f7; color: #9f3440; font-size: 12px; }
.page-alert p { margin: 0; line-height: 1.8; }
.page-alert button, .inline-state button { flex-shrink: 0; padding: 8px 12px; border: 0; border-radius: 9px; background: #f1eefe; color: var(--color-primary); font-family: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
.messages-card { min-height: 650px; display: grid; grid-template-columns: 340px minmax(0, 1fr); overflow: hidden; border: 1px solid #eee; border-radius: 20px; background: #fff; }
.conversations { display: flex; flex-direction: column; min-width: 0; border-left: 1px solid #eee; }
.conversations-header { min-height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid #eee; }
.conversations-header h2 { margin: 0; font-size: 15px; font-weight: 800; }
.conversations-header > span { min-width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f0eeff; color: var(--color-primary); font-size: 10px; font-weight: 800; }
.conversation-search { height: 43px; display: flex; align-items: center; gap: 7px; margin: 14px; padding: 0 11px; border: 1px solid #eee; border-radius: 10px; background: #f9f9fc; }
.conversation-search > span { color: #9999a3; font-size: 16px; }
.conversation-search input { width: 100%; height: 100%; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 10px; }
.conversation-list { flex: 1; overflow-y: auto; }
.list-state { padding: 26px 18px; color: var(--color-muted); font-size: 11px; line-height: 2; text-align: center; }
.conversation-item { width: 100%; display: flex; align-items: flex-start; gap: 11px; padding: 14px 15px; border: 0; border-bottom: 1px solid #f1f1f3; background: #fff; font-family: inherit; text-align: right; cursor: pointer; transition: .2s ease; }
.conversation-item:hover { background: #fafaff; }
.conversation-item.active { background: #f4f2ff; }
.avatar-wrapper { position: relative; flex-shrink: 0; }
.avatar { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #eeeaff; color: var(--color-primary); font-size: 14px; font-weight: 800; }
.avatar.large { width: 44px; height: 44px; }
.conversation-info { min-width: 0; flex: 1; }
.name-row, .last-row { display: flex; align-items: center; gap: 8px; }
.name-row { justify-content: space-between; }
.name-row strong { font-size: 11px; }
.name-row time { flex-shrink: 0; color: #a3a3ad; font-size: 8px; }
.wish-name { display: block; margin-top: 3px; color: var(--color-primary); font-size: 8px; font-weight: 600; }
.last-row { margin-top: 5px; }
.last-row p { flex: 1; min-width: 0; overflow: hidden; margin: 0; color: #888892; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.unread { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 8px; font-weight: 800; }
.empty-conversations { padding: 30px 15px; color: var(--color-muted); font-size: 10px; text-align: center; }
.conversation { min-width: 0; display: flex; flex-direction: column; }
.conversation-header { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 0 20px; border-bottom: 1px solid #eee; }
.conversation-user { display: flex; align-items: center; gap: 11px; min-width: 0; }
.conversation-user > div:last-child { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.conversation-user strong { font-size: 12px; }
.conversation-user span { overflow: hidden; color: var(--color-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.wish-link { flex-shrink: 0; color: var(--color-primary); font-size: 10px; font-weight: 700; }
.messages-body { flex: 1; min-height: 0; overflow-y: auto; padding: 25px; background: radial-gradient(circle at top left, rgba(109, 93, 252, .04), transparent 35%), #fbfbfd; }
.conversation-intro { width: min(440px, 100%); margin: 0 auto 25px; padding: 15px 18px; border-radius: 15px; background: #f0eeff; text-align: center; }
.conversation-intro > span { display: block; margin-bottom: 6px; font-size: 22px; }
.conversation-intro strong { display: block; margin-bottom: 5px; color: var(--color-primary); font-size: 11px; }
.conversation-intro p { margin: 0; color: #74727e; font-size: 9px; line-height: 1.9; }
.message-list { display: flex; flex-direction: column; gap: 10px; }
.inline-state { padding: 25px 15px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-muted); font-size: 11px; line-height: 1.9; text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #9f3440; }
.message-row { display: flex; justify-content: flex-start; }
.message-row.mine { justify-content: flex-end; }
.message-bubble { width: fit-content; max-width: min(70%, 500px); padding: 11px 13px; border-radius: 15px 15px 15px 4px; background: #fff; border: 1px solid #eee; box-shadow: 0 3px 12px rgba(40, 35, 70, .03); }
.message-row.mine .message-bubble { border: 0; border-radius: 15px 15px 4px 15px; background: var(--color-primary); color: #fff; }
.message-bubble p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 11px; line-height: 1.9; }
.message-bubble time { display: block; margin-top: 5px; color: #a2a2ad; font-size: 8px; }
.message-row.mine .message-bubble time { color: rgba(255, 255, 255, .65); }
.send-error { margin: 10px 16px 0; padding: 11px 12px; display: flex; align-items: flex-start; gap: 9px; border: 1px solid #f0c7cb; border-radius: 12px; color: #a32c3a; background: #fff6f6; font-size: 10px; line-height: 1.9; }
.send-error.blocked { border-color: #efd59e; color: #82520b; background: #fffaf0; }
.send-error-icon { flex-shrink: 0; font-size: 16px; line-height: 1.6; }
.send-error-content { flex: 1; min-width: 0; }
.send-error-content strong { display: block; margin-bottom: 2px; font-size: 11px; }
.send-error-content p { margin: 0; overflow-wrap: anywhere; }
.send-error-content small { display: block; margin-top: 4px; color: inherit; opacity: .85; }
.dismiss-send-error { flex-shrink: 0; width: 24px; height: 24px; border: 0; border-radius: 7px; background: rgba(0,0,0,.04); color: inherit; cursor: pointer; font: inherit; font-size: 17px; line-height: 1; }
.message-input-form { border-top: 1px solid #eee; background: #fff; }
.message-policy { display: flex; align-items: center; gap: 8px; padding: 10px 16px 0; color: var(--color-muted); font-size: 9px; line-height: 1.8; }
.message-policy > span { flex-shrink: 0; }
.message-policy p { flex: 1; margin: 0; }
.message-policy small { flex-shrink: 0; color: #a0a0aa; white-space: nowrap; }
.message-input { display: flex; align-items: center; gap: 9px; padding: 10px 16px 14px; background: #fff; }
.message-input input { flex: 1; min-width: 0; height: 45px; padding: 0 14px; border: 1px solid #e5e5eb; border-radius: 11px; outline: 0; background: #f9f9fc; font-family: inherit; font-size: 11px; }
.message-input input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(109, 93, 252, .07); }
.message-input button { width: 95px; height: 45px; flex-shrink: 0; border: 0; border-radius: 11px; background: var(--color-primary); color: #fff; font-family: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
.message-input button:hover:not(:disabled) { background: var(--color-primary-dark); }
.message-input button:disabled { opacity: .45; cursor: not-allowed; }
.no-conversation { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-width: 0; padding: 50px; text-align: center; }
.no-conversation > div { font-size: 45px; }
.no-conversation h2 { margin: 3px 0; font-size: 19px; }
.no-conversation p { margin: 0 0 8px; color: var(--color-muted); font-size: 11px; line-height: 1.9; }
@media (max-width: 950px) { .messages-page { padding: 28px 25px 50px; } .messages-card { grid-template-columns: 290px minmax(0, 1fr); } }
@media (max-width: 750px) { .messages-page { padding: 22px 15px 40px; } .page-header { align-items: flex-start; flex-direction: column; } .find-wish-btn { width: 100%; } .messages-card { min-height: 700px; grid-template-columns: 1fr; } .conversations { border-left: 0; border-bottom: 1px solid #eee; max-height: 270px; } .conversation-list { max-height: 190px; } .conversation-header { padding: 0 14px; } .messages-body { padding: 18px 12px; } .message-bubble { max-width: 85%; } }
@media (max-width: 450px) { .wish-link { display: none; } .page-alert { align-items: flex-start; flex-direction: column; } .message-input button { width: 80px; } .message-policy { align-items: flex-start; flex-wrap: wrap; } .message-policy small { margin-right: 24px; } }
</style>
