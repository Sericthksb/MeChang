import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = createServiceClient()

  const [
    { count: totalProviders },
    { count: pendingVerifications },
    { count: totalUsers },
    { count: totalReviews },
  ] = await Promise.all([
    supabase
      .from('provider_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
  ])

  const [newUsers, newReviews, newCerts] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, rating, created_at, reviewee_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('certifications')
      .select('id, status, created_at, provider_id')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  type ActivityItem = {
    key: string
    emoji: string
    text: string
    time: string
  }

  const activity: ActivityItem[] = [
    ...(newUsers.data ?? []).map((user) => ({
      key: `user-${user.id}`,
      emoji: '👤',
      text: `${user.full_name ?? 'Unknown'} joined as ${user.role}`,
      time: user.created_at,
    })),
    ...(newReviews.data ?? []).map((review) => ({
      key: `review-${review.id}`,
      emoji: '⭐',
      text: `New ${review.rating}★ review submitted`,
      time: review.created_at,
    })),
    ...(newCerts.data ?? []).map((certification) => ({
      key: `cert-${certification.id}`,
      emoji: certification.status === 'approved' ? '✅' : '📄',
      text: `Certification ${certification.status}`,
      time: certification.created_at,
    })),
  ]
    .sort((left, right) => {
      return new Date(right.time).getTime() - new Date(left.time).getTime()
    })
    .slice(0, 10)

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)

    if (mins < 60) return `${mins}m ago`

    const hrs = Math.floor(mins / 60)

    if (hrs < 24) return `${hrs}h ago`

    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Dashboard' },
        ]}
        title="Dashboard"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard
          label="Active Providers"
          value={totalProviders ?? 0}
          href={`/${locale}/admin/providers`}
        />
        <AdminStatCard
          label="Pending Verifications"
          value={pendingVerifications ?? 0}
          href={`/${locale}/admin/verification`}
        />
        <AdminStatCard
          label="Total Users"
          value={totalUsers ?? 0}
          href={`/${locale}/admin/users`}
        />
        <AdminStatCard
          label="Total Reviews"
          value={totalReviews ?? 0}
          href={`/${locale}/admin/reviews`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            ⚡ Needs Attention
          </h2>
          <div className="space-y-2">
            {(pendingVerifications ?? 0) > 0 ? (
              <Link
                href={`/${locale}/admin/verification`}
                className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3 text-sm hover:bg-orange-100"
              >
                <span className="text-orange-900">
                  {pendingVerifications} verification
                  {(pendingVerifications ?? 0) > 1 ? 's' : ''} waiting
                </span>
                <span className="font-medium text-orange-600">Review →</span>
              </Link>
            ) : (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ All caught up
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.key} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 text-base">{item.emoji}</span>
                  <span className="flex-1 text-gray-700">{item.text}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {relativeTime(item.time)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
