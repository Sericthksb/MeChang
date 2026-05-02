import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableControls from '@/components/admin/AdminTableControls'
import type { User } from '@/types/database'

interface UsersPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}

function parsePage(v: string | undefined) {
  const n = parseInt(v ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: UsersPageProps) {
  const { locale } = await params
  const { q, role, page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  let query = supabase
    .from('users')
    .select('id, full_name, phone, role, is_banned, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (q) query = query.ilike('full_name', `%${q}%`)
  if (role) query = query.eq('role', role)

  const { data, count, error } = await query
  const users: Pick<
    User,
    'id' | 'full_name' | 'phone' | 'role' | 'is_banned' | 'created_at'
  >[] = error ? [] : (data ?? [])

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Users' },
        ]}
        title="Users"
        subtitle={`${count ?? 0} total`}
      />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <AdminTableControls
            searchPlaceholder="Search by name…"
            filters={[
              {
                key: 'role',
                label: 'All Roles',
                options: [
                  { label: 'Customer', value: 'customer' },
                  { label: 'Provider', value: 'provider' },
                  { label: 'Admin', value: 'admin' },
                ],
              },
            ]}
          />
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Phone</th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Joined</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.phone ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge variant={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge
                      variant={user.is_banned ? 'banned' : 'active'}
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/${locale}/admin/users/${user.id}`}
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
                href={`/${locale}/admin/users?page=${currentPage - 1}${
                  q ? `&q=${q}` : ''
                }${role ? `&role=${role}` : ''}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`/${locale}/admin/users?page=${currentPage + 1}${
                  q ? `&q=${q}` : ''
                }${role ? `&role=${role}` : ''}`}
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
