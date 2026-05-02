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

  const { data: beforeUser, error: beforeError } = await supabase
    .from('users')
    .select('id, id_verified, id_document_url')
    .eq('id', userId)
    .single()

  if (beforeError) return { error: `ID approve precheck failed: ${beforeError.message}` }

  const { data: updatedRows, error } = await supabase
    .from('users')
    .update({ id_verified: true })
    .eq('id', userId)
    .select('id, id_verified, id_document_url')

  if (error) return { error: error.message }

  const { data: updatedUser, error: verifyError } = await supabase
    .from('users')
    .select('id, id_verified, id_document_url')
    .eq('id', userId)
    .single()

  if (verifyError) return { error: verifyError.message }
  if (!updatedUser.id_verified) {
    const updatedRow = updatedRows?.[0]
    return {
      error:
        `ID approval mismatch: before=${beforeUser.id_verified}, ` +
        `updated=${updatedRow?.id_verified ?? 'none'}, ` +
        `after=${updatedUser.id_verified}, ` +
        `doc=${updatedUser.id_document_url ? 'present' : 'missing'}`,
    }
  }

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
