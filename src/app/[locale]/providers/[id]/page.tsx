import Image from 'next/image'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { createClient } from '@/lib/supabase/server'
import type {
  Certification,
  ProviderPhoto,
  ProviderProfile,
  Review,
  User,
} from '@/types/database'

interface ProviderProfileFull extends ProviderProfile {
  users: User | null
  provider_photos: ProviderPhoto[]
  certifications: Certification[]
  reviews: (Review & { reviewer: { full_name: string | null } | null })[]
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 text-gray-400"
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

function StarIcon({
  filled = true,
  className = 'h-4 w-4 text-amber-400',
}: {
  filled?: boolean
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : '1.8'}
    >
      <path d="m12 2.75 2.86 5.79 6.39.93-4.62 4.5 1.1 6.36L12 17.32l-5.73 3.01 1.1-6.36-4.62-4.5 6.39-.93L12 2.75Z" />
    </svg>
  )
}

function formatReviewDate(locale: string, date: string) {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getResponseTimeLabel(hours: number) {
  if (hours < 1) {
    return '< 1h'
  }

  return `~${Math.round(hours)}h`
}

function renderStars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={`star-${index}`}
          filled={index < rounded}
          className={
            index < rounded
              ? 'h-4 w-4 text-amber-400'
              : 'h-4 w-4 text-gray-200'
          }
        />
      ))}
    </div>
  )
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      users(*),
      provider_photos(*),
      certifications!certifications_provider_id_fkey(*),
      reviews!reviews_reviewee_id_fkey(
        *,
        reviewer:users!reviews_reviewer_id_fkey(full_name)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    notFound()
  }

  const provider = data as ProviderProfileFull
  const providerName = provider.users?.full_name ?? 'Unnamed Provider'
  const coverPhotoUrl = provider.provider_photos[0]?.url ?? null
  const avatarUrl = provider.users?.avatar_url ?? null
  const subscriptionTier = provider.subscription_tier
  const isVerified = provider.users?.id_verified === true
  const isCertified = provider.is_certified

  return (
    <main className="pb-28">
      <section className="relative">
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt={providerName}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="absolute -bottom-10 left-4 h-20 w-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow-sm">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={providerName}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <PersonIcon />
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pt-12">
        <h1 className="text-xl font-bold text-gray-900">{providerName}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {subscriptionTier === 'pro' ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              Pro
            </span>
          ) : subscriptionTier === 'growth' ? (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
              Growth
            </span>
          ) : subscriptionTier === 'starter' ? (
            <span className="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-bold text-white">
              Starter
            </span>
          ) : null}
          {isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-green-600">
              <VerifiedIcon />
              Verified
            </span>
          ) : null}
          {isCertified ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              Certified
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-gray-600">
          ⭐ {provider.avg_rating.toFixed(1)} · {provider.total_reviews} reviews
        </p>
      </section>

      <section className="mt-12 grid grid-cols-3 border-t border-b border-gray-100 py-3 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">{provider.jobs_done}</p>
          <p className="text-xs text-gray-500">Jobs Done</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {provider.avg_rating.toFixed(1)} ⭐
          </p>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {getResponseTimeLabel(provider.avg_response_hours)}
          </p>
          <p className="text-xs text-gray-500">Response Time</p>
        </div>
      </section>

      {provider.bio ? (
        <section className="mt-6 px-4">
          <h2 className="text-base font-semibold text-gray-900">About</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{provider.bio}</p>
        </section>
      ) : null}

      {provider.categories.length > 0 ? (
        <section className="mt-6 px-4">
          <h2 className="text-base font-semibold text-gray-900">Services</h2>
          <div className="mt-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {provider.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {provider.provider_photos.length > 0 ? (
        <section className="mt-6 px-4">
          <h2 className="text-base font-semibold text-gray-900">Gallery</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {provider.provider_photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? providerName}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 px-4">
        <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
        <div className="mt-3">
          {provider.reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            provider.reviews.map((review) => (
              <article
                key={review.id}
                className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {renderStars(review.rating)}
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {review.reviewer?.full_name ?? 'Anonymous'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatReviewDate(locale, review.created_at)}
                  </p>
                </div>
                {review.body ? (
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {review.body}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <ProfileClient
        locale={locale}
        providerId={provider.id}
        providerName={providerName}
      />
    </main>
  )
}
