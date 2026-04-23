import ExploreClient from './ExploreClient'
import { createClient } from '@/lib/supabase/server'
import type { ProviderProfile, User } from '@/types/database'

interface ProviderProfileWithUser extends ProviderProfile {
  users: User | null
}

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*, users(*)')
    .eq('is_active', true)
    .order('boost_until', { ascending: false, nullsFirst: false })
    .order('avg_rating', { ascending: false })

  const providers: ProviderProfileWithUser[] = error
    ? []
    : ((data ?? []) as ProviderProfileWithUser[])

  return (
    <main className="pb-6">
      <h1 className="text-2xl font-bold text-gray-900 px-4 pt-6 pb-2">
        Find trusted services in Phuket
      </h1>
      <ExploreClient locale={locale} providers={providers} />
    </main>
  )
}
