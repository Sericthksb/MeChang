'use client'

import { useState } from 'react'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { CertActions, IdActions } from './VerificationActions'
import type { VerificationCertItem, VerificationIdItem } from './types'

interface VerificationQueuesProps {
  locale: string
  initialIdQueue: VerificationIdItem[]
  initialPendingCerts: VerificationCertItem[]
}

export default function VerificationQueues({
  locale,
  initialIdQueue,
  initialPendingCerts,
}: VerificationQueuesProps) {
  const [idQueue, setIdQueue] = useState(initialIdQueue)
  const [pendingCerts, setPendingCerts] = useState(initialPendingCerts)

  const pendingIdCount = idQueue.length
  const pendingCertCount = pendingCerts.length

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
                        <IdActions
                          userId={queueUser.id}
                          onSuccess={() => {
                            setIdQueue((current) => current.filter((item) => item.id !== queueUser.id))
                          }}
                        />
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
                  pendingCerts.map((cert) => (
                    <tr key={cert.id} className="border-b border-gray-100">
                      <td className="px-3 py-4 font-medium text-gray-900">{cert.providerName}</td>
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
                        <CertActions
                          certId={cert.id}
                          providerId={cert.provider_id}
                          onSuccess={() => {
                            setPendingCerts((current) =>
                              current.filter((item) => item.id !== cert.id)
                            )
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
