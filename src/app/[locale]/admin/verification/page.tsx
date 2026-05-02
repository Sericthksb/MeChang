import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { IdActions, CertActions } from './VerificationActions'
import type { Certification, ProviderProfile, User } from '@/types/database'

interface VerificationPageProps {
  params: Promise<{ locale: string }>
}

interface IdQueueUser extends Pick<User, 'id' | 'full_name' | 'id_document_url'> {
  signedUrl: string | null
}

interface PendingCertification extends Pick<Certification, 'id' | 'provider_id' | 'title' | 'document_url'> {
  signedUrl: string | null
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
  const idQueue: IdQueueUser[] = await Promise.all(
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
  const pendingCerts: PendingCertification[] = await Promise.all(
    rawCerts.map(async (c) => {
      if (!c.document_url) return { ...c, signedUrl: null }
      const { data } = await supabase.storage
        .from('certifications')
        .createSignedUrl(c.document_url, SIGNED_URL_EXPIRY)
      return { ...c, signedUrl: data?.signedUrl ?? null }
    })
  )

  const pendingIdCount = idQueue.length
  const pendingCertCount = pendingCerts.length
  const providerIds = pendingCerts.map((cert) => cert.provider_id)

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

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Admin', href: `/${locale}/admin/dashboard` },
          { label: 'Verification' },
        ]}
        title="Verification"
        subtitle={`${pendingIdCount + pendingCertCount} items pending`}
      />

      <div className="space-y-6">
        {/* ID Queue */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ID Queue</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review submitted identity documents before approval.
              </p>
            </div>
            <AdminBadge variant="pending" label={`${pendingIdCount} pending`} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Document</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {idQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                      No pending ID reviews.
                    </td>
                  </tr>
                ) : (
                  idQueue.map((queueUser) => (
                    <tr key={queueUser.id} className="border-b border-gray-100">
                      <td className="px-3 py-4 font-medium text-gray-900">
                        {queueUser.full_name ?? 'Unnamed user'}
                      </td>
                      <td className="px-3 py-4">
                        <AdminBadge variant="pending" />
                      </td>
                      <td className="px-3 py-4">
                        {queueUser.signedUrl ? (
                          <a
                            href={queueUser.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            View document
                          </a>
                        ) : (
                          <span className="text-gray-400">No document</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <IdActions userId={queueUser.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certifications Queue */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Certifications Queue</h2>
              <p className="mt-1 text-sm text-gray-500">
                Approve supporting credentials for certified provider badges.
              </p>
            </div>
            <AdminBadge variant="pending" label={`${pendingCertCount} pending`} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-3 font-medium">Provider</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Certificate</th>
                  <th className="px-3 py-3 font-medium">Document</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                      No pending certification reviews.
                    </td>
                  </tr>
                ) : (
                  pendingCerts.map((cert) => {
                    const provider = providerMap.get(cert.provider_id)
                    const providerUser = provider ? providerUserMap.get(provider.user_id) : null

                    return (
                      <tr key={cert.id} className="border-b border-gray-100">
                        <td className="px-3 py-4 font-medium text-gray-900">
                          {providerUser?.full_name ?? 'Unknown provider'}
                        </td>
                        <td className="px-3 py-4">
                          <AdminBadge variant="pending" />
                        </td>
                        <td className="px-3 py-4 text-gray-600">{cert.title}</td>
                        <td className="px-3 py-4">
                          {cert.signedUrl ? (
                            <a
                              href={cert.signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              View document
                            </a>
                          ) : (
                            <span className="text-gray-400">No document</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <CertActions certId={cert.id} providerId={cert.provider_id} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
