'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

function revalidateVerification() {
  revalidatePath('/en/admin/verification')
  revalidatePath('/th/admin/verification')
}

export async function approveId(userId: string): Promise<{ error: string } | null> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('users')
    .update({ id_verified: true })
    .eq('id', userId)

  if (error) return { error: error.message }

  const { data: verified, error: verifyError } = await supabase
    .from('users')
    .select('id_verified')
    .eq('id', userId)
    .single()

  if (verifyError) return { error: verifyError.message }
  if (!verified.id_verified) return { error: 'ID approval did not persist — please try again.' }

  revalidateVerification()
  return null
}

export async function rejectId(userId: string): Promise<{ error: string } | null> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ id_verified: false, id_document_url: null })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidateVerification()
  return null
}

export async function approveCert(
  certId: string,
  providerId: string
): Promise<{ error: string } | null> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const supabase = createServiceClient()

  const { error: certError } = await supabase
    .from('certifications')
    .update({
      status: 'approved',
      verified: true,
      reviewed_at: new Date().toISOString(),
      ...(user?.id ? { reviewed_by: user.id } : {}),
    })
    .eq('id', certId)

  if (certError) return { error: certError.message }

  const { error: profileError } = await supabase
    .from('provider_profiles')
    .update({ is_certified: true })
    .eq('id', providerId)

  if (profileError) return { error: profileError.message }
  revalidateVerification()
  return null
}

export async function rejectCert(certId: string): Promise<{ error: string } | null> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('certifications')
    .update({
      status: 'rejected',
      verified: false,
      reviewed_at: new Date().toISOString(),
      ...(user?.id ? { reviewed_by: user.id } : {}),
    })
    .eq('id', certId)

  if (error) return { error: error.message }
  revalidateVerification()
  return null
}
