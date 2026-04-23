'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CategoryGrid from '@/components/CategoryGrid'

interface SearchCategorySheetProps {
  locale: string
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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

export default function SearchCategorySheet({
  locale,
}: SearchCategorySheetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  function handleNavigate(id: string) {
    router.push(`/${locale}/explore?category=${id}`)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative">
        <SearchIcon />
        <input
          type="search"
          onFocus={() => setIsOpen(true)}
          placeholder="What do you need help with?"
          readOnly
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
        />
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl pb-safe transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <p className="px-4 pb-2 text-sm font-semibold text-gray-700">
          Browse Services
        </p>
        <CategoryGrid locale={locale} onNavigate={handleNavigate} />
      </div>
    </>
  )
}
