'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  key: 'home' | 'explore' | 'chat' | 'profile'
  match: (pathname: string, locale: string) => boolean
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-orange-500' : 'text-gray-400'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-orange-500' : 'text-gray-400'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="m15.5 8.5-2.4 7-4.6-4.6 7-2.4Z" />
    </svg>
  )
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-orange-500' : 'text-gray-400'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v8A1.5 1.5 0 0 1 19 17.5H9l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-orange-500' : 'text-gray-400'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

export default function BottomNav() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('nav')

  const items: NavItem[] = [
    {
      key: 'home',
      href: `/${locale}`,
      match: (currentPath, currentLocale) => currentPath === `/${currentLocale}`,
    },
    {
      key: 'explore',
      href: `/${locale}/explore`,
      match: (currentPath, currentLocale) =>
        currentPath.startsWith(`/${currentLocale}/explore`),
    },
    {
      key: 'chat',
      href: `/${locale}/chat`,
      match: (currentPath, currentLocale) =>
        currentPath.startsWith(`/${currentLocale}/chat`),
    },
    {
      key: 'profile',
      href: `/${locale}/profile`,
      match: (currentPath, currentLocale) =>
        currentPath.startsWith(`/${currentLocale}/profile`),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-2xl grid-cols-4 px-2 py-2">
        {items.map((item) => {
          const active = item.match(pathname, locale)
          const icon =
            item.key === 'home' ? (
              <HomeIcon active={active} />
            ) : item.key === 'explore' ? (
              <CompassIcon active={active} />
            ) : item.key === 'chat' ? (
              <ChatIcon active={active} />
            ) : (
              <ProfileIcon active={active} />
            )

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs font-medium transition-colors"
            >
              {icon}
              <span className={active ? 'text-orange-500' : 'text-gray-500'}>
                {t(item.key)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
