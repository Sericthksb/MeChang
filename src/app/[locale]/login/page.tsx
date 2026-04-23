import LoginClient from './LoginClient'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}) {
  const { locale } = await params
  const { redirect } = await searchParams
  const redirectTo =
    redirect && redirect.startsWith('/') ? redirect : `/${locale}`

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <LoginClient locale={locale} redirectTo={redirectTo} />
      </div>
    </main>
  )
}
