import { createServiceClient } from '@/lib/supabase/service'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = createServiceClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('id, lead_fee_satang, featured_slot_limit, platform_active, updated_at')
    .limit(1)
    .single()

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[{ label: 'Admin', href: `/${locale}/admin/dashboard` }, { label: 'Settings' }]}
        title="Platform Settings"
        subtitle={
          settings?.updated_at
            ? `Last updated ${new Date(settings.updated_at).toLocaleDateString()}`
            : undefined
        }
      />
      <SettingsForm settings={settings ?? null} />
    </div>
  )
}
