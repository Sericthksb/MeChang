import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPromoBySlug } from '@/lib/promotions'
import ProviderCard from '@/components/ProviderCard'
import type { ProviderProfileWithUser } from '@/app/[locale]/(app)/HomeClient'

export const dynamic = 'force-dynamic'

export default async function PromoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const promo = getPromoBySlug(slug)

  if (!promo) {
    notFound()
  }

  const t = await getTranslations('promoDetail')
  const supabase = createServiceClient()

  // Use the service client since unauthenticated users need embedded 'users'
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*, users!inner(*)')
    .eq('is_active', true)
    .contains('categories', [promo.categoryTarget])
    .order('avg_rating', { ascending: false })
    .limit(4)

  const providers: ProviderProfileWithUser[] = error
    ? []
    : ((data ?? []) as unknown as ProviderProfileWithUser[])

  const searchParams = new URLSearchParams()
  searchParams.set('category', promo.categoryTarget)
  if (promo.queryTarget) {
    searchParams.set('q', promo.queryTarget)
  }
  const exploreUrl = `/${locale}/explore?${searchParams.toString()}`

  return (
    <main className="pb-16">
      {/* Hero Section */}
      <section className="bg-orange-50 px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t(`${promo.id}.headline`)}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
          {t(`${promo.id}.description`)}
        </p>
      </section>

      {/* Suggested Providers Section */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {t('suggestedProviders')}
        </h2>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                id={provider.id}
                name={provider.users?.full_name ?? 'Unnamed Provider'}
                category={provider.categories[0] ?? 'General Service'}
                avatarUrl={provider.users?.avatar_url ?? null}
                coverPhotoUrl={provider.cover_photo_url}
                avgRating={provider.avg_rating}
                totalReviews={provider.total_reviews}
                languages={provider.languages}
                pricingNote={provider.pricing_note}
                isFeatured={false}
                subscriptionTier={provider.subscription_tier}
                isVerified={provider.users?.id_verified ?? false}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-gray-100 bg-gray-50 py-12 text-center text-sm text-gray-500 shadow-sm">
            {t('noProviders')}
          </p>
        )}

        {/* Explore More CTA */}
        <div className="mt-8 text-center">
          <Link
            href={exploreUrl}
            className="inline-block rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            {t('exploreMore')}
          </Link>
        </div>
      </section>
    </main>
  )
}
