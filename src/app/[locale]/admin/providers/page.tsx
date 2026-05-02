import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminTableControls from '@/components/admin/AdminTableControls'
import type { ProviderProfile, User, SubscriptionTier } from '@/types/database'

interface ProvidersPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; tier?: string; status?: string; page?: string }>
}

function parsePage(v: string | undefined) {
  const n = parseInt(v ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

export default async function AdminProvidersPage({ params, searchParams }: ProvidersPageProps) {
  const { locale } = await params
  const { q, tier, status, page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  let query = supabase
    .from('provider_profiles')
    .select('id, user_id, subscription_tier, is_active, avg_rating, total_reviews, jobs_done, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (tier) query = query.eq('subscription_tier', tier)
  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)

  const { data, count, error } = await query
  type ProfileRow = Pick<ProviderProfile, 'id' | 'user_id' | 'subscription_tier' | 'is_active' | 'avg_rating' | 'total_reviews' | 'jobs_done'> & { created_at: string }
  const profiles: ProfileRow[] = error ? [] : ((data ?? []) as ProfileRow[])

  const userIds = profiles.map((p) => p.user_id)
  const { data: usersData } = userIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', userIds)
    : { data: [] as Pick<User, 'id' | 'full_name'>[] }

  const userMap = new Map((usersData ?? []).map((u) => [u.id, u]))

  // Apply name search client-side after join (provider name is in users table)
  const filtered = q
    ? profiles.filter((p) => userMap.get(p.user_id)?.full_name?.toLowerCase().includes(q.toLowerCase()))
    : profiles

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[{ label: 'Admin', href: `/${locale}/admin/dashboard` }, { label: 'Providers' }]}
        title="Providers"
        subtitle={`${count ?? 0} total`}
      />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <AdminTableControls
            searchPlaceholder="Search by name…"
            filters={[
              {
                key: 'tier',
                label: 'All Tiers',
                options: (['free', 'starter', 'growth', 'pro'] as SubscriptionTier[]).map((t) => ({
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                  value: t,
                })),
              },
              {
                key: 'status',
                label: 'All Status',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ],
              },
            ]}
          />
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Tier</th>
              <th className="px-6 py-3 text-left font-medium">Rating</th>
              <th className="px-6 py-3 text-left font-medium">Jobs</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Joined</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No providers found.</td></tr>
            ) : filtered.map((p) => {
              const user = userMap.get(p.user_id)
              return (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{user?.full_name ?? '—'}</td>
                  <td className="px-6 py-4"><AdminBadge variant={p.subscription_tier} /></td>
                  <td className="px-6 py-4 text-gray-600">⭐ {p.avg_rating.toFixed(1)} ({p.total_reviews})</td>
                  <td className="px-6 py-4 text-gray-600">{p.jobs_done}</td>
                  <td className="px-6 py-4"><AdminBadge variant={p.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-6 py-4 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/${locale}/admin/providers/${p.id}`} className="text-orange-500 hover:underline">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={`/${locale}/admin/providers?page=${currentPage - 1}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">← Prev</Link>
            )}
            {currentPage < totalPages && (
              <Link href={`/${locale}/admin/providers?page=${currentPage + 1}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">Next →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
