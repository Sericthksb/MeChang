'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdminSidebarProps {
  locale: string
  pendingVerifications: number
  adminName: string | null
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: 'dashboard', label: 'Dashboard', emoji: '📊' }],
  },
  {
    label: 'People',
    items: [
      { href: 'users', label: 'Users', emoji: '👥' },
      { href: 'providers', label: 'Providers', emoji: '🏪' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: 'categories', label: 'Categories', emoji: '📂' },
      { href: 'reviews', label: 'Reviews', emoji: '⭐' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: 'verification', label: 'Verification', emoji: '✅', badge: true },
      { href: 'chats', label: 'Chats', emoji: '💬' },
      { href: 'subscriptions', label: 'Subscriptions', emoji: '💳' },
    ],
  },
] as const

export default function AdminSidebar({
  locale,
  pendingVerifications,
  adminName,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
  }

  function isActive(section: string) {
    return pathname.includes(`/admin/${section}`)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-slate-800 text-sm">
      <div className="border-b border-slate-700 px-5 py-5">
        <p className="text-base font-bold text-orange-500">MeChang</p>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={`/${locale}/admin/${item.href}`}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {'badge' in item && item.badge && pendingVerifications > 0 ? (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {pendingVerifications}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}

        <div className="mb-2 border-t border-slate-700 pt-4">
          <Link
            href={`/${locale}/admin/settings`}
            className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium transition-colors ${
              isActive('settings')
                ? 'bg-orange-500 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-slate-700 px-5 py-4">
        <p className="truncate text-xs font-medium text-slate-300">
          {adminName ?? 'Admin'}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 text-xs text-slate-500 hover:text-slate-300"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
