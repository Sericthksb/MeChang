'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
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

const CATEGORY_TILES = [
  { label: 'Home',       gradient: 'from-orange-400 to-orange-500', accent: false },
  { label: 'Repair',     gradient: 'from-blue-400 to-blue-600',     accent: false },
  { label: 'IT',         gradient: 'from-indigo-400 to-indigo-600', accent: false },
  { label: 'Cleaning',   gradient: 'from-teal-400 to-teal-500',     accent: false },
  { label: 'Personal',   gradient: 'from-purple-400 to-purple-500', accent: false },
  { label: 'View All →', gradient: 'from-orange-100 to-orange-200', accent: true  },
] as const

interface ProviderProfileWithUser extends ProviderProfile {
  users: User | null
}

interface HomeClientProps {
  locale: string
  providers: ProviderProfileWithUser[]
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
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

export default function HomeClient({ locale, providers }: HomeClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] =
    useState<(typeof BROWSE_FILTERS)[number]>('All')

  const filteredProviders = getFilteredProviders(providers, activeFilter)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push(`/${locale}/explore`)
  }

  return (
    <>
      {/* Search bar */}
      <section className="px-4 pt-4 pb-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you need help with?"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-600"
          >
            <SearchIcon />
          </button>
        </form>
      </section>

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

      {/* Browse by category */}
      <h2 className="mt-4 mb-3 px-4 text-base font-bold text-gray-900">
        Browse by category
      </h2>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.label}
            href={`/${locale}/explore`}
            className="relative aspect-square overflow-hidden rounded-2xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${tile.gradient}`}
            />
            <p
              className={`absolute bottom-0 left-0 p-3 text-sm font-semibold ${
                tile.accent ? 'text-orange-700' : 'text-white'
              }`}
            >
              {tile.label}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
