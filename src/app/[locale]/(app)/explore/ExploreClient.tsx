'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import CategoryFilter from '@/components/CategoryFilter'
import ProviderCard from '@/components/ProviderCard'
import SearchBar from '@/components/SearchBar'
import type { ProviderProfile, User } from '@/types/database'

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'home', label: 'Home' },
  { id: 'repair', label: 'Repair' },
  { id: 'it', label: 'IT' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'personal', label: 'Personal' },
] as const

interface ProviderProfileWithUser extends ProviderProfile {
  users: User | null
}

interface ExploreClientProps {
  locale: string
  providers: ProviderProfileWithUser[]
  initialQuery?: string
  initialCategory?: string
}

function matchesCategory(profile: ProviderProfileWithUser, categoryId: string) {
  if (categoryId === 'all') {
    return true
  }

  const haystack = [
    ...profile.categories,
    ...profile.service_areas,
    profile.bio ?? '',
    profile.pricing_note ?? '',
  ]
    .join(' ')
    .toLowerCase()

  switch (categoryId) {
    case 'home':
      return (
        haystack.includes('home') ||
        haystack.includes('electrical') ||
        haystack.includes('electric') ||
        haystack.includes('aircon') ||
        haystack.includes('plumb')
      )
    case 'repair':
      return (
        haystack.includes('repair') ||
        haystack.includes('fix') ||
        haystack.includes('maintenance')
      )
    case 'it':
      return (
        haystack.includes('it') ||
        haystack.includes('tech') ||
        haystack.includes('wifi') ||
        haystack.includes('internet') ||
        haystack.includes('device')
      )
    case 'cleaning':
      return (
        haystack.includes('clean') ||
        haystack.includes('maid') ||
        haystack.includes('pool') ||
        haystack.includes('garden')
      )
    case 'personal':
      return (
        haystack.includes('chef') ||
        haystack.includes('cook') ||
        haystack.includes('nanny') ||
        haystack.includes('care') ||
        haystack.includes('personal')
      )
    default:
      return true
  }
}

function matchesQuery(profile: ProviderProfileWithUser, query: string) {
  if (!query) {
    return true
  }

  const normalizedQuery = query.toLowerCase()
  const haystack = [
    profile.users?.full_name ?? '',
    ...profile.categories,
    profile.bio ?? '',
    profile.pricing_note ?? '',
    ...profile.service_areas,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

function getCategoryLabel(profile: ProviderProfileWithUser) {
  return profile.categories[0] ?? 'General Service'
}

function getPricingLabel(profile: ProviderProfileWithUser) {
  return profile.pricing_note ?? 'Starting from ฿500'
}

export default function ExploreClient({
  locale,
  providers,
  initialQuery = '',
  initialCategory = 'all',
}: ExploreClientProps) {
  const normalizedCategory = (initialCategory || 'all').toLowerCase()
  const resolvedCategory = CATEGORIES.some((c) => c.id === normalizedCategory)
    ? normalizedCategory
    : 'all'

  const [activeCategory, setActiveCategory] = useState(resolvedCategory)
  const [query, setQuery] = useState(initialQuery)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    setActiveCategory(resolvedCategory)
  }, [resolvedCategory])

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const filteredProviders = providers.filter((provider) => {
    return (
      matchesCategory(provider, activeCategory) &&
      matchesQuery(provider, deferredQuery)
    )
  })

  return (
    <div className="pb-6">
      <div className="px-4">
        <SearchBar
          placeholder="What do you need help with?"
          value={query}
          onSearch={setQuery}
        />
      </div>

      <CategoryFilter
        categories={CATEGORIES.map((category) => ({
          id: category.id,
          label: category.label,
        }))}
        activeId={activeCategory}
        onChange={setActiveCategory}
      />

      {filteredProviders.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No providers found</p>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-2">
          {filteredProviders.map((provider) => {
            const isFeatured =
              provider.boost_until !== null &&
              new Date(provider.boost_until) > new Date()
            const subscriptionTier = provider.subscription_tier
            const isVerified = provider.users?.id_verified === true

            return (
              <ProviderCard
                key={provider.id}
                id={provider.id}
                name={provider.users?.full_name ?? 'Unnamed Provider'}
                category={getCategoryLabel(provider)}
                avatarUrl={provider.users?.avatar_url ?? null}
                coverPhotoUrl={null}
                avgRating={provider.avg_rating}
                totalReviews={provider.total_reviews}
                languages={provider.languages}
                pricingNote={getPricingLabel(provider)}
                isFeatured={isFeatured}
                subscriptionTier={subscriptionTier}
                isVerified={isVerified}
                locale={locale}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
