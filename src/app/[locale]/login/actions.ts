'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserRole } from '@/types/database'

export async function signIn(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const locale = (formData.get('locale') as string | null) ?? 'en'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(`/${locale}`)
}

export async function signUp(
  formData: FormData
): Promise<{ error: string } | { emailConfirmation: true } | void> {
  const email = (formData.get('email') as string | null)?.trim()
  const password = formData.get('password') as string | null
  const role = ((formData.get('role') as string | null) ?? 'customer') as UserRole
  const locale = (formData.get('locale') as string | null) ?? 'en'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return { emailConfirmation: true }
  }

  if (role === 'provider' && data.user) {
    const service = createServiceClient()
    await service
      .from('users')
      .update({ role: 'provider' })
      .eq('id', data.user.id)
  }

  redirect(`/${locale}`)
}
