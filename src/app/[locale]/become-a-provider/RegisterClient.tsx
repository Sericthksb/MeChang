'use client'

import Image from 'next/image'
import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  submitRegistration,
  type RegistrationData,
} from './actions'

const SERVICE_AREAS = [
  'Patong',
  'Kata',
  'Karon',
  'Rawai',
  'Chalong',
  'Phuket Town',
  'Other',
] as const

const CATEGORY_OPTIONS = [
  { value: 'Home', icon: '🏠' },
  { value: 'Repair', icon: '🔧' },
  { value: 'IT', icon: '💻' },
  { value: 'Cleaning', icon: '🧹' },
  { value: 'Personal', icon: '👤' },
] as const

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const MAX_COVER_BYTES = 10 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const MAX_CERTIFICATIONS = 5

interface RegisterClientProps {
  locale: string
  userId: string
}

interface CertificateDraft {
  id: string
  title: string
  file: File | null
  uploadedPath: string | null
}

function getStepLabel(step: number) {
  return `Step ${step} of 4`
}

function getPillClassName(isActive: boolean) {
  return isActive
    ? 'rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white'
    : 'rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600'
}

function getGridPillClassName(isActive: boolean) {
  return isActive
    ? 'flex min-h-20 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-4 text-center text-sm font-medium text-white'
    : 'flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center text-sm font-medium text-gray-600'
}

function formatBytesLimit(limit: number) {
  return `${Math.floor(limit / (1024 * 1024))}MB`
}

function buildStoragePath(basePath: string, suffix: string) {
  return `${basePath}/${Date.now()}${suffix}`
}

async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ error: string | null; storedValue: string | null; previewUrl: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  })

  if (error) {
    return { error: error.message, storedValue: null, previewUrl: null }
  }

  if (bucket === 'avatars' || bucket === 'covers') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { error: null, storedValue: data.publicUrl, previewUrl: data.publicUrl }
  }

  return {
    error: null,
    storedValue: path,
    previewUrl: null,
  }
}

export default function RegisterClient({
  locale,
  userId,
}: RegisterClientProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [pricingNote, setPricingNote] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null)
  const [idDocumentUrl, setIdDocumentUrl] = useState<string>('')
  const [certifications, setCertifications] = useState<CertificateDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploadingPhotos, startPhotoUploadTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return undefined
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return undefined
    }

    const objectUrl = URL.createObjectURL(coverFile)
    setCoverPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [coverFile])

  function toggleValue(values: string[], value: string) {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value]
  }

  function updateCertificate(
    id: string,
    updater: (draft: CertificateDraft) => CertificateDraft
  ) {
    setCertifications((current) =>
      current.map((draft) => (draft.id === id ? updater(draft) : draft))
    )
  }

  function addCertificate() {
    if (certifications.length >= MAX_CERTIFICATIONS) {
      return
    }

    setCertifications((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: '',
        file: null,
        uploadedPath: null,
      },
    ])
  }

  function removeCertificate(id: string) {
    setCertifications((current) => current.filter((draft) => draft.id !== id))
  }

  function handleAvatarChange(file: File | null) {
    setAvatarFile(file)
    setAvatarUrl(null)
  }

  function handleCoverChange(file: File | null) {
    setCoverFile(file)
    setCoverUrl(null)
  }

  function validateFileSize(file: File | null, limit: number, label: string) {
    if (!file) {
      return null
    }

    if (file.size > limit) {
      return `${label} must be ${formatBytesLimit(limit)} or smaller`
    }

    return null
  }

  function goToStepTwo() {
    if (!fullName.trim()) {
      setError('Display name is required')
      return
    }

    if (bio.length > 500) {
      setError('Bio must be 500 characters or fewer')
      return
    }

    if (pricingNote.length > 80) {
      setError('Pricing note must be 80 characters or fewer')
      return
    }

    if (serviceAreas.length === 0) {
      setError('Select at least one service area')
      return
    }

    setError(null)
    setStep(2)
  }

  function goToStepThree() {
    if (categories.length === 0) {
      setError('Select at least one category')
      return
    }

    setError(null)
    setStep(3)
  }

  function goToStepFour() {
    const avatarSizeError = validateFileSize(
      avatarFile,
      MAX_AVATAR_BYTES,
      'Avatar'
    )
    const coverSizeError = validateFileSize(
      coverFile,
      MAX_COVER_BYTES,
      'Cover photo'
    )

    if (!avatarFile) {
      setError('Avatar is required')
      return
    }

    if (avatarSizeError) {
      setError(avatarSizeError)
      return
    }

    if (coverSizeError) {
      setError(coverSizeError)
      return
    }

    setError(null)

    startPhotoUploadTransition(async () => {
      let nextAvatarUrl = avatarUrl

      if (!nextAvatarUrl) {
        const avatarPath = buildStoragePath(`avatars/${userId}`, '')
        const avatarUpload = await uploadFile('avatars', avatarPath, avatarFile)

        if (avatarUpload.error || !avatarUpload.storedValue) {
          setError(avatarUpload.error ?? 'Avatar upload failed')
          return
        }

        nextAvatarUrl = avatarUpload.storedValue
      }

      let nextCoverUrl = coverUrl

      if (coverFile && !nextCoverUrl) {
        const extension = coverFile.name.includes('.')
          ? coverFile.name.slice(coverFile.name.lastIndexOf('.'))
          : ''
        const coverPath = buildStoragePath(`covers/${userId}`, extension)
        const coverUpload = await uploadFile('covers', coverPath, coverFile)

        if (coverUpload.error || !coverUpload.storedValue) {
          setError(coverUpload.error ?? 'Cover upload failed')
          return
        }

        nextCoverUrl = coverUpload.storedValue
        setCoverUrl(nextCoverUrl)
      }

      setAvatarUrl(nextAvatarUrl)
      setError(null)
      setStep(4)
      setCoverUrl(nextCoverUrl)
    })
  }

  function validateDocuments() {
    const idSizeError = validateFileSize(
      idDocumentFile,
      MAX_DOCUMENT_BYTES,
      'ID document'
    )

    if (!idDocumentFile) {
      return 'ID document is required'
    }

    if (idSizeError) {
      return idSizeError
    }

    for (const certification of certifications) {
      if (!certification.title.trim() && !certification.file) {
        continue
      }

      if (!certification.title.trim()) {
        return 'Certificate label is required'
      }

      if (!certification.file && !certification.uploadedPath) {
        return 'Certificate file is required'
      }

      const certificateSizeError = validateFileSize(
        certification.file,
        MAX_DOCUMENT_BYTES,
        'Certificate file'
      )

      if (certificateSizeError) {
        return certificateSizeError
      }
    }

    return null
  }

  function buildRegistrationData(
    uploadedIdDocumentUrl: string,
    uploadedCertifications: { title: string; documentUrl: string }[]
  ): RegistrationData {
    return {
      locale,
      fullName,
      bio,
      pricingNote,
      serviceAreas,
      categories,
      avatarUrl,
      coverUrl,
      idDocumentUrl: uploadedIdDocumentUrl,
      certifications: uploadedCertifications,
    }
  }

  function handleSubmit() {
    const validationError = validateDocuments()

    if (validationError) {
      setError(validationError)
      return
    }

    if (!avatarUrl) {
      setError('Avatar upload is required before submitting')
      return
    }

    setError(null)

    startSubmitTransition(async () => {
      const idExtension = idDocumentFile?.name.includes('.')
        ? idDocumentFile.name.slice(idDocumentFile.name.lastIndexOf('.'))
        : ''
      const idPath =
        idDocumentUrl ||
        buildStoragePath(`id-documents/${userId}`, idExtension)

      let uploadedIdDocumentUrl = idDocumentUrl

      if (idDocumentFile && !idDocumentUrl) {
        const idUpload = await uploadFile('id-documents', idPath, idDocumentFile)

        if (idUpload.error || !idUpload.storedValue) {
          setError(idUpload.error ?? 'ID document upload failed')
          return
        }

        uploadedIdDocumentUrl = idUpload.storedValue
        setIdDocumentUrl(uploadedIdDocumentUrl)
      }

      const uploadedCertifications: { title: string; documentUrl: string }[] = []

      for (let index = 0; index < certifications.length; index += 1) {
        const certification = certifications[index]
        const trimmedTitle = certification.title.trim()

        if (!trimmedTitle) {
          continue
        }

        let documentUrl = certification.uploadedPath

        if (certification.file && !documentUrl) {
          const extension = certification.file.name.includes('.')
            ? certification.file.name.slice(
                certification.file.name.lastIndexOf('.')
              )
            : ''
          const path = `certifications/${userId}/${Date.now()}-${index}${extension}`
          const upload = await uploadFile(
            'certifications',
            path,
            certification.file
          )

          if (upload.error || !upload.storedValue) {
            setError(upload.error ?? 'Certificate upload failed')
            return
          }

          documentUrl = upload.storedValue
          updateCertificate(certification.id, (draft) => ({
            ...draft,
            uploadedPath: documentUrl,
          }))
        }

        if (!documentUrl) {
          setError('Certificate upload failed')
          return
        }

        uploadedCertifications.push({
          title: trimmedTitle,
          documentUrl,
        })
      }

      const result = await submitRegistration(
        buildRegistrationData(uploadedIdDocumentUrl, uploadedCertifications)
      )

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs text-gray-500">{getStepLabel(step)}</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={
                  item === step
                    ? 'h-2 flex-1 rounded-full bg-orange-500'
                    : 'h-2 flex-1 rounded-full bg-gray-200'
                }
              />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Become a provider
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete your profile to start receiving leads in Phuket.
          </p>
        </div>

        {step === 1 ? (
          <section className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Display name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="How customers will see your name"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <span className="text-xs text-gray-400">{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value.slice(0, 500))}
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Tell customers what you do best"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Pricing note
                </label>
                <span className="text-xs text-gray-400">
                  {pricingNote.length}/80
                </span>
              </div>
              <input
                type="text"
                value={pricingNote}
                onChange={(event) =>
                  setPricingNote(event.target.value.slice(0, 80))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Starting from ฿500"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                Service areas
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_AREAS.map((area) => {
                  const isActive = serviceAreas.includes(area)

                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() =>
                        setServiceAreas((current) => toggleValue(current, area))
                      }
                      className={getPillClassName(isActive)}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                Select your service categories
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORY_OPTIONS.map((category) => {
                  const isActive = categories.includes(category.value)

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        setCategories((current) =>
                          toggleValue(current, category.value)
                        )
                      }
                      className={getGridPillClassName(isActive)}
                    >
                      <span aria-hidden="true" className="text-xl">
                        {category.icon}
                      </span>
                      <span>{category.value}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleAvatarChange(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600"
              />
              <p className="mt-2 text-xs text-gray-400">Required, max 5MB</p>
              {avatarPreview ? (
                <div className="relative mt-4 h-28 w-28 overflow-hidden rounded-2xl border border-gray-200">
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cover photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleCoverChange(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600"
              />
              <p className="mt-2 text-xs text-gray-400">Optional, max 10MB</p>
              {coverPreview ? (
                <div className="relative mt-4 h-40 w-full overflow-hidden rounded-2xl border border-gray-200">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ID card
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) =>
                  setIdDocumentFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600"
              />
              <p className="mt-2 text-sm italic text-gray-500">
                Required for ID Verification badge. Admin reviews within 1–2
                business days.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Certifications
                  </p>
                  <p className="mt-1 text-sm italic text-gray-500">
                    Optional. Approved certifications earn a gold Certified
                    Provider badge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCertificate}
                  disabled={certifications.length >= MAX_CERTIFICATIONS}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add Certificate
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {certifications.map((certification, index) => (
                  <div
                    key={certification.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-gray-700">
                        Certificate {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCertificate(certification.id)}
                        className="text-sm text-gray-500 hover:text-orange-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={certification.title}
                        onChange={(event) =>
                          updateCertificate(certification.id, (draft) => ({
                            ...draft,
                            title: event.target.value,
                            uploadedPath: null,
                          }))
                        }
                        placeholder="Certificate label"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(event) =>
                          updateCertificate(certification.id, (draft) => ({
                            ...draft,
                            file: event.target.files?.[0] ?? null,
                            uploadedPath: null,
                          }))
                        }
                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setStep((current) => Math.max(1, current - 1))
            }}
            disabled={step === 1 || isUploadingPhotos || isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  goToStepTwo()
                  return
                }

                if (step === 2) {
                  goToStepThree()
                  return
                }

                goToStepFour()
              }}
              disabled={isUploadingPhotos || isSubmitting}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingPhotos ? 'Uploading...' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploadingPhotos || isSubmitting}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
