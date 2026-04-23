'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function getLocalizedPath(pathname: string, currentLocale: string, nextLocale: string) {
  const segments = pathname.split('/')

  if (segments[1] === currentLocale) {
    segments[1] = nextLocale
    return segments.join('/') || `/${nextLocale}`
  }

  return pathname === '/' ? `/${nextLocale}` : `/${nextLocale}${pathname}`
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchLocale(nextLocale: 'en' | 'th') {
    if (nextLocale === locale) return

    const nextPath = getLocalizedPath(pathname, locale, nextLocale)
    const query = searchParams.toString()

    router.replace(query ? `${nextPath}?${query}` : nextPath)
  }

  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 text-sm font-medium">
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`rounded-lg px-3 py-1.5 transition-colors ${
          locale === 'en'
            ? 'bg-orange-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('th')}
        className={`rounded-lg px-3 py-1.5 transition-colors ${
          locale === 'th'
            ? 'bg-orange-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        ไทย
      </button>
    </div>
  )
}
