'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export async function toggleProviderActive(
  profileId: string,
  isActive: boolean
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('provider_profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/en/admin/providers')
  revalidatePath('/th/admin/providers')
}
