import { createBrowserClient } from '@supabase/ssr'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
