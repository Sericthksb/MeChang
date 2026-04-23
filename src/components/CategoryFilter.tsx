'use client'

export interface CategoryFilterProps {
  categories: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

export default function CategoryFilter({
  categories,
  activeId,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => {
        const isActive = category.id === activeId

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={
              isActive
                ? 'flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm'
                : 'flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:border-orange-300'
            }
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
