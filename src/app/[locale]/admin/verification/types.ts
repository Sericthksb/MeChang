import type { Certification, User } from '@/types/database'

export interface VerificationIdItem
  extends Pick<User, 'id' | 'full_name' | 'id_document_url'> {
  signedUrl: string | null
}

export interface VerificationCertItem
  extends Pick<Certification, 'id' | 'provider_id' | 'title' | 'document_url'> {
  signedUrl: string | null
  providerName: string
}
