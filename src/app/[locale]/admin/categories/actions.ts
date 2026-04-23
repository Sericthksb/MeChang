'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

function revalidateCategories() {
  revalidatePath('/en/admin/categories')
  revalidatePath('/th/admin/categories')
}

export async function addCategory(
  nameEn: string,
  nameTh: string,
  icon: string,
  parentId: string | null
): Promise<{ error: string } | void> {
  const trimmedNameEn = nameEn.trim()
  const trimmedNameTh = nameTh.trim()
  const trimmedIcon = icon.trim()

  if (!trimmedNameEn || !trimmedNameTh) {
    return { error: 'English and Thai names are required' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('services').insert({
    name_en: trimmedNameEn,
    name_th: trimmedNameTh,
    icon: trimmedIcon || null,
    parent_category: parentId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidateCategories()
}

export async function renameCategory(
  id: string,
  nameEn: string,
  nameTh: string
): Promise<{ error: string } | void> {
  const trimmedNameEn = nameEn.trim()
  const trimmedNameTh = nameTh.trim()

  if (!trimmedNameEn || !trimmedNameTh) {
    return { error: 'English and Thai names are required' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('services')
    .update({ name_en: trimmedNameEn, name_th: trimmedNameTh })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidateCategories()
}

export async function deleteCategory(
  id: string
): Promise<{ error: string } | void> {
  const supabase = createServiceClient()
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('name_en')
    .eq('id', id)
    .single()

  if (serviceError || !service) {
    return { error: serviceError?.message ?? 'Category not found' }
  }

  const { count, error: countError } = await supabase
    .from('provider_profiles')
    .select('id', { count: 'exact', head: true })
    .contains('categories', [service.name_en])

  if (countError) {
    return { error: countError.message }
  }

  if ((count ?? 0) > 0) {
    return { error: `In use by ${count} provider(s)` }
  }

  const { error } = await supabase.from('services').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidateCategories()
}
