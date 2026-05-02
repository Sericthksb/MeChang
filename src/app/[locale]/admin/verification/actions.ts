'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

function revalidateVerification() {
  revalidatePath('/en/admin/verification')
  revalidatePath('/th/admin/verification')
}

export async function approveId(userId: string, _formData: FormData): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('users').update({ id_verified: true }).eq('id', userId)
  revalidateVerification()
}

export async function rejectId(userId: string, _formData: FormData): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('users')
    .update({ id_verified: false, id_document_url: null })
    .eq('id', userId)
  revalidateVerification()
}

export async function approveCert(
  certId: string,
  providerId: string,
  adminUserId: string,
  _formData: FormData
): Promise<void> {
  const supabase = createServiceClient()
  const reviewedAt = new Date().toISOString()

  await supabase
    .from('certifications')
    .update({
      status: 'approved',
      verified: true,
      reviewed_at: reviewedAt,
      ...(adminUserId ? { reviewed_by: adminUserId } : {}),
    })
    .eq('id', certId)

  await supabase.from('provider_profiles').update({ is_certified: true }).eq('id', providerId)

  revalidateVerification()
}

export async function rejectCert(
  certId: string,
  adminUserId: string,
  _formData: FormData
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('certifications')
    .update({
      status: 'rejected',
      verified: false,
      reviewed_at: new Date().toISOString(),
      ...(adminUserId ? { reviewed_by: adminUserId } : {}),
    })
    .eq('id', certId)

  revalidateVerification()
}
