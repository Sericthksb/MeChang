import type { SubscriptionTier, UserRole } from '@/types/database'

type BadgeVariant = 'active' | 'inactive' | 'banned' | 'pending' | 'approved' | 'rejected' | SubscriptionTier | UserRole

const BADGE_STYLES: Record<BadgeVariant, string> = {
  active:    'bg-green-100 text-green-800',
  inactive:  'bg-red-100 text-red-800',
  banned:    'bg-red-200 text-red-900',
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  free:      'bg-gray-100 text-gray-600',
  starter:   'bg-slate-100 text-slate-600',
  growth:    'bg-blue-100 text-blue-700',
  pro:       'bg-orange-100 text-orange-700',
  customer:  'bg-gray-100 text-gray-600',
  provider:  'bg-blue-100 text-blue-700',
  admin:     'bg-purple-100 text-purple-700',
}

interface AdminBadgeProps {
  variant: BadgeVariant
  label?: string
}

export default function AdminBadge({ variant, label }: AdminBadgeProps) {
  const styles = BADGE_STYLES[variant] ?? 'bg-gray-100 text-gray-600'
  const text = label ?? (variant.charAt(0).toUpperCase() + variant.slice(1))
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles}`}>
      {text}
    </span>
  )
}
