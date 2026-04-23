import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  addCategory,
  deleteCategory,
  renameCategory,
} from './actions'
import { createServiceClient } from '@/lib/supabase/service'
import type { Service } from '@/types/database'

interface CategoriesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    edit?: string
    error?: string
    errorId?: string
    notice?: string
  }>
}

function sortServices(services: Service[]): Service[] {
  return [...services].sort((left, right) => {
    if (left.parent_category === null && right.parent_category !== null) return -1
    if (left.parent_category !== null && right.parent_category === null) return 1
    return left.name_en.localeCompare(right.name_en)
  })
}

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: CategoriesPageProps) {
  const { locale } = await params
  const { edit, error, errorId, notice } = await searchParams
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('services')
    .select('id, name_en, name_th, icon, parent_category')
    .order('parent_category', { ascending: true, nullsFirst: true })
    .order('name_en', { ascending: true })

  const services = sortServices((data ?? []) as Service[])
  const parentServices = services.filter((service) => service.parent_category === null)
  const childServices = new Map<string, Service[]>(
    parentServices.map((service) => [service.id, []])
  )

  services
    .filter((service) => service.parent_category !== null)
    .forEach((service) => {
      const siblings = childServices.get(service.parent_category as string) ?? []
      siblings.push(service)
      childServices.set(service.parent_category as string, siblings)
    })

  async function handleAddCategory(formData: FormData) {
    'use server'

    const nameEn = (formData.get('nameEn') as string | null) ?? ''
    const nameTh = (formData.get('nameTh') as string | null) ?? ''
    const icon = (formData.get('icon') as string | null) ?? ''
    const parentIdValue = (formData.get('parentId') as string | null) ?? ''
    const result = await addCategory(
      nameEn,
      nameTh,
      icon,
      parentIdValue || null
    )

    if (result?.error) {
      redirect(
        `/${locale}/admin/categories?notice=${encodeURIComponent(result.error)}`
      )
    }

    redirect(`/${locale}/admin/categories?notice=${encodeURIComponent('Category added')}`)
  }

  async function handleRenameCategory(formData: FormData) {
    'use server'

    const id = (formData.get('id') as string | null) ?? ''
    const nameEn = (formData.get('nameEn') as string | null) ?? ''
    const nameTh = (formData.get('nameTh') as string | null) ?? ''
    const result = await renameCategory(id, nameEn, nameTh)

    if (result?.error) {
      redirect(
        `/${locale}/admin/categories?edit=${encodeURIComponent(
          id
        )}&errorId=${encodeURIComponent(id)}&error=${encodeURIComponent(result.error)}`
      )
    }

    redirect(`/${locale}/admin/categories?notice=${encodeURIComponent('Category renamed')}`)
  }

  async function handleDeleteCategory(formData: FormData) {
    'use server'

    const id = (formData.get('id') as string | null) ?? ''
    const result = await deleteCategory(id)

    if (result?.error) {
      redirect(
        `/${locale}/admin/categories?errorId=${encodeURIComponent(
          id
        )}&error=${encodeURIComponent(result.error)}`
      )
    }

    redirect(`/${locale}/admin/categories?notice=${encodeURIComponent('Category deleted')}`)
  }

  return (
    <main className="space-y-4">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500">
            Manage parent and child service categories.
          </p>
        </div>

        {notice ? (
          <p className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {notice}
          </p>
        ) : null}

        <div className="space-y-3">
          {parentServices.map((service) => {
            const children = childServices.get(service.id) ?? []

            return (
              <div key={service.id} className="space-y-2">
                <CategoryRow
                  service={service}
                  isEditing={edit === service.id}
                  locale={locale}
                  error={errorId === service.id ? error : undefined}
                  indent={false}
                  onRename={handleRenameCategory}
                  onDelete={handleDeleteCategory}
                />
                {children.map((child) => (
                  <CategoryRow
                    key={child.id}
                    service={child}
                    isEditing={edit === child.id}
                    locale={locale}
                    error={errorId === child.id ? error : undefined}
                    indent
                    onRename={handleRenameCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Add Category</h3>
        <form action={handleAddCategory} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="nameEn"
            placeholder="Name (EN)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <input
            type="text"
            name="nameTh"
            placeholder="Name (TH)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <input
            type="text"
            name="icon"
            placeholder="Icon emoji"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <select
            name="parentId"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            defaultValue=""
          >
            <option value="">Top-level category</option>
            {parentServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name_en}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Add Category
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

function CategoryRow({
  service,
  isEditing,
  locale,
  error,
  indent,
  onRename,
  onDelete,
}: {
  service: Service
  isEditing: boolean
  locale: string
  error?: string
  indent: boolean
  onRename: (formData: FormData) => Promise<void>
  onDelete: (formData: FormData) => Promise<void>
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-gray-50 p-4 ${
        indent ? 'ml-4 pl-4' : ''
      }`}
    >
      {isEditing ? (
        <form action={onRename} className="grid gap-3 sm:grid-cols-[1.2fr_1.2fr_0.7fr_auto]">
          <input type="hidden" name="id" value={service.id} />
          <input
            type="text"
            name="nameEn"
            defaultValue={service.name_en}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <input
            type="text"
            name="nameTh"
            defaultValue={service.name_th}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <div className="flex items-center text-lg">{service.icon ?? '•'}</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Save
            </button>
            <Link
              href={`/${locale}/admin/categories`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1.2fr_1.2fr_0.7fr_auto] sm:items-center">
          <div className="font-medium text-gray-900">{service.name_en}</div>
          <div className="text-gray-600">{service.name_th}</div>
          <div className="text-lg">{service.icon ?? '—'}</div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/categories?edit=${service.id}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Rename
            </Link>
            <form action={onDelete}>
              <input type="hidden" name="id" value={service.id} />
              <button
                type="submit"
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
