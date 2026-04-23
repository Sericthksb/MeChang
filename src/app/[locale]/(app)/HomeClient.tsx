'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import SearchCategorySheet from '@/components/SearchCategorySheet'
import type { ProviderProfile, User } from '@/types/database'

const BROWSE_FILTERS = [
  'All',
  'Top Rated',
  'Verified',
  'Fast Response',
] as const

const HOT_SERVICES = [
  { label: 'AC Repair & Service', category: 'Repair', from: 500 },
  { label: 'House Deep Cleaning', category: 'Cleaning', from: 800 },
  { label: 'Website Design', category: 'IT', from: 1500 },
  { label: 'Errand Runner', category: 'Personal', from: 300 },
] as const

const MOCK_PROMOS = [
  {
    id: 'newYear',
    gradient: 'from-amber-100 to-orange-100',
    border: 'border-orange-200',
    titleColor: 'text-orange-900',
    descColor: 'text-orange-800',
    href: '/promotions/new-year-refresh',
  },
  {
    id: 'festival',
    gradient: 'from-pink-100 to-rose-100',
    border: 'border-rose-200',
    titleColor: 'text-rose-900',
    descColor: 'text-rose-800',
    href: '/promotions/festival-childcare',
  },
  {
    id: 'moving',
    gradient: 'from-blue-100 to-indigo-100',
    border: 'border-indigo-200',
    titleColor: 'text-indigo-900',
    descColor: 'text-indigo-800',
    href: '/promotions/moving-day',
  },
  {
    id: 'rainy',
    gradient: 'from-emerald-100 to-teal-100',
    border: 'border-teal-200',
    titleColor: 'text-teal-900',
    descColor: 'text-teal-800',
    href: '/promotions/rainy-season',
  },
] as const

export interface ProviderProfileWithUser extends ProviderProfile {
  users: User | null
}

interface HomeClientProps {
  locale: string
  providers: ProviderProfileWithUser[]
  featuredProviders: ProviderProfileWithUser[]
}

function getProviderName(provider: ProviderProfileWithUser) {
  return provider.users?.full_name ?? 'Unnamed Provider'
}

function getProviderCategory(provider: ProviderProfileWithUser) {
  return provider.categories[0] ?? 'General Service'
}

function getFilteredProviders(
  providers: ProviderProfileWithUser[],
  activeFilter: (typeof BROWSE_FILTERS)[number]
) {
  switch (activeFilter) {
    case 'Top Rated':
      return [...providers].sort((a, b) => b.avg_rating - a.avg_rating)
    case 'Verified':
      return providers.filter((provider) => provider.users?.id_verified === true)
    case 'Fast Response':
      return providers.filter((provider) => provider.avg_response_hours <= 4)
    case 'All':
    default:
      return providers
  }
}

export default function HomeClient({
  locale,
  providers,
  featuredProviders,
}: HomeClientProps) {
  const t = useTranslations('promos')
  const [activeFilter, setActiveFilter] =
    useState<(typeof BROWSE_FILTERS)[number]>('All')

  const filteredProviders = getFilteredProviders(providers, activeFilter)

  return (
    <>
      {/* Search bar */}
      <section className="px-4 pt-4 pb-3">
        <SearchCategorySheet locale={locale} />
      </section>

      {/* Seasonal Campaigns */}
      <section className="pb-4 pt-1">
        <div className="overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-4 pb-2">
            {MOCK_PROMOS.map((promo) => (
              <Link
                key={promo.id}
                href={`/${locale}${promo.href}`}
                className={`group relative h-56 w-[19rem] shrink-0 overflow-hidden rounded-[2rem] border ${promo.border} bg-gradient-to-br ${promo.gradient} p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1`}
              >
                <div className="absolute inset-x-4 top-4 flex items-start justify-between">
                  <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-600 backdrop-blur-sm">
                    MeChang Picks
                  </div>
                  <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-gray-700 backdrop-blur-sm">
                    Preview
                  </div>
                </div>

                <div className="absolute left-8 top-16 h-24 w-40 rotate-[-11deg] rounded-[1.75rem] border border-white/60 bg-white/55 shadow-[0_20px_40px_rgba(255,255,255,0.25)] backdrop-blur-sm transition-transform duration-200 group-hover:rotate-[-13deg]" />
                <div className="absolute left-16 top-20 h-28 w-44 rotate-[7deg] rounded-[1.75rem] border border-white/70 bg-white/65 shadow-[0_28px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-transform duration-200 group-hover:translate-y-1" />
                <div className="absolute inset-x-10 bottom-16 h-24 rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white/95 to-white/70 shadow-[0_20px_50px_rgba(15,23,42,0.18)]" />

                <div className="absolute inset-x-6 bottom-6">
                  <div className="rounded-[1.75rem] bg-white/72 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
                    <h3 className={`text-base font-semibold ${promo.titleColor}`}>
                      {t(`campaigns.${promo.id}.title`)}
                    </h3>
                    <p className={`mt-1 text-xs leading-relaxed ${promo.descColor}`}>
                      {t(`campaigns.${promo.id}.desc`)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProviders.length > 0 ? (
        <>
          <h2 className="px-4 pt-2 pb-2 text-base font-bold text-gray-900">
            Featured Providers
          </h2>
          <div className="overflow-x-auto px-4 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3">
              {featuredProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="w-56 shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
                >
                  <div className="relative h-36 w-full bg-gray-100">
                    {provider.users?.avatar_url ? (
                      <Image
                        src={provider.users.avatar_url}
                        alt={getProviderName(provider)}
                        fill
                        sizes="224px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <span className="inline-block rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                      Featured
                    </span>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                      {getProviderName(provider)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {getProviderCategory(provider)}
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      <span aria-hidden="true">★</span>{' '}
                      {provider.avg_rating.toFixed(1)}
                    </p>
                    <Link
                      href={`/${locale}/chat?provider=${provider.id}`}
                      className="mt-3 block rounded-lg bg-orange-500 py-2 text-center text-xs font-medium text-white hover:bg-orange-600"
                    >
                      Chat
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Hot Services */}
      <h2 className="px-4 pt-2 pb-2 text-base font-bold text-gray-900">
        Hot Services
      </h2>
      <div className="overflow-x-auto px-4 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3">
          {HOT_SERVICES.map((service) => (
            <Link
              key={service.label}
              href={`/${locale}/explore`}
              className="w-56 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-36 bg-gradient-to-br from-gray-200 to-gray-300" />
              <div className="p-3">
                <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                  {service.category}
                </span>
                <p className="mt-1 text-sm font-semibold leading-tight text-gray-900">
                  {service.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">from ฿{service.from}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular providers */}
      <h2 className="px-4 pt-2 pb-2 text-base font-bold text-gray-900">
        Popular providers
      </h2>

      <div className="overflow-x-auto pl-4 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pb-1">
          {BROWSE_FILTERS.map((filter) => {
            const isActive = filter === activeFilter
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={
                  isActive
                    ? 'rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600'
                }
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500">No providers found</p>
      ) : (
        <div className="overflow-x-auto py-2 pl-4 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-3">
            {filteredProviders.map((provider) => (
              <article
                key={provider.id}
                className="w-40 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="relative h-24 w-full bg-gray-100">
                  {provider.users?.avatar_url ? (
                    <Image
                      src={provider.users.avatar_url}
                      alt={getProviderName(provider)}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {getProviderName(provider)}
                  </p>
                  <p className="mb-1 truncate text-xs text-gray-500">
                    {getProviderCategory(provider)}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span aria-hidden="true">★</span>{' '}
                    {provider.avg_rating.toFixed(1)}
                  </p>
                  <Link
                    href={`/${locale}/chat`}
                    className="mt-2 block rounded-lg bg-orange-500 py-1.5 text-center text-xs font-medium text-white hover:bg-orange-600"
                  >
                    Chat
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
