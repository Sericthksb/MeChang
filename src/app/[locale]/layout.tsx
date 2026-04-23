import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { routing } from '@/i18n/routing'
import '../globals.css'

function hasLocale(
  locales: readonly string[],
  locale: string
): locale is (typeof routing.locales)[number] {
  return locales.includes(locale)
}

export const metadata: Metadata = {
  title: 'MeChang - Find Services in Phuket',
  description: 'Discover trusted local service providers in Phuket, Thailand.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <html lang={locale} className="overflow-x-hidden">
      <body className="min-h-screen bg-gray-50 overflow-x-hidden max-w-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header locale={locale} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
