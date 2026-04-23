import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Chat, Review, User, UserRole } from '@/types/database'

interface ChatWithParties extends Chat {
  customer: User | null
  provider: User | null
}

function AvatarPlaceholder() {
  return <div className="h-12 w-12 rounded-full bg-gray-200" />
}

function formatChatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

export default async function ChatListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ provider?: string; skip?: string }>
}) {
  const { locale } = await params
  const { provider: providerId, skip } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login?redirect=/chat`)
  }

  const { data: currentUserRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isProvider = (currentUserRow?.role as UserRole | undefined) === 'provider'

  if (providerId && !isProvider) {
    const { data: providerProfile } = await supabase
      .from('provider_profiles')
      .select('user_id')
      .eq('id', providerId)
      .single()

    const providerUserId = providerProfile?.user_id

    if (providerUserId) {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('customer_id', user.id)
        .eq('provider_id', providerUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingChat) {
        redirect(`/${locale}/chat/${existingChat.id}`)
      }

      if (skip !== '1') {
        const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
        const { data: completedChatsData } = await supabase
          .from('chats')
          .select('id')
          .eq('customer_id', user.id)
          .eq('status', 'completed')
          .lt('completed_at', cutoff)

        const completedChats = completedChatsData ?? []
        const completedChatIds = completedChats.map((chat) => chat.id)
        let reviews: Pick<Review, 'chat_id'>[] = []

        if (completedChatIds.length > 0) {
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('chat_id')
            .eq('reviewer_id', user.id)
            .in('chat_id', completedChatIds)

          reviews = (reviewsData ?? []) as Pick<Review, 'chat_id'>[]
        }

        const unreviewedCount = completedChats.length - reviews.length

        if (unreviewedCount >= 2) {
          return (
            <main className="pb-6">
              <h1 className="text-xl font-bold text-gray-900 px-4 pt-8">
                Review your completed sessions
              </h1>
              <p className="text-sm text-gray-500 px-4 mt-2">
                Share your experience before starting a new conversation.
              </p>
              <Link
                href={`/${locale}/chat?provider=${providerId}&skip=1`}
                className="px-4 mt-6 block text-sm text-gray-400 underline"
              >
                Skip for now →
              </Link>
              <Link
                href={`/${locale}/explore`}
                className="px-4 mt-2 block text-sm text-orange-500 underline"
              >
                Back to browse
              </Link>
            </main>
          )
        }
      }

      const { data: newChat } = await supabase
        .from('chats')
        .insert({ customer_id: user.id, provider_id: providerUserId })
        .select('id')
        .single()

      if (newChat) {
        redirect(`/${locale}/chat/${newChat.id}`)
      }
    }
  }

  const { data, error } = await supabase
    .from('chats')
    .select(
      '*, customer:users!chats_customer_id_fkey(*), provider:users!chats_provider_id_fkey(*)'
    )
    .eq(isProvider ? 'provider_id' : 'customer_id', user.id)
    .order('created_at', { ascending: false })

  const chats: ChatWithParties[] = error ? [] : ((data ?? []) as ChatWithParties[])

  return (
    <main className="pb-6">
      <h1 className="text-2xl font-bold text-gray-900 px-4 pt-6 pb-2">
        Messages
      </h1>

      {chats.length === 0 ? (
        <div className="px-4 pt-4">
          <p className="text-gray-500">No conversations yet.</p>
          <Link
            href={`/${locale}/explore`}
            className="text-orange-500 underline"
          >
            Browse providers
          </Link>
        </div>
      ) : (
        <div className="pt-2">
          {chats.map((chat) => {
            const otherParty = isProvider ? chat.customer : chat.provider

            return (
              <Link
                key={chat.id}
                href={`/${locale}/chat/${chat.id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50"
              >
                <AvatarPlaceholder />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {otherParty?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatChatDate(chat.created_at)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
