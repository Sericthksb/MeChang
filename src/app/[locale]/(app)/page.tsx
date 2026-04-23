import HomeClient, { type ProviderProfileWithUser } from './HomeClient'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*, users(*)')
    .eq('is_active', true)
    .order('boost_until', { ascending: false, nullsFirst: false })
    .order('avg_rating', { ascending: false })
    .limit(10)

  const providers: ProviderProfileWithUser[] = error
    ? []
    : ((data ?? []) as ProviderProfileWithUser[])

  const today = new Date().toISOString().slice(0, 10)
  const { data: featuredData, error: featuredError } = await supabase
    .from('provider_profiles')
    .select('*, users(*)')
    .eq('is_active', true)
    .eq('subscription_tier', 'pro')
    .gt('featured_until', today)
    .order('avg_rating', { ascending: false })
    .limit(6)

  const featuredProviders: ProviderProfileWithUser[] = featuredError
    ? []
    : ((featuredData ?? []) as ProviderProfileWithUser[])

  return (
    <main className="pb-6">
      <HomeClient
        locale={locale}
        providers={providers}
        featuredProviders={featuredProviders}
      />
    </main>
  )
}
