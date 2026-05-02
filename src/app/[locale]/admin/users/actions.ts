'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserRole } from '@/types/database'

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/en/admin/users')
  revalidatePath('/th/admin/users')
  revalidatePath(`/en/admin/users/${userId}`)
  revalidatePath(`/th/admin/users/${userId}`)
}

export async function toggleBanUser(
  userId: string,
  isBanned: boolean
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('users')
    .update({ is_banned: isBanned })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/en/admin/users')
  revalidatePath('/th/admin/users')
  revalidatePath(`/en/admin/users/${userId}`)
  revalidatePath(`/th/admin/users/${userId}`)
}

export async function deleteUser(
  userId: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('users').delete().eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/en/admin/users')
  revalidatePath('/th/admin/users')
  revalidatePath(`/en/admin/users/${userId}`)
  revalidatePath(`/th/admin/users/${userId}`)
}
