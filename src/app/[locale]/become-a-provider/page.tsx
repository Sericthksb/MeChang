import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegisterClient from './RegisterClient'

export default async function BecomeAProviderPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login?redirect=/become-a-provider`)
  }

  const [userResult, providerResult] = await Promise.all([
    supabase.from('users').select('role').eq('id', user.id).single(),
    supabase.from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  // Only redirect if they have BOTH provider role AND a completed profile row
  if (userResult.data?.role === 'provider' && providerResult.data) {
    redirect(`/${locale}/profile`)
  }

  return <RegisterClient locale={locale} userId={user.id} />
}
