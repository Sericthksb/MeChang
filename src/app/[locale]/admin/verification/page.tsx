import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { approveCert, approveId, rejectCert, rejectId } from './actions'
import type { Certification, ProviderProfile, User } from '@/types/database'

interface VerificationPageProps {
  params: Promise<{ locale: string }>
}

interface IdQueueUser
  extends Pick<User, 'id' | 'full_name' | 'id_document_url'> {}

interface PendingCertification
  extends Pick<Certification, 'id' | 'provider_id' | 'title' | 'document_url'> {}

interface VerificationProvider extends Pick<ProviderProfile, 'id' | 'user_id'> {}

interface VerificationUser extends Pick<User, 'id' | 'full_name'> {}

export default async function AdminVerificationPage({
  params,
}: VerificationPageProps) {
  const { locale } = await params
  const authClient = await createClient()
  const {
    data: { user: adminUser },
  } = await authClient.auth.getUser()
  const supabase = createServiceClient()

  const { data: idQueueData } = await supabase
    .from('users')
    .select('id, full_name, id_document_url')
    .not('id_document_url', 'is', null)
    .eq('id_verified', false)
    .order('created_at', { ascending: false })

  const { data: pendingCertsData, error: pendingCertsError } = await supabase
    .from('certifications')
    .select('id, provider_id, title, document_url')
    .eq('status', 'pending')
    .order('issued_date', { ascending: false, nullsFirst: false })

  const idQueue = (idQueueData ?? []) as IdQueueUser[]
  const pendingIdCount = idQueue.length
  const pendingCerts = pendingCertsError
    ? []
    : ((pendingCertsData ?? []) as PendingCertification[])
  const pendingCertCount = pendingCerts.length
  const providerIds = pendingCerts.map((cert) => cert.provider_id)

  const { data: providerRows } =
    providerIds.length > 0
      ? await supabase
          .from('provider_profiles')
          .select('id, user_id')
          .in('id', providerIds)
      : { data: [] as VerificationProvider[] }

  const verificationProviders = (providerRows ?? []) as VerificationProvider[]
  const providerUserIds = verificationProviders.map((provider) => provider.user_id)

  const { data: providerUsers } =
    providerUserIds.length > 0
      ? await supabase
          .from('users')
          .select('id, full_name')
          .in('id', providerUserIds)
      : { data: [] as VerificationUser[] }

  const providerMap = new Map<string, VerificationProvider>(
    verificationProviders.map((provider) => [provider.id, provider])
  )
  const providerUserMap = new Map<string, VerificationUser>(
    ((providerUsers ?? []) as VerificationUser[]).map((row) => [row.id, row])
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
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-gray-500"
                    >
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
                        <a
                          href={queueUser.id_document_url ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          View document
                        </a>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <form
                            action={async () => {
                              'use server'
                              await approveId(queueUser.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                            >
                              Approve
                            </button>
                          </form>
                          <form
                            action={async () => {
                              'use server'
                              await rejectId(queueUser.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Certifications Queue
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Approve supporting credentials for certified provider badges.
              </p>
            </div>
            <AdminBadge
              variant="pending"
              label={`${pendingCertCount} pending`}
            />
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
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No pending certification reviews.
                    </td>
                  </tr>
                ) : (
                  pendingCerts.map((cert) => {
                    const provider = providerMap.get(cert.provider_id)
                    const providerUser = provider
                      ? providerUserMap.get(provider.user_id)
                      : null

                    return (
                      <tr key={cert.id} className="border-b border-gray-100">
                        <td className="px-3 py-4 font-medium text-gray-900">
                          {providerUser?.full_name ?? 'Unknown provider'}
                        </td>
                        <td className="px-3 py-4">
                          <AdminBadge variant="pending" />
                        </td>
                        <td className="px-3 py-4 text-gray-600">
                          {cert.title}
                        </td>
                        <td className="px-3 py-4">
                          <a
                            href={cert.document_url ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            View document
                          </a>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <form
                              action={async () => {
                                'use server'
                                await approveCert(
                                  cert.id,
                                  cert.provider_id,
                                  adminUser?.id ?? ''
                                )
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                              >
                                Approve
                              </button>
                            </form>
                            <form
                              action={async () => {
                                'use server'
                                await rejectCert(cert.id, adminUser?.id ?? '')
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
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
