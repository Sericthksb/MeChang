import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import { toggleProviderActive, updateProviderTier, deleteProvider } from '../actions'
import type { SubscriptionTier } from '@/types/database'

const TIERS: SubscriptionTier[] = ['free', 'starter', 'growth', 'pro']

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, user_id, bio, categories, subscription_tier, is_active, is_certified, avg_rating, total_reviews, jobs_done, monthly_lead_count')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, phone, created_at, id_verified')
    .eq('id', profile.user_id)
    .single()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, reviewer_id')
    .eq('reviewee_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: certifications } = await supabase
    .from('certifications')
    .select('id, title, status, document_url')
    .eq('provider_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Providers', href: `/${locale}/admin/providers` },
          { label: user?.full_name ?? 'Provider' },
        ]}
        title={user?.full_name ?? 'Provider'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">🏪</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{user?.full_name ?? '—'}</h2>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <AdminBadge variant={profile.subscription_tier} />
                    <AdminBadge variant={profile.is_active ? 'active' : 'inactive'} />
                    {profile.is_certified && <AdminBadge variant="approved" label="Certified" />}
                    {user?.id_verified && <AdminBadge variant="approved" label="ID Verified" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/${locale}/admin/users/${profile.user_id}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                  User account →
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-400">Phone</dt><dd className="mt-1 font-medium">{user?.phone ?? '—'}</dd></div>
              <div><dt className="text-gray-400">Rating</dt><dd className="mt-1 font-medium">⭐ {profile.avg_rating.toFixed(1)} ({profile.total_reviews} reviews)</dd></div>
              <div><dt className="text-gray-400">Jobs done</dt><dd className="mt-1 font-medium">{profile.jobs_done}</dd></div>
              <div><dt className="text-gray-400">Monthly leads</dt><dd className="mt-1 font-medium">{profile.monthly_lead_count}</dd></div>
              <div className="col-span-2"><dt className="text-gray-400">Categories</dt><dd className="mt-1 font-medium">{profile.categories.join(', ') || '—'}</dd></div>
            </dl>
          </div>

          {/* Change tier */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Subscription Tier</h3>
            <div className="flex gap-2">
              {TIERS.map((t) => (
                <form key={t} action={async () => { 'use server'; await updateProviderTier(id, t) }}>
                  <button type="submit"
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      profile.subscription_tier === t
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {/* Toggle active / delete */}
          <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-red-600">Danger Zone</h3>
            <div className="flex gap-3">
              <form action={async () => { 'use server'; await toggleProviderActive(id, !profile.is_active) }}>
                <button type="submit" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {profile.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </form>
              <form action={async () => { 'use server'; await deleteProvider(id) }}>
                <button type="submit" className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Delete Provider
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Certifications */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Certifications</h3>
            {!certifications || certifications.length === 0 ? (
              <p className="text-sm text-gray-400">None submitted.</p>
            ) : (
              <ul className="space-y-2">
                {certifications.map((cert) => (
                  <li key={cert.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{cert.title}</span>
                    <AdminBadge variant={cert.status as 'pending' | 'approved' | 'rejected'} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent reviews */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Reviews</h3>
            {!reviews || reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>{'⭐'.repeat(r.rating)}</span>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{r.body ?? '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
