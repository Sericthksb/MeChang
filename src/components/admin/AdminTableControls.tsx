'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface FilterOption {
  label: string
  value: string
}

interface AdminTableControlsProps {
  searchPlaceholder?: string
  filters?: { key: string; label: string; options: FilterOption[] }[]
}

export default function AdminTableControls({
  searchPlaceholder,
  filters,
}: AdminTableControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      params.delete('page')

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchPlaceholder !== undefined ? (
        <input
          type="search"
          defaultValue={searchParams.get('q') ?? ''}
          placeholder={searchPlaceholder}
          onChange={(event) => updateParam('q', event.target.value)}
          className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : null}
      {filters?.map((filter) => (
        <select
          key={filter.key}
          defaultValue={searchParams.get(filter.key) ?? ''}
          onChange={(event) => updateParam(filter.key, event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
