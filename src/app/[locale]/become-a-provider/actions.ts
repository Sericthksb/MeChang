'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface RegistrationData {
  locale: string
  fullName: string
  bio: string
  pricingNote: string
  serviceAreas: string[]
  categories: string[]
  avatarUrl: string | null
  coverUrl: string | null
  idDocumentUrl: string
  certifications: { title: string; documentUrl: string }[]
}

export async function submitRegistration(
  data: RegistrationData
): Promise<{ error: string } | void> {
  const fullName = data.fullName.trim()
  const bio = data.bio.trim()
  const pricingNote = data.pricingNote.trim()
  const serviceAreas = data.serviceAreas.map((area) => area.trim()).filter(Boolean)
  const categories = data.categories.map((category) => category.trim()).filter(Boolean)
  const certifications = data.certifications
    .map((certification) => ({
      title: certification.title.trim(),
      documentUrl: certification.documentUrl.trim(),
    }))
    .filter(
      (certification) =>
        certification.title.length > 0 && certification.documentUrl.length > 0
    )

  if (!fullName) {
    return { error: 'Display name is required' }
  }

  if (bio.length > 500) {
    return { error: 'Bio must be 500 characters or fewer' }
  }

  if (pricingNote.length > 80) {
    return { error: 'Pricing note must be 80 characters or fewer' }
  }

  if (serviceAreas.length === 0) {
    return { error: 'Select at least one service area' }
  }

  if (categories.length === 0) {
    return { error: 'Select at least one category' }
  }

  if (!data.avatarUrl) {
    return { error: 'Avatar upload is required' }
  }

  if (!data.idDocumentUrl.trim()) {
    return { error: 'ID document upload is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (existingUserError || !existingUser) {
    return { error: existingUserError?.message ?? 'User profile not found' }
  }

  if (existingUser.role === 'provider') {
    redirect(`/${data.locale}/profile`)
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      role: 'provider',
      avatar_url: data.avatarUrl,
      id_document_url: data.idDocumentUrl.trim(),
      id_verified: false,
    })
    .eq('id', user.id)

  if (userUpdateError) {
    return { error: userUpdateError.message }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('provider_profiles')
    .insert({
      user_id: user.id,
      bio,
      categories,
      service_areas: serviceAreas,
      pricing_note: pricingNote || null,
      languages: [],
    })
    .select('id')
    .single()

  if (profileError || !profileRow) {
    return { error: profileError?.message ?? 'Failed to create provider profile' }
  }

  if (certifications.length > 0) {
    const { error: certificationError } = await supabase
      .from('certifications')
      .insert(
        certifications.map((certification) => ({
          provider_id: profileRow.id,
          title: certification.title,
          document_url: certification.documentUrl,
          status: 'pending',
          verified: false,
        }))
      )

    if (certificationError) {
      return { error: certificationError.message }
    }
  }

  if (data.coverUrl) {
    const { error: photoError } = await supabase.from('provider_photos').insert({
      provider_id: profileRow.id,
      url: data.coverUrl,
      caption: 'Cover photo',
    })

    if (photoError) {
      return { error: photoError.message }
    }
  }

  redirect(`/${data.locale}/providers/${profileRow.id}`)
}
