import { createServiceClient } from '@/lib/supabase/service'

export async function getPendingVerificationCounts() {
  const supabase = createServiceClient()

  const [{ count: pendingIds, error: pendingIdsError }, { count: pendingCerts, error: pendingCertsError }] =
    await Promise.all([
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .not('id_document_url', 'is', null)
        .eq('id_verified', false),
      supabase
        .from('certifications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

  return {
    pendingIds: pendingIdsError ? 0 : (pendingIds ?? 0),
    pendingCerts: pendingCertsError ? 0 : (pendingCerts ?? 0),
  }
}
