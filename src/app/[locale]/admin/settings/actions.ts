'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

export async function updateSettings(
  _prevState: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const leadFeeSatang = parseInt(formData.get('lead_fee_satang') as string, 10)
  const featuredSlotLimit = parseInt(formData.get('featured_slot_limit') as string, 10)
  const platformActive = formData.get('platform_active') === 'true'

  if (isNaN(leadFeeSatang) || leadFeeSatang < 0) return { error: 'Invalid lead fee amount' }
  if (isNaN(featuredSlotLimit) || featuredSlotLimit < 1) return { error: 'Invalid featured slot limit' }

  const supabase = createServiceClient()
  const { data: existing } = await supabase.from('platform_settings').select('id').limit(1).single()

  const { error } = existing
    ? await supabase
        .from('platform_settings')
        .update({
          lead_fee_satang: leadFeeSatang,
          featured_slot_limit: featuredSlotLimit,
          platform_active: platformActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    : await supabase
        .from('platform_settings')
        .insert({ lead_fee_satang: leadFeeSatang, featured_slot_limit: featuredSlotLimit, platform_active: platformActive })

  if (error) return { error: error.message }
  revalidatePath('/en/admin/settings')
  revalidatePath('/th/admin/settings')
  return { success: true }
}
