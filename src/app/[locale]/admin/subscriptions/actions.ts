'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { SubscriptionTier } from '@/types/database'

export async function changeSubscriptionTier(
  profileId: string,
  tier: SubscriptionTier
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('provider_profiles')
    .update({ subscription_tier: tier })
    .eq('id', profileId)
  if (error) return { error: error.message }
  revalidatePath('/en/admin/subscriptions')
  revalidatePath('/th/admin/subscriptions')
}
