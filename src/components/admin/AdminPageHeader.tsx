interface Crumb { label: string; href?: string }

interface AdminPageHeaderProps {
  breadcrumbs: Crumb[]
  title: string
  subtitle?: string
}

export default function AdminPageHeader({ breadcrumbs, title, subtitle }: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            {crumb.href
              ? <a href={crumb.href} className="hover:text-gray-600">{crumb.label}</a>
              : <span className="text-gray-600">{crumb.label}</span>
            }
          </span>
        ))}
      </nav>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  )
}
