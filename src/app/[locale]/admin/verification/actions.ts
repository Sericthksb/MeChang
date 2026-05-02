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
  const { error } = await supabase.from('users').update({ id_verified: true }).eq('id', userId)
  if (error) return { error: error.message }
  revalidateVerification()
  return null
}

export async function rejectId(userId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('users')
    .update({ id_verified: false, id_document_url: null })
    .eq('id', userId)
  revalidateVerification()
}

export async function approveCert(certId: string, providerId: string): Promise<void> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const supabase = createServiceClient()

  await supabase
    .from('certifications')
    .update({
      status: 'approved',
      verified: true,
      reviewed_at: new Date().toISOString(),
      ...(user?.id ? { reviewed_by: user.id } : {}),
    })
    .eq('id', certId)

  await supabase.from('provider_profiles').update({ is_certified: true }).eq('id', providerId)
  revalidateVerification()
}

export async function rejectCert(certId: string): Promise<void> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const supabase = createServiceClient()

  await supabase
    .from('certifications')
    .update({
      status: 'rejected',
      verified: false,
      reviewed_at: new Date().toISOString(),
      ...(user?.id ? { reviewed_by: user.id } : {}),
    })
    .eq('id', certId)

  revalidateVerification()
}
