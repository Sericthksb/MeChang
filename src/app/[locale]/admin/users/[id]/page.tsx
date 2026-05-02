import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { deleteUser, toggleBanUser, updateUserRole } from '../actions'
import type { UserRole } from '@/types/database'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, phone, email, role, is_banned, id_verified, created_at')
    .eq('id', id)
    .single()

  if (!user) notFound()

  const { data: providerProfile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', id)
    .maybeSingle()

  const { data: chats } = await supabase
    .from('chats')
    .select('id, status, created_at')
    .or(`customer_id.eq.${id},provider_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(5)

  const roles: UserRole[] = ['customer', 'provider', 'admin']

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Users', href: `/${locale}/admin/users` },
          { label: user.full_name ?? 'User' },
        ]}
        title={user.full_name ?? 'Unnamed User'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user.full_name ?? '—'}
                  </h2>
                  <div className="mt-1 flex gap-2">
                    <AdminBadge variant={user.role} />
                    <AdminBadge
                      variant={user.is_banned ? 'banned' : 'active'}
                    />
                    {user.id_verified ? (
                      <AdminBadge variant="approved" label="ID Verified" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-400">Phone</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {user.phone ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Email</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {user.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Joined</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
              {providerProfile ? (
                <div>
                  <dt className="text-gray-400">Provider profile</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/${locale}/admin/providers/${providerProfile.id}`}
                      className="text-orange-500 hover:underline"
                    >
                      View profile →
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Change Role
            </h3>
            <div className="flex gap-2">
              {roles.map((role) => (
                <form
                  key={role}
                  action={async () => {
                    'use server'
                    await updateUserRole(id, role)
                  }}
                >
                  <button
                    type="submit"
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      user.role === role
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-red-600">
              Danger Zone
            </h3>
            <div className="flex gap-3">
              <form
                action={async () => {
                  'use server'
                  await toggleBanUser(id, !user.is_banned)
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {user.is_banned ? 'Unban User' : 'Ban User'}
                </button>
              </form>
              <form
                action={async () => {
                  'use server'
                  await deleteUser(id)
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete Account
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Recent Chats
          </h3>
          {!chats || chats.length === 0 ? (
            <p className="text-sm text-gray-400">No chats yet.</p>
          ) : (
            <ul className="space-y-3">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/${locale}/admin/chats/${chat.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-700">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </span>
                    <AdminBadge
                      variant={chat.status === 'active' ? 'active' : 'inactive'}
                      label={chat.status}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
