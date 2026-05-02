'use client'

import { useTransition } from 'react'
import { approveId, rejectId, approveCert, rejectCert } from './actions'

export function IdActions({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approveId(userId))}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {pending ? 'Processing…' : 'Approve'}
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => rejectId(userId))}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}

export function CertActions({ certId, providerId }: { certId: string; providerId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approveCert(certId, providerId))}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {pending ? 'Processing…' : 'Approve'}
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => rejectCert(certId))}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
