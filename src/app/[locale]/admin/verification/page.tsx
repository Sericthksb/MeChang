export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import type { Certification, ProviderProfile, User } from '@/types/database'
import VerificationQueues from './VerificationQueues'
import type { VerificationCertItem, VerificationIdItem } from './types'

interface VerificationPageProps {
  params: Promise<{ locale: string }>
}

interface VerificationProvider extends Pick<ProviderProfile, 'id' | 'user_id'> {}
interface VerificationUser extends Pick<User, 'id' | 'full_name'> {}

const SIGNED_URL_EXPIRY = 60 * 60 // 1 hour

export default async function AdminVerificationPage({ params }: VerificationPageProps) {
  const { locale } = await params
  const supabase = createServiceClient()

  // Fetch pending ID queue
  const { data: idQueueData } = await supabase
    .from('users')
    .select('id, full_name, id_document_url')
    .not('id_document_url', 'is', null)
    .eq('id_verified', false)
    .order('created_at', { ascending: false })

  // Generate signed URLs for ID documents
  const idQueue: VerificationIdItem[] = await Promise.all(
    (idQueueData ?? []).map(async (u) => {
      if (!u.id_document_url) return { ...u, signedUrl: null }
      const { data } = await supabase.storage
        .from('id-documents')
        .createSignedUrl(u.id_document_url, SIGNED_URL_EXPIRY)
      return { ...u, signedUrl: data?.signedUrl ?? null }
    })
  )

  // Fetch pending certifications
  const { data: pendingCertsData, error: pendingCertsError } = await supabase
    .from('certifications')
    .select('id, provider_id, title, document_url')
    .eq('status', 'pending')
    .order('issued_date', { ascending: false, nullsFirst: false })

  const rawCerts = pendingCertsError ? [] : (pendingCertsData ?? [])

  // Generate signed URLs for cert documents
  const pendingCertsWithUrls = await Promise.all(
    rawCerts.map(async (c) => {
      if (!c.document_url) return { ...c, signedUrl: null }
      const { data } = await supabase.storage
        .from('certifications')
        .createSignedUrl(c.document_url, SIGNED_URL_EXPIRY)
      return { ...c, signedUrl: data?.signedUrl ?? null }
    })
  )

  const providerIds = pendingCertsWithUrls.map((cert) => cert.provider_id)

  const { data: providerRows } =
    providerIds.length > 0
      ? await supabase.from('provider_profiles').select('id, user_id').in('id', providerIds)
      : { data: [] as VerificationProvider[] }

  const verificationProviders = (providerRows ?? []) as VerificationProvider[]
  const providerUserIds = verificationProviders.map((p) => p.user_id)

  const { data: providerUsers } =
    providerUserIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', providerUserIds)
      : { data: [] as VerificationUser[] }

  const providerMap = new Map<string, VerificationProvider>(
    verificationProviders.map((p) => [p.id, p])
  )
  const providerUserMap = new Map<string, VerificationUser>(
    ((providerUsers ?? []) as VerificationUser[]).map((u) => [u.id, u])
  )

  const pendingCerts: VerificationCertItem[] = pendingCertsWithUrls.map((cert) => {
    const provider = providerMap.get(cert.provider_id)
    const providerUser = provider ? providerUserMap.get(provider.user_id) : null

    return {
      ...cert,
      providerName: providerUser?.full_name ?? 'Unknown provider',
    }
  })

  return (
    <VerificationQueues
      locale={locale}
      initialIdQueue={idQueue}
      initialPendingCerts={pendingCerts}
    />
  )
}
