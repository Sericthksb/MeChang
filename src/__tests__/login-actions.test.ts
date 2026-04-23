import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const mockedCreateClient = vi.mocked(createClient)

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when email is empty', async () => {
    const { signIn } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', '')
    formData.set('password', 'password123')

    const result = await signIn(formData)

    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error when password is empty', async () => {
    const { signIn } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', '')

    const result = await signIn(formData)

    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns error on Supabase auth failure', async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: 'Invalid credentials' },
        }),
      },
    } as never)

    const { signIn } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'wrongpassword')
    formData.set('locale', 'en')

    const result = await signIn(formData)

    expect(result).toEqual({ error: 'Invalid credentials' })
  })

  it('redirects on successful sign in', async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      },
    } as never)

    const { signIn } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('locale', 'en')

    await signIn(formData)

    expect(redirect).toHaveBeenCalledWith('/en')
  })
})

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when email is empty', async () => {
    const { signUp } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', '')
    formData.set('password', 'password123')

    const result = await signUp(formData)

    expect(result).toEqual({ error: 'Email and password are required' })
  })

  it('returns emailConfirmation when session is null', async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
      },
    } as never)

    const { signUp } = await import('../app/[locale]/login/actions')
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('password', 'password123')
    formData.set('role', 'customer')
    formData.set('locale', 'en')

    const result = await signUp(formData)

    expect(result).toEqual({ emailConfirmation: true })
  })
})
