import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTableControls from '@/components/admin/AdminTableControls'
import { deleteReview } from './actions'

interface ReviewsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ rating?: string; page?: string }>
}

function parsePage(v: string | undefined) {
  const n = parseInt(v ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

export default async function AdminReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const { locale } = await params
  const { rating, page } = await searchParams
  const currentPage = parsePage(page)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize
  const supabase = createServiceClient()

  let query = supabase
    .from('reviews')
    .select('id, rating, body, created_at, reviewer_id, reviewee_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (rating) query = query.eq('rating', parseInt(rating, 10))

  const { data, count, error } = await query
  const reviews = error ? [] : (data ?? [])

  const allUserIds = [...new Set([
    ...reviews.map((r) => r.reviewer_id),
    ...reviews.map((r) => r.reviewee_id),
  ])]

  const { data: usersData } = allUserIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', allUserIds)
    : { data: [] }

  const userMap = new Map((usersData ?? []).map((u) => [u.id, u.full_name]))
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[{ label: 'Admin', href: `/${locale}/admin/dashboard` }, { label: 'Reviews' }]}
        title="Reviews"
        subtitle={`${count ?? 0} total`}
      />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <AdminTableControls
            filters={[{
              key: 'rating',
              label: 'All Ratings',
              options: [1,2,3,4,5].map((n) => ({ label: `${n} star${n > 1 ? 's' : ''}`, value: String(n) })),
            }]}
          />
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Reviewer</th>
              <th className="px-6 py-3 text-left font-medium">Provider</th>
              <th className="px-6 py-3 text-left font-medium">Rating</th>
              <th className="px-6 py-3 text-left font-medium">Comment</th>
              <th className="px-6 py-3 text-left font-medium">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reviews.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No reviews found.</td></tr>
            ) : reviews.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700">{userMap.get(r.reviewer_id) ?? '—'}</td>
                <td className="px-6 py-4 text-gray-700">{userMap.get(r.reviewee_id) ?? '—'}</td>
                <td className="px-6 py-4">{'⭐'.repeat(r.rating)}</td>
                <td className="px-6 py-4 max-w-xs truncate text-gray-500">{r.body ?? '—'}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <form action={async () => { 'use server'; await deleteReview(r.id, r.reviewee_id) }}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <a href={`/${locale}/admin/reviews?page=${currentPage - 1}${rating ? `&rating=${rating}` : ''}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">← Prev</a>
            )}
            {currentPage < totalPages && (
              <a href={`/${locale}/admin/reviews?page=${currentPage + 1}${rating ? `&rating=${rating}` : ''}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50">Next →</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
