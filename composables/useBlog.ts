export interface BlogPostSummary {
  id: number
  title: string
  slug: string
  excerpt: string
  category: string | null
  cover_image_url: string | null
  cover_image_alt: string
  published_at: string | null
  reading_time: number
}

export interface BlogPost extends BlogPostSummary {
  body_html: string
  meta_title: string
  meta_description: string
  updated_at: string | null
  author_name: string | null
  related: BlogPostSummary[]
}

export interface BlogListResponse {
  data: BlogPostSummary[]
  current_page: number
  last_page: number
  total: number
  categories: string[]
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' })

export function formatBlogDate(value?: string | null): string {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

export function formatReadingTime(minutes: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(minutes)} دقیقه مطالعه`
}
