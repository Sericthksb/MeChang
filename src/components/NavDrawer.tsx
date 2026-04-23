'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavDrawerProps {
  locale: string
  isLoggedIn: boolean
}

interface NavLinkItem {
  label: string
  emoji: string
  href: string
  isActive: (pathname: string) => boolean
}

interface ComingSoonItem {
  label: string
  emoji: string
}

const customerLinks = (locale: string): NavLinkItem[] => [
  {
    label: 'Home',
    emoji: '🏠',
    href: `/${locale}/`,
    isActive: (pathname) => pathname === `/${locale}` || pathname === `/${locale}/`,
  },
  {
    label: 'Explore',
    emoji: '🔍',
    href: `/${locale}/explore`,
    isActive: (pathname) => pathname.startsWith(`/${locale}/explore`),
  },
  {
    label: 'Chat',
    emoji: '💬',
    href: `/${locale}/chat`,
    isActive: (pathname) => pathname.startsWith(`/${locale}/chat`),
  },
]

const providerLinks = (locale: string): NavLinkItem[] => [
  {
    label: 'My Jobs',
    emoji: '📋',
    href: `/${locale}/chat`,
    isActive: (pathname) => pathname.startsWith(`/${locale}/chat`),
  },
  {
    label: 'My Profile',
    emoji: '⭐',
    href: `/${locale}/profile`,
    isActive: (pathname) => pathname.startsWith(`/${locale}/profile`),
  },
]

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function NavRow({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLinkItem
  pathname: string
  onNavigate: () => void
}) {
  const isActive = item.isActive(pathname)
  const className = isActive
    ? 'flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50 rounded-xl mx-2 text-orange-500 bg-orange-50'
    : 'flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl mx-2'

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      <span aria-hidden="true">{item.emoji}</span>
      <span>{item.label}</span>
    </Link>
  )
}

function ComingSoonRow({ item }: { item: ComingSoonItem }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl mx-2">
      <span aria-hidden="true">{item.emoji}</span>
      <span>{item.label}</span>
      <span className="text-[10px] font-semibold bg-orange-100 text-orange-500 rounded-full px-2 py-0.5 ml-auto">
        Coming Soon
      </span>
    </div>
  )
}

export default function NavDrawer({ locale, isLoggedIn }: NavDrawerProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const profileHref = isLoggedIn ? `/${locale}/profile` : `/${locale}/login`

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xl font-bold tracking-tight text-orange-500"
      >
        MeChang
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative border-b border-gray-100 px-4 py-5">
          <p className="text-xl font-bold tracking-tight text-orange-500">
            MeChang
          </p>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 py-2">
            CUSTOMER
          </p>
          {customerLinks(locale).map((item) => (
            <NavRow
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
          <ComingSoonRow item={{ label: 'AI Assistant', emoji: '🤖' }} />
          <ComingSoonRow item={{ label: 'Urgent Job', emoji: '🚨' }} />
          <NavRow
            item={{
              label: 'Profile',
              emoji: '👤',
              href: profileHref,
              isActive: (currentPath) =>
                currentPath.startsWith(`/${locale}/profile`) ||
                currentPath.startsWith(`/${locale}/login`),
            }}
            pathname={pathname}
            onNavigate={() => setIsOpen(false)}
          />

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 py-2">
            PROVIDER
          </p>
          {providerLinks(locale).map((item) => (
            <NavRow
              key={item.label}
              item={item}
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
          <ComingSoonRow item={{ label: 'Earnings', emoji: '💰' }} />
        </nav>
      </div>
    </>
  )
}
