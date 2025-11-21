import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the service role key.
 * Never import this in client components.
 *
 * This client bypasses RLS (Row Level Security) and should only be used
 * in server-side API routes for administrative operations.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase service credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
    )
  }

  return createClient<any>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as SupabaseClient
}

/**
 * Singleton instance of admin client (created on first use)
 * Use this for consistent client reuse across requests
 */
let adminClientInstance: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = createAdminClient()
  }
  return adminClientInstance
}
