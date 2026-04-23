'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

function revalidateVerification() {
  revalidatePath('/en/admin/verification')
  revalidatePath('/th/admin/verification')
}

export async function approveId(
  userId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ id_verified: true })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidateVerification()
}

export async function rejectId(
  userId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ id_verified: false, id_document_url: null })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidateVerification()
}

export async function approveCert(
  certId: string,
  providerId: string,
  adminUserId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const reviewedAt = new Date().toISOString()

  const { error: certError } = await supabase
    .from('certifications')
    .update({
      status: 'approved',
      verified: true,
      reviewed_at: reviewedAt,
      reviewed_by: adminUserId,
    })
    .eq('id', certId)

  if (certError) {
    return { error: certError.message }
  }

  const { error: profileError } = await supabase
    .from('provider_profiles')
    .update({ is_certified: true })
    .eq('id', providerId)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidateVerification()
}

export async function rejectCert(
  certId: string,
  adminUserId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('certifications')
    .update({
      status: 'rejected',
      verified: false,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
    })
    .eq('id', certId)

  if (error) {
    return { error: error.message }
  }

  revalidateVerification()
}
