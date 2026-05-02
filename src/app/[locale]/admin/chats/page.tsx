import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableControls from '@/components/admin/AdminTableControls'
import type { Chat, User } from '@/types/database'

interface ChatsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; page?: string }>
}

function parsePage(v: string | undefined) {
  const n = parseInt(v ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

export default async function AdminChatsPage({
  params,
  searchParams,
}: ChatsPageProps) {
  const { locale } = await params
  const { status, page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  let query = supabase
    .from('chats')
    .select(
      'id, customer_id, provider_id, status, lead_fee_charged, created_at, completed_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  type ChatRow = Pick<
    Chat,
    | 'id'
    | 'customer_id'
    | 'provider_id'
    | 'status'
    | 'lead_fee_charged'
    | 'created_at'
    | 'completed_at'
  >
  const chats: ChatRow[] = error ? [] : ((data ?? []) as ChatRow[])

  const allUserIds = [
    ...new Set([
      ...chats.map((chat) => chat.customer_id),
      ...chats.map((chat) => chat.provider_id),
    ]),
  ]
  const { data: usersData } =
    allUserIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', allUserIds)
      : { data: [] as Pick<User, 'id' | 'full_name'>[] }

  const userMap = new Map((usersData ?? []).map((user) => [user.id, user.full_name]))
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Chats' },
        ]}
        title="Chats"
        subtitle={`${count ?? 0} total`}
      />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <AdminTableControls
            filters={[
              {
                key: 'status',
                label: 'All Status',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Disputed', value: 'disputed' },
                ],
              },
            ]}
          />
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Customer</th>
              <th className="px-6 py-3 text-left font-medium">Provider</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">
                Lead Charged
              </th>
              <th className="px-6 py-3 text-left font-medium">Started</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {chats.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No chats found.
                </td>
              </tr>
            ) : (
              chats.map((chat) => (
                <tr key={chat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-700">
                    {userMap.get(chat.customer_id) ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {userMap.get(chat.provider_id) ?? '—'}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    {chat.lead_fee_charged ? '✓' : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/${locale}/admin/chats/${chat.id}`}
                      className="text-orange-500 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/${locale}/admin/chats?page=${currentPage - 1}${
                  status ? `&status=${status}` : ''
                }`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`/${locale}/admin/chats?page=${currentPage + 1}${
                  status ? `&status=${status}` : ''
                }`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
