import Link from 'next/link'
import { toggleProviderActive } from './actions'
import { createServiceClient } from '@/lib/supabase/service'
import type { ProviderProfile, User } from '@/types/database'

interface ProviderRow extends Pick<
  ProviderProfile,
  'id' | 'user_id' | 'subscription_tier' | 'is_active' | 'jobs_done' | 'is_certified'
> {}

interface ProviderUserRow extends Pick<User, 'id' | 'full_name' | 'id_verified'> {}

interface ProvidersPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

export default async function AdminProvidersPage({
  params,
  searchParams,
}: ProvidersPageProps) {
  const { locale } = await params
  const { page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  const { data, count, error } = await supabase
    .from('provider_profiles')
    .select(
      'id, user_id, subscription_tier, is_active, jobs_done, is_certified',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const profiles: ProviderRow[] = error ? [] : ((data ?? []) as ProviderRow[])
  const userIds = profiles.map((profile) => profile.user_id)

  const { data: usersData } =
    userIds.length > 0
      ? await supabase
          .from('users')
          .select('id, full_name, id_verified')
          .in('id', userIds)
      : { data: [] as ProviderUserRow[] }

  const userMap = new Map<string, ProviderUserRow>(
    ((usersData ?? []) as ProviderUserRow[]).map((user) => [user.id, user])
  )

  const hasPreviousPage = currentPage > 1
  const hasNextPage = offset + profiles.length < (count ?? 0)

  return (
    <main className="space-y-4">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Providers</h2>
            <p className="text-sm text-gray-500">
              Review account status, tier, and verification signals.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Page {currentPage}
            {count ? ` of ${Math.max(1, Math.ceil(count / pageSize))}` : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Tier</th>
                <th className="px-3 py-3 font-medium">Active</th>
                <th className="px-3 py-3 font-medium">Jobs Done</th>
                <th className="px-3 py-3 font-medium">Verified</th>
                <th className="px-3 py-3 font-medium">Certified</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-gray-500"
                  >
                    No providers found.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => {
                  const user = userMap.get(profile.user_id)

                  return (
                    <tr key={profile.id} className="border-b border-gray-100">
                      <td className="px-3 py-4 font-medium text-gray-900">
                        {user?.full_name ?? 'Unnamed provider'}
                      </td>
                      <td className="px-3 py-4 text-gray-600">
                        {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
                      </td>
                      <td className="px-3 py-4 text-gray-600">
                        {profile.is_active ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4 text-gray-600">
                        {profile.jobs_done}
                      </td>
                      <td className="px-3 py-4 text-gray-600">
                        {user?.id_verified ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4 text-gray-600">
                        {profile.is_certified ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <form
                            action={async () => {
                              'use server'
                              await toggleProviderActive(
                                profile.id,
                                !profile.is_active
                              )
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                            >
                              {profile.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </form>
                          <Link
                            href={`/${locale}/providers/${profile.id}`}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/${locale}/admin/providers?page=${Math.max(1, currentPage - 1)}`}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${
              hasPreviousPage
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'pointer-events-none border-gray-100 text-gray-300'
            }`}
          >
            Previous
          </Link>
          <Link
            href={`/${locale}/admin/providers?page=${currentPage + 1}`}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${
              hasNextPage
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'pointer-events-none border-gray-100 text-gray-300'
            }`}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  )
}
