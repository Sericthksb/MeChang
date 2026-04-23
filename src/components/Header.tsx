import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NavDrawer from '@/components/NavDrawer'

interface HeaderProps {
  locale: string
}

export default async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: 'nav' })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const actionHref = user ? `/${locale}/profile` : `/${locale}/login`
  const actionLabel = user ? t('profile') : t('login')

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavDrawer locale={locale} isLoggedIn={!!user} />

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            href={actionHref}
            className={
              user
                ? 'rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
                : 'bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium'
            }
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}
