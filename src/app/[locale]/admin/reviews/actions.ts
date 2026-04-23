'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export async function deleteReview(
  reviewId: string,
  revieweeId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  const { data: remainingReviews, error: fetchError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId)

  if (fetchError) {
    return { error: fetchError.message }
  }

  const ratings = (remainingReviews ?? []).map((review) => review.rating)
  const totalReviews = ratings.length
  const avgRating =
    totalReviews === 0
      ? 0
      : ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews

  const { error: updateError } = await supabase
    .from('provider_profiles')
    .update({
      avg_rating: Number(avgRating.toFixed(2)),
      total_reviews: totalReviews,
    })
    .eq('user_id', revieweeId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/en/admin/reviews')
  revalidatePath('/th/admin/reviews')
}
