interface AdminStatCardProps {
  label: string
  value: number | string
  href?: string
}

export default function AdminStatCard({ label, value, href }: AdminStatCardProps) {
  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-orange-500">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
  if (href) {
    return <a href={href} className="block hover:opacity-80 transition-opacity">{inner}</a>
  }
  return inner
}
