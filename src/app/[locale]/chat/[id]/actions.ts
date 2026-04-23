'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Chat } from '@/types/database'

type MessageType = 'text' | 'image' | 'video' | 'file' | 'location'

interface ProviderJobsRow {
  id: string
  jobs_done: number
}

export async function sendMessage(
  chatId: string,
  body: string | null,
  type: MessageType,
  attachmentUrl: string | null,
  metadata: Record<string, unknown> | null
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (chatError || !chatData) {
    return { error: 'Unauthorized' }
  }

  const chat = chatData as Chat
  const isParticipant =
    chat.customer_id === user.id || chat.provider_id === user.id

  if (!isParticipant) {
    return { error: 'Unauthorized' }
  }

  if (!chat.lead_fee_charged && chat.customer_id === user.id) {
    const { error: feeError } = await supabase
      .from('chats')
      .update({ lead_fee_charged: true })
      .eq('id', chatId)

    if (feeError) {
      return { error: feeError.message }
    }
  }

  const trimmedBody = body?.trim() ?? null
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: user.id,
    body: trimmedBody,
    type,
    attachment_url: attachmentUrl,
    metadata,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/en/chat')
  revalidatePath('/th/chat')
  revalidatePath(`/en/chat/${chatId}`)
  revalidatePath(`/th/chat/${chatId}`)
}

export async function markComplete(
  chatId: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (chatError || !chatData) {
    return { error: 'Only the provider can mark complete' }
  }

  const chat = chatData as Chat

  if (chat.provider_id !== user.id) {
    return { error: 'Only the provider can mark complete' }
  }

  const completedAt = new Date().toISOString()
  const { error: updateChatError } = await supabase
    .from('chats')
    .update({ status: 'completed', completed_at: completedAt })
    .eq('id', chatId)

  if (updateChatError) {
    return { error: updateChatError.message }
  }

  const { data: providerProfileData, error: providerProfileError } =
    await supabase
      .from('provider_profiles')
      .select('id, jobs_done')
      .eq('user_id', user.id)
      .single()

  if (providerProfileError || !providerProfileData) {
    return {
      error: providerProfileError?.message ?? 'Provider profile not found',
    }
  }

  const providerProfile = providerProfileData as ProviderJobsRow
  const { error: updateProfileError } = await supabase
    .from('provider_profiles')
    .update({ jobs_done: providerProfile.jobs_done + 1 })
    .eq('id', providerProfile.id)

  if (updateProfileError) {
    return { error: updateProfileError.message }
  }

  revalidatePath('/en/chat')
  revalidatePath('/th/chat')
  revalidatePath(`/en/chat/${chatId}`)
  revalidatePath(`/th/chat/${chatId}`)
}

export async function submitReview(
  chatId: string,
  revieweeId: string,
  rating: number,
  body: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const trimmedBody = body.trim()
  const { error: insertError } = await supabase.from('reviews').insert({
    chat_id: chatId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating,
    body: trimmedBody || null,
    is_auto_confirmed: false,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId)

  if (reviewsError) {
    return { error: reviewsError.message }
  }

  const ratings = (reviewsData ?? []).map((review) => review.rating)
  const count = ratings.length
  const average =
    count === 0
      ? 0
      : ratings.reduce((sum, current) => sum + current, 0) / count

  const { error: updateError } = await supabase
    .from('provider_profiles')
    .update({
      avg_rating: Number(average.toFixed(2)),
      total_reviews: count,
    })
    .eq('user_id', revieweeId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/en/chat')
  revalidatePath('/th/chat')
  revalidatePath(`/en/chat/${chatId}`)
  revalidatePath(`/th/chat/${chatId}`)
}
