import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const service = createServiceClient()

  const { data: userRow } = await service
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'admin') redirect(`/${locale}`)

  const { count: pendingVerifications } = await service
    .from('certifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        locale={locale}
        pendingVerifications={pendingVerifications ?? 0}
        adminName={userRow.full_name}
      />
      <main className="ml-56 flex-1 px-8 py-8">{children}</main>
    </div>
  )
}
