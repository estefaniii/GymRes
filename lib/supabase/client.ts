import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // If we're on the client, show a warning
    if (typeof window !== 'undefined') {
      console.warn('Supabase credentials missing! Using placeholder for build phase.')
    }
    // Return a client with placeholder values to bypass constructor validation during build
    return createBrowserClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder-key'
    )
  }

  return createBrowserClient(url, key)
}
