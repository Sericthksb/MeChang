import { deleteReview } from './actions'
import { createServiceClient } from '@/lib/supabase/service'
import type { Review, User } from '@/types/database'

interface ReviewRow
  extends Pick<
    Review,
    'id' | 'reviewee_id' | 'reviewer_id' | 'rating' | 'body' | 'created_at'
  > {}

interface ReviewUser extends Pick<User, 'id' | 'full_name'> {}

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function renderStars(rating: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))))
}

export default async function AdminReviewsPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, reviewee_id, reviewer_id, rating, body, created_at')
    .order('created_at', { ascending: false })

  const reviews = ((data ?? []) as ReviewRow[]).filter(
    (review) => review.reviewee_id && review.reviewer_id
  )
  const userIds = Array.from(
    new Set(
      reviews.flatMap((review) => [review.reviewee_id, review.reviewer_id])
    )
  )

  const { data: usersData } =
    userIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', userIds)
      : { data: [] as ReviewUser[] }

  const userMap = new Map<string, ReviewUser>(
    ((usersData ?? []) as ReviewUser[]).map((user) => [user.id, user])
  )

  return (
    <main>
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
          <p className="text-sm text-gray-500">
            Remove inappropriate reviews and keep provider ratings accurate.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Provider</th>
                <th className="px-3 py-3 font-medium">Reviewer</th>
                <th className="px-3 py-3 font-medium">Rating</th>
                <th className="px-3 py-3 font-medium">Comment</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Delete</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-100">
                    <td className="px-3 py-4 font-medium text-gray-900">
                      {userMap.get(review.reviewee_id)?.full_name ??
                        'Unknown provider'}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {userMap.get(review.reviewer_id)?.full_name ??
                        'Anonymous'}
                    </td>
                    <td className="px-3 py-4 text-amber-500">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {review.body ?? '—'}
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      {formatReviewDate(review.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      <form
                        action={async () => {
                          'use server'
                          await deleteReview(review.id, review.reviewee_id)
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
