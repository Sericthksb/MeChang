import Image from 'next/image'
import Link from 'next/link'

export interface ProviderCardProps {
  id: string
  name: string
  category: string
  avatarUrl: string | null
  coverPhotoUrl: string | null
  avgRating: number
  totalReviews: number
  languages: string[]
  pricingNote: string | null
  isFeatured: boolean
  isPro: boolean
  isVerified: boolean
  locale: string
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

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v8A1.5 1.5 0 0 1 19 17.5H9l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z" />
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

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-amber-400"
      fill="currentColor"
    >
      <path d="m12 2.75 2.86 5.79 6.39.93-4.62 4.5 1.1 6.36L12 17.32l-5.73 3.01 1.1-6.36-4.62-4.5 6.39-.93L12 2.75Z" />
    </svg>
  )
}

function formatLanguage(language: string): string {
  return language.toUpperCase()
}

function getReviewLabel(locale: string, count: number): string {
  if (locale === 'th') {
    return 'รีวิว'
  }

  return count === 1 ? 'review' : 'reviews'
}

function getVerifiedLabel(locale: string): string {
  return locale === 'th' ? 'ยืนยันแล้ว' : 'Verified'
}

function getFeaturedLabel(locale: string): string {
  return locale === 'th' ? 'แนะนำ' : 'FEATURED'
}

function getChatLabel(locale: string): string {
  return locale === 'th' ? 'แชท' : 'Chat'
}

export default function ProviderCard({
  id,
  name,
  category,
  avatarUrl,
  coverPhotoUrl,
  avgRating,
  totalReviews,
  languages,
  pricingNote,
  isFeatured,
  isPro,
  isVerified,
  locale,
}: ProviderCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="relative h-32 overflow-hidden">
        {coverPhotoUrl ? (
          <Image
            src={coverPhotoUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}

        <div className="absolute -bottom-10 left-4">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow-sm">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <PersonIcon />
                </div>
              )}
            </div>

            {isFeatured ? (
              <span className="absolute -left-2 -top-2 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-800 shadow-sm">
                {getFeaturedLabel(locale)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 pt-12">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[16px] font-semibold leading-6 text-gray-900">
              {name}
            </h2>
            {isPro ? (
              <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                PRO
              </span>
            ) : null}
            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-green-100 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-green-600">
                <VerifiedIcon />
                {getVerifiedLabel(locale)}
              </span>
            ) : null}
          </div>

          <p className="mb-1 text-[14px] leading-5 text-gray-500">{category}</p>

          <div className="flex items-center gap-1">
            <StarIcon />
            <span className="text-sm font-medium text-gray-900">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({totalReviews} {getReviewLabel(locale, totalReviews)})
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-1">
              {languages.map((language) => (
                <span
                  key={`${id}-${language}`}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500"
                >
                  {formatLanguage(language)}
                </span>
              ))}
            </div>

            {pricingNote ? (
              <p className="ml-auto text-right text-xs text-gray-500">
                {pricingNote}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href={`/${locale}/chat`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <ChatIcon />
          {getChatLabel(locale)}
        </Link>
      </div>
    </article>
  )
}
