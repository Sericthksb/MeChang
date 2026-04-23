'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MessageBubble from '@/components/MessageBubble'
import { markComplete, sendMessage, submitReview } from './actions'
import type { Chat, Message, Review, User } from '@/types/database'

type ChatFull = Chat & { customer: User | null; provider: User | null }
type MessageWithSender = Message & {
  sender: { full_name: string | null } | null
}

interface ChatClientProps {
  locale: string
  chatId: string
  currentUserId: string
  chat: ChatFull
  initialMessages: MessageWithSender[]
  isProvider: boolean
  existingReview: Review | null
}

interface FileMetadata extends Record<string, unknown> {
  fileName: string
  fileSize: number
}

interface LocationMetadata extends Record<string, unknown> {
  mapsUrl: string
  label: string
}

function PhotoIcon() {
  return <span aria-hidden="true">📷</span>
}

function VideoIcon() {
  return <span aria-hidden="true">🎥</span>
}

function FileIcon() {
  return <span aria-hidden="true">📎</span>
}

function LocationIcon() {
  return <span aria-hidden="true">📍</span>
}

function StarButton({
  filled,
  onClick,
}: {
  filled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={filled ? 'text-amber-400' : 'text-gray-300'}
    >
      ★
    </button>
  )
}

export default function ChatClient({
  locale,
  chatId,
  currentUserId,
  chat,
  initialMessages,
  isProvider,
  existingReview,
}: ChatClientProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [chatStatus, setChatStatus] = useState(chat.status)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [mapsUrl, setMapsUrl] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [reviewThanks, setReviewThanks] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const supabase = createClient()
  const otherPartyName = isProvider
    ? chat.customer?.full_name ?? 'Unknown'
    : chat.provider?.full_name ?? 'Unknown'

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            { ...(payload.new as Message), sender: null },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendText() {
    const trimmed = text.trim()

    if (!trimmed) {
      return
    }

    setError('')
    const result = await sendMessage(chatId, trimmed, 'text', null, null)

    if (result?.error) {
      setError(result.error)
      return
    }

    setText('')
  }

  async function uploadAttachment(
    file: File,
    type: 'image' | 'video' | 'file',
    metadata: FileMetadata | null
  ) {
    setUploading(true)
    setError('')

    try {
      const path = `chat-attachments/${chatId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file)

      if (uploadError) {
        setError(uploadError.message)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('chat-attachments').getPublicUrl(path)

      const result = await sendMessage(
        chatId,
        null,
        type,
        publicUrl,
        metadata ? metadata : null
      )

      if (result?.error) {
        setError(result.error)
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'file'
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const metadata: FileMetadata | null =
      type === 'file'
        ? { fileName: file.name, fileSize: file.size }
        : null

    await uploadAttachment(file, type, metadata)
    event.target.value = ''
  }

  async function handleSendLocation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    const result = await sendMessage(chatId, null, 'location', null, {
      mapsUrl,
      label: locationLabel,
    } satisfies LocationMetadata)

    if (result?.error) {
      setError(result.error)
      return
    }

    setMapsUrl('')
    setLocationLabel('')
    setShowLocationForm(false)
  }

  async function handleMarkComplete() {
    if (!window.confirm('Mark this job as complete?')) {
      return
    }

    setError('')
    const result = await markComplete(chatId)

    if (result?.error) {
      setError(result.error)
      return
    }

    setChatStatus('completed')
  }

  async function handleSubmitReview() {
    setError('')
    const result = await submitReview(
      chatId,
      chat.provider_id,
      selectedRating,
      comment
    )

    if (result?.error) {
      setError(result.error)
      return
    }

    setReviewThanks(true)
    window.setTimeout(() => {
      setReviewThanks(false)
      setDismissed(true)
    }, 2000)
  }

  return (
    <main className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Link href={`/${locale}/chat`} className="text-lg text-gray-700">
          ←
        </Link>
        <p className="font-semibold text-gray-900">{otherPartyName}</p>
        {isProvider && chatStatus === 'active' ? (
          <button
            type="button"
            onClick={handleMarkComplete}
            className="ml-auto rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Mark Complete
          </button>
        ) : null}
      </div>

      {!isProvider &&
      chatStatus === 'completed' &&
      !existingReview &&
      !dismissed &&
      !reviewThanks ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <div className="flex gap-2 text-2xl">
            {Array.from({ length: 5 }, (_, index) => (
              <StarButton
                key={`star-${index + 1}`}
                filled={index < selectedRating}
                onClick={() => setSelectedRating(index + 1)}
              />
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional comment..."
            rows={2}
            className="mt-3 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={selectedRating === 0}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-60"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-sm text-gray-500 underline"
            >
              Remind me later
            </button>
          </div>
        </div>
      ) : null}

      {reviewThanks ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Thanks for your review!
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUserId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white">
        <div className="flex gap-3 border-t border-gray-100 px-4 py-2">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="text-xl"
          >
            <PhotoIcon />
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="text-xl"
          >
            <VideoIcon />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xl"
          >
            <FileIcon />
          </button>
          <button
            type="button"
            onClick={() => setShowLocationForm((prev) => !prev)}
            className="text-xl"
          >
            <LocationIcon />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileChange(event, 'image')}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => handleFileChange(event, 'video')}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={(event) => handleFileChange(event, 'file')}
          />
        </div>

        {showLocationForm ? (
          <form
            onSubmit={handleSendLocation}
            className="flex gap-2 px-4 py-2"
          >
            <input
              type="text"
              value={mapsUrl}
              onChange={(event) => setMapsUrl(event.target.value)}
              placeholder="Maps URL"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder="Label"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Send
            </button>
          </form>
        ) : null}

        <div className="px-4 py-3">
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Type a message..."
            />
            <button
              type="button"
              onClick={handleSendText}
              disabled={uploading || !text.trim()}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-60"
            >
              Send
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
