import HomeClient from './HomeClient'
import { createClient } from '@/lib/supabase/server'
import type { ProviderProfile, User } from '@/types/database'

interface ProviderProfileWithUser extends ProviderProfile {
  users: User | null
}

export default async function HomePage({
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
    .limit(10)

  const providers: ProviderProfileWithUser[] = error
    ? []
    : ((data ?? []) as ProviderProfileWithUser[])

  return (
    <main className="pb-6">
      <HomeClient locale={locale} providers={providers} />
    </main>
  )
}
