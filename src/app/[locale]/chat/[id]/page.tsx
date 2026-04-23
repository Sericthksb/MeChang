import { notFound, redirect } from 'next/navigation'
import ChatClient from './ChatClient'
import { createClient } from '@/lib/supabase/server'
import type { Chat, Message, Review, User } from '@/types/database'

type ChatFull = Chat & { customer: User | null; provider: User | null }
type MessageWithSender = Message & {
  sender: { full_name: string | null } | null
}

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id: chatId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login?redirect=/chat/${chatId}`)
  }

  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select(
      '*, customer:users!chats_customer_id_fkey(*), provider:users!chats_provider_id_fkey(*)'
    )
    .eq('id', chatId)
    .single()

  if (chatError || !chatData) {
    notFound()
  }

  const chat = chatData as ChatFull

  if (chat.customer_id !== user.id && chat.provider_id !== user.id) {
    redirect(`/${locale}/chat`)
  }

  const isProvider = chat.provider_id === user.id

  const { data: messagesData } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(full_name)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(50)

  const initialMessages = (messagesData ?? []) as MessageWithSender[]

  let existingReview: Review | null = null

  if (!isProvider && chat.status === 'completed') {
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .eq('chat_id', chatId)
      .eq('reviewer_id', user.id)
      .single()

    existingReview = (reviewData ?? null) as Review | null
  }

  return (
    <ChatClient
      locale={locale}
      chatId={chatId}
      currentUserId={user.id}
      chat={chat}
      initialMessages={initialMessages}
      isProvider={isProvider}
      existingReview={existingReview}
    />
  )
}
