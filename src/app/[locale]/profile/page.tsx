import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProviderProfile, User } from '@/types/database'

type LocaleParams = Promise<{ locale: string }>

type UserProfileRow = Pick<
  User,
  'id' | 'role' | 'full_name' | 'email' | 'phone' | 'avatar_url' | 'id_verified'
>

type ProviderProfileRow = Pick<
  ProviderProfile,
  | 'id'
  | 'subscription_tier'
  | 'categories'
  | 'monthly_lead_count'
  | 'avg_rating'
  | 'jobs_done'
  | 'user_id'
>

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function VerifiedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
    >
      <path d="M12 2.75 14.3 4l2.6-.17L18 6.1l2.36 1.2-.17 2.62L21.25 12 20.2 14.08l.17 2.62L18 17.9l-1.1 2.27-2.6-.17L12 21.25 9.7 20l-2.6.17L6 17.9l-2.36-1.2.17-2.62L2.75 12 3.8 9.92l-.17-2.62L6 6.1l1.1-2.27L9.7 4 12 2.75Zm3.24 6.9a.75.75 0 0 0-1.08 0l-3.2 3.24-1.12-1.12a.75.75 0 1 0-1.06 1.06l1.65 1.65a.75.75 0 0 0 1.06 0l3.75-3.75a.75.75 0 0 0 0-1.06Z" />
    </svg>
  )
}

function formatRating(rating: number) {
  if (!Number.isFinite(rating)) {
    return '0.0'
  }

  return rating.toFixed(1)
}

function formatRole(role: UserProfileRow['role']) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatTier(tier: ProviderProfileRow['subscription_tier']) {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

function formatCategories(categories: string[]) {
  if (categories.length === 0) {
    return 'None yet'
  }

  return categories.join(', ')
}

function AccountCard({
  user,
}: {
  user: UserProfileRow
}) {
  const displayName = user.full_name?.trim() || 'Unnamed account'

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900">{displayName}</p>
          <p className="mt-1 text-sm text-gray-500">{user.email ?? 'No email on file'}</p>
          <p className="mt-1 text-sm text-gray-500">{user.phone ?? 'No phone on file'}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {formatRole(user.role)}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                user.id_verified
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {user.id_verified ? <VerifiedIcon /> : null}
              {user.id_verified ? 'Verified' : 'Not verified'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function SummaryStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

export default async function ProfilePage({
  params,
}: {
  params: LocaleParams
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect(`/${locale}/login?redirect=/profile`)
  }

  const [userResult, providerResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, role, full_name, email, phone, avatar_url, id_verified')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('provider_profiles')
      .select(
        'id, user_id, subscription_tier, categories, monthly_lead_count, avg_rating, jobs_done'
      )
      .eq('user_id', authUser.id)
      .maybeSingle(),
  ])

  const user = userResult.data as UserProfileRow | null
  const providerProfile = providerResult.data as ProviderProfileRow | null
  const isProvider = user?.role === 'provider'
  const categoryText = providerProfile ? formatCategories(providerProfile.categories) : 'None yet'

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Manage your account details and provider status.
          </p>
        </header>

        {user ? (
          <div className="space-y-4">
            <AccountCard user={user} />

            {isProvider ? (
              providerProfile ? (
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        Provider summary
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Your public-facing provider details.
                      </p>
                    </div>

                    <Link
                      href={`/${locale}/providers/${providerProfile.id}`}
                      className="inline-flex shrink-0 items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                    >
                      View public profile
                    </Link>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryStat
                      label="Tier"
                      value={formatTier(providerProfile.subscription_tier)}
                    />
                    <SummaryStat
                      label="Category count"
                      value={String(providerProfile.categories.length)}
                    />
                    <SummaryStat
                      label="Monthly leads"
                      value={String(providerProfile.monthly_lead_count)}
                    />
                    <SummaryStat
                      label="Rating"
                      value={formatRating(providerProfile.avg_rating)}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Jobs done:{' '}
                    <span className="font-semibold text-gray-900">
                      {providerProfile.jobs_done}
                    </span>
                  </div>
                  <div className="mt-3 rounded-2xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Categories
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {categoryText}
                    </p>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-base font-semibold text-amber-900">
                    Provider profile missing
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Your account is marked as a provider, but there is no provider profile
                    row yet.
                  </p>
                  <Link
                    href={`/${locale}/become-a-provider`}
                    className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                  >
                    Complete provider setup
                  </Link>
                </section>
              )
            ) : (
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-base font-semibold text-gray-900">Customer account</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  You can upgrade to a provider account whenever you are ready to offer
                  services.
                </p>
                <Link
                  href={`/${locale}/become-a-provider`}
                  className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                >
                  Become a provider
                </Link>
              </section>
            )}
          </div>
        ) : (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-gray-900">Profile unavailable</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              We could not load your account details right now.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
