'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveId, rejectId, approveCert, rejectCert } from './actions'

interface ActionProps {
  onSuccess?: () => void
}

export function IdActions({ userId, onSuccess }: { userId: string } & ActionProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveId(userId)
      if (result?.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectId(userId)
      if (result?.error) { setError(result.error); return }
      onSuccess?.()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        disabled={pending}
        onClick={handleApprove}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {pending ? 'Processing…' : 'Approve'}
      </button>
      <button
        disabled={pending}
        onClick={handleReject}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}

export function CertActions({
  certId,
  providerId,
  onSuccess,
}: { certId: string; providerId: string } & ActionProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveCert(certId, providerId)
      if (result?.error) { setError(result.error); return }
      onSuccess?.()
      router.refresh()
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectCert(certId)
      if (result?.error) { setError(result.error); return }
      onSuccess?.()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        disabled={pending}
        onClick={handleApprove}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
      >
        {pending ? 'Processing…' : 'Approve'}
      </button>
      <button
        disabled={pending}
        onClick={handleReject}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
