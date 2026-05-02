import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    cache: 'no-store',
  })
}

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        // Prevent Next from serving stale Supabase reads after admin mutations.
        fetch: noStoreFetch,
      },
    }
  )
}
