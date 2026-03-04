import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.error('Supabase credentials missing!')
    }
    // Return a dummy client or handle it safely. 
    // During build this allows the process to continue.
    return createBrowserClient(url || '', key || '')
  }

  return createBrowserClient(url, key)
}
