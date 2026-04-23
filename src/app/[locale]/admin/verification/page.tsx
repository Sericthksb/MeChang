import { approveCert, approveId, rejectCert, rejectId } from './actions'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Certification, ProviderProfile, User } from '@/types/database'

interface IdQueueUser extends Pick<User, 'id' | 'full_name' | 'id_document_url'> {}

interface PendingCertification
  extends Pick<Certification, 'id' | 'provider_id' | 'title' | 'document_url'> {}

interface VerificationProvider extends Pick<ProviderProfile, 'id' | 'user_id'> {}

interface VerificationUser extends Pick<User, 'id' | 'full_name'> {}

export default async function AdminVerificationPage() {
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

  const pendingCerts = pendingCertsError
    ? []
    : ((pendingCertsData ?? []) as PendingCertification[])
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
    <main className="space-y-4">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">ID Queue</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review submitted identity documents before approval.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Document</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {((idQueueData ?? []) as IdQueueUser[]).length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No pending ID reviews.
                  </td>
                </tr>
              ) : (
                ((idQueueData ?? []) as IdQueueUser[]).map((queueUser) => (
                  <tr key={queueUser.id} className="border-b border-gray-100">
                    <td className="px-3 py-4 font-medium text-gray-900">
                      {queueUser.full_name ?? 'Unnamed user'}
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
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
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
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Certifications Queue</h2>
        <p className="mt-1 text-sm text-gray-500">
          Approve supporting credentials for certified provider badges.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Provider</th>
                <th className="px-3 py-3 font-medium">Certificate</th>
                <th className="px-3 py-3 font-medium">Document</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingCerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
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
                      <td className="px-3 py-4 text-gray-600">{cert.title}</td>
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
                              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
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
      </section>
    </main>
  )
}
