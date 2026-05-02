import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import type { Message } from '@/types/database'

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = createServiceClient()

  const { data: chat } = await supabase
    .from('chats')
    .select('id, customer_id, provider_id, status, lead_fee_charged, created_at, completed_at')
    .eq('id', id)
    .single()

  if (!chat) notFound()

  const [customerResult, providerResult, messagesResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, phone')
      .eq('id', chat.customer_id)
      .single(),
    supabase
      .from('users')
      .select('id, full_name, phone')
      .eq('id', chat.provider_id)
      .single(),
    supabase
      .from('messages')
      .select('id, sender_id, body, type, attachment_url, created_at')
      .eq('chat_id', id)
      .order('created_at', { ascending: true }),
  ])

  const customer = customerResult.data
  const provider = providerResult.data
  type MessageRow = Pick<
    Message,
    'id' | 'sender_id' | 'body' | 'type' | 'attachment_url' | 'created_at'
  >
  const messages: MessageRow[] = (messagesResult.data ?? []) as MessageRow[]

  const senderMap = new Map<string, string>([
    [chat.customer_id, customer?.full_name ?? 'Customer'],
    [chat.provider_id, provider?.full_name ?? 'Provider'],
  ])

  async function closeChat() {
    'use server'
    const svc = createServiceClient()
    await svc
      .from('chats')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)

    revalidatePath('/en/admin/chats')
    revalidatePath('/th/admin/chats')
    revalidatePath(`/en/admin/chats/${id}`)
    revalidatePath(`/th/admin/chats/${id}`)
  }

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Chats', href: `/${locale}/admin/chats` },
          { label: `Chat #${id.slice(0, 8)}` },
        ]}
        title={`${customer?.full_name ?? 'Customer'} ↔ ${
          provider?.full_name ?? 'Provider'
        }`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4 text-sm text-gray-500">
              Read-only — {messages.length} messages
            </div>
            <div className="max-h-[600px] space-y-4 overflow-y-auto px-6 py-4">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400">No messages.</p>
              ) : (
                messages.map((message) => {
                  const isCustomer = message.sender_id === chat.customer_id

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                          isCustomer
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-orange-500 text-white'
                        }`}
                      >
                        <p className="mb-1 text-[10px] opacity-60">
                          {senderMap.get(message.sender_id) ?? 'Unknown'}
                        </p>
                        {message.type === 'text' ? <p>{message.body}</p> : null}
                        {message.type === 'image' ? <p>[Image]</p> : null}
                        {message.type === 'video' ? <p>[Video]</p> : null}
                        {message.type === 'file' ? <p>[File]</p> : null}
                        {message.type === 'location' ? <p>[Location]</p> : null}
                        <p className="mt-1 text-[10px] opacity-50">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Chat Info
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400">Status</dt>
                <dd className="mt-1">
                  <AdminBadge
                    variant={
                      chat.status === 'active'
                        ? 'active'
                        : chat.status === 'completed'
                          ? 'approved'
                          : 'rejected'
                    }
                    label={chat.status}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Customer</dt>
                <dd className="mt-1 font-medium">
                  {customer?.full_name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Provider</dt>
                <dd className="mt-1 font-medium">
                  {provider?.full_name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Lead charged</dt>
                <dd className="mt-1">{chat.lead_fee_charged ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Started</dt>
                <dd className="mt-1">
                  {new Date(chat.created_at).toLocaleDateString()}
                </dd>
              </div>
              {chat.completed_at ? (
                <div>
                  <dt className="text-gray-400">Completed</dt>
                  <dd className="mt-1">
                    {new Date(chat.completed_at).toLocaleDateString()}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {chat.status === 'active' ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                Actions
              </h3>
              <form action={closeChat}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close Chat
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
