'use client'

import { ChangeEvent } from 'react'

export interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
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

export default function SearchBar({
  placeholder = 'Search',
  onSearch,
}: SearchBarProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onSearch?.(event.target.value)
  }

  return (
    <div className="relative w-full">
      <SearchIcon />
      <input
        type="search"
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  )
}
