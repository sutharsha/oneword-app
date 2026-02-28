import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Checks if the current user is an admin. Redirects to / if not.
 * Returns the authenticated user and supabase client.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return { supabase, user }
}
