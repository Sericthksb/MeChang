import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

interface AdminUserRow {
  role: 'customer' | 'provider' | 'admin'
}

const tabs = [
  { href: 'providers', label: 'Providers' },
  { href: 'categories', label: 'Categories' },
  { href: 'verification', label: 'Verification' },
  { href: 'reviews', label: 'Reviews' },
]

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}`)
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((userRow as AdminUserRow | null)?.role !== 'admin') {
    redirect(`/${locale}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderate providers, categories, verification, and reviews.
          </p>
        </div>

        <nav className="-mx-1 overflow-x-auto">
          <div className="flex min-w-max gap-2 px-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={`/${locale}/admin/${tab.href}`}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {children}
    </div>
  )
}
