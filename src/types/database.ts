export type UserRole = 'customer' | 'provider' | 'admin'
export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'pro'
export type NotificationType =
  | 'new_chat'
  | 'new_review'
  | 'lead_charged'
  | 'id_approved'
export type TransactionType = 'lead_fee' | 'subscription' | 'boost'
export type TransactionStatus = 'pending' | 'success' | 'failed'

export interface User {
  id: string
  phone: string | null
  email: string | null
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  address_line1: string | null
  address_line2: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
  postal_code: string | null
  id_verified: boolean
  id_document_url: string | null
  created_at: string
}

export interface ProviderProfile {
  id: string
  user_id: string
  bio: string | null
  categories: string[]
  service_areas: string[]
  pricing_note: string | null
  languages: string[]
  availability: AvailabilitySchedule | null
  subscription_tier: SubscriptionTier
  boost_until: string | null
  featured_until: string | null
  monthly_lead_count: number
  lead_count_reset_at: string
  avg_rating: number
  total_reviews: number
  response_rate: number
  avg_response_hours: number
  is_active: boolean
  is_certified: boolean
  jobs_done: number
  cover_photo_url: string | null
}

export interface AvailabilitySchedule {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

export interface DaySchedule {
  open: boolean
  from: string
  to: string
}

export interface Wallet {
  id: string
  provider_id: string
  balance_satang: number
  updated_at: string
}

export interface Service {
  id: string
  name_en: string
  name_th: string
  icon: string | null
  parent_category: string | null
}

export interface ProviderPhoto {
  id: string
  provider_id: string
  url: string
  caption: string | null
  created_at: string
}

export interface Certification {
  id: string
  provider_id: string
  title: string
  issuer: string | null
  issued_date: string | null
  document_url: string | null
  verified: boolean
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface Chat {
  id: string
  customer_id: string
  provider_id: string
  created_at: string
  lead_fee_charged: boolean
  status: 'active' | 'completed' | 'disputed'
  completed_at: string | null
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  body: string | null
  created_at: string
  type: 'text' | 'image' | 'video' | 'file' | 'location'
  attachment_url: string | null
  metadata: Record<string, unknown> | null
}

export interface Review {
  id: string
  chat_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  body: string | null
  provider_response: string | null
  is_auto_confirmed: boolean
  created_at: string
}

export interface SavedProvider {
  id: string
  customer_id: string
  provider_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  body: string
  is_read: boolean
  created_at: string
}

export interface Transaction {
  id: string
  provider_id: string
  type: TransactionType
  amount_satang: number
  omise_charge_id: string | null
  status: TransactionStatus
  created_at: string
}

export interface ProviderWithProfile extends User {
  provider_profiles: ProviderProfile
}
