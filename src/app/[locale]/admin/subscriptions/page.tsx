import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminTableControls from '@/components/admin/AdminTableControls'
import { changeSubscriptionTier } from './actions'
import type { SubscriptionTier, User, ProviderProfile } from '@/types/database'

interface SubscriptionsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tier?: string; page?: string }>
}

const TIERS: SubscriptionTier[] = ['free', 'starter', 'growth', 'pro']

function parsePage(v: string | undefined) {
  const n = parseInt(v ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

export default async function AdminSubscriptionsPage({ params, searchParams }: SubscriptionsPageProps) {
  const { locale } = await params
  const { tier, page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  let query = supabase
    .from('provider_profiles')
    .select('id, user_id, subscription_tier, monthly_lead_count, lead_count_reset_at', { count: 'exact' })
    .order('subscription_tier', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (tier) query = query.eq('subscription_tier', tier)

  const { data, count, error } = await query
  type ProfileRow = Pick<ProviderProfile, 'id' | 'user_id' | 'subscription_tier' | 'monthly_lead_count' | 'lead_count_reset_at'>
  const profiles: ProfileRow[] = error ? [] : ((data ?? []) as ProfileRow[])

  const userIds = profiles.map((p) => p.user_id)
  const { data: usersData } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', userIds)
    : { data: [] as Pick<User, 'id' | 'full_name'>[] }

  const userMap = new Map((usersData ?? []).map((u) => [u.id, u.full_name]))
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  const TIER_LIMITS: Record<SubscriptionTier, number | string> = {
    free: 3,
    starter: 15,
    growth: 40,
    pro: '∞',
  }

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[{ label: 'Admin', href: `/${locale}/admin/dashboard` }, { label: 'Subscriptions' }]}
        title="Subscriptions"
        subtitle={`${count ?? 0} providers`}
      />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <AdminTableControls
            filters={[{
              key: 'tier',
              label: 'All Tiers',
              options: TIERS.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t })),
            }]}
          />
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Provider</th>
              <th className="px-6 py-3 text-left font-medium">Current Tier</th>
              <th className="px-6 py-3 text-left font-medium">Leads This Month</th>
              <th className="px-6 py-3 text-left font-medium">Limit</th>
              <th className="px-6 py-3 text-left font-medium">Reset At</th>
              <th className="px-6 py-3 text-left font-medium">Change Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {profiles.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No providers found.</td></tr>
            ) : profiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{userMap.get(p.user_id) ?? '—'}</td>
                <td className="px-6 py-4"><AdminBadge variant={p.subscription_tier} /></td>
                <td className="px-6 py-4 text-gray-600">{p.monthly_lead_count}</td>
                <td className="px-6 py-4 text-gray-600">{TIER_LIMITS[p.subscription_tier]}</td>
                <td className="px-6 py-4 text-gray-400">
                  {p.lead_count_reset_at ? new Date(p.lead_count_reset_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {TIERS.map((t) => (
                      <form key={t} action={async () => { 'use server'; await changeSubscriptionTier(p.id, t) }}>
                        <button type="submit"
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            p.subscription_tier === t
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a href={`/${locale}/admin/subscriptions?page=${currentPage - 1}${tier ? `&tier=${tier}` : ''}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">← Prev</a>
            )}
            {currentPage < totalPages && (
              <a href={`/${locale}/admin/subscriptions?page=${currentPage + 1}${tier ? `&tier=${tier}` : ''}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">Next →</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
