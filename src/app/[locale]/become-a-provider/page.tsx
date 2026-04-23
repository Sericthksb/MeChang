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

  const { data: profileUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileUser?.role === 'provider') {
    redirect(`/${locale}/profile`)
  }

  return <RegisterClient locale={locale} userId={user.id} />
}
