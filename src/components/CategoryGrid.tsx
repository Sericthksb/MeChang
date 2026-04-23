'use client'

interface CategoryGridProps {
  locale: string
  activeId?: string
  onSelect?: (id: string) => void
  onNavigate?: (id: string) => void
}

const CATEGORIES = [
  { id: 'home',     emoji: '🏠', label: 'Home & Tech'  },
  { id: 'repair',   emoji: '🔧', label: 'Repair'       },
  { id: 'it',       emoji: '💻', label: 'IT Support'   },
  { id: 'cleaning', emoji: '🧹', label: 'Cleaning'     },
  { id: 'personal', emoji: '👤', label: 'Personal'     },
  { id: 'property', emoji: '🌳', label: 'Property'     },
  { id: 'car',      emoji: '🚗', label: 'Car & Auto'   },
  { id: 'all',      emoji: '🔍', label: 'All Services' },
] as const

export default function CategoryGrid({
  locale,
  activeId,
  onSelect,
  onNavigate,
}: CategoryGridProps) {
  function handleTap(id: string) {
    if (onSelect) {
      onSelect(id)
    } else if (onNavigate) {
      onNavigate(id)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {CATEGORIES.map((category) => {
        const isActive = activeId === category.id
        
        return (
          <div
            key={category.id}
            onClick={() => handleTap(category.id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-4 text-center cursor-pointer transition-transform active:scale-95 ${
              isActive ? 'bg-orange-50 ring-2 ring-orange-400' : 'bg-gray-50'
            }`}
          >
            <span className="text-2xl">{category.emoji}</span>
            <p className="mt-1 text-xs font-medium text-gray-700">
              {category.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
