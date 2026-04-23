'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileClientProps {
  locale: string
  providerId: string
  providerName: string
}

export default function ProfileClient({
  locale,
  providerId,
  providerName,
}: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/${locale}/login?redirect=/providers/${providerId}`)
        return
      }

      router.push(`/${locale}/chat?provider=${providerId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white p-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="h-14 w-full rounded-xl bg-orange-500 text-base font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-70"
      >
        {loading ? 'Loading...' : `Chat with ${providerName}`}
      </button>
    </div>
  )
}
