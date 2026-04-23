import Image from 'next/image'
import type { Message, User } from '@/types/database'

type MessageWithSender = Message & {
  sender: { full_name: string | null } | null
}

interface MessageBubbleProps {
  message: MessageWithSender
  isMine: boolean
}

interface FileMetadata {
  fileName?: string
}

interface LocationMetadata {
  mapsUrl?: string
  label?: string
}

function getFileMetadata(
  metadata: Record<string, unknown> | null
): FileMetadata | null {
  if (!metadata) {
    return null
  }

  return metadata as FileMetadata
}

function getLocationMetadata(
  metadata: Record<string, unknown> | null
): LocationMetadata | null {
  if (!metadata) {
    return null
  }

  return metadata as LocationMetadata
}

export default function MessageBubble({
  message,
  isMine,
}: MessageBubbleProps) {
  const containerClass = isMine ? 'justify-end' : 'justify-start'
  const bubbleClass = isMine
    ? 'bg-orange-500 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[75%]'
    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-[75%]'
  const fileMetadata = getFileMetadata(message.metadata)
  const locationMetadata = getLocationMetadata(message.metadata)

  return (
    <div className={`flex ${containerClass}`}>
      <div className={bubbleClass}>
        {message.type === 'text' ? <p>{message.body}</p> : null}

        {message.type === 'image' && message.attachment_url ? (
          <Image
            src={message.attachment_url}
            width={200}
            height={200}
            className="rounded-xl object-cover"
            alt="Image"
          />
        ) : null}

        {message.type === 'video' && message.attachment_url ? (
          <video
            src={message.attachment_url}
            controls
            className="max-w-[200px] rounded-xl"
          />
        ) : null}

        {message.type === 'file' && message.attachment_url ? (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
            className={`underline ${isMine ? 'text-white' : 'text-gray-900'}`}
          >
            📎 {fileMetadata?.fileName ?? 'File'}
          </a>
        ) : null}

        {message.type === 'location' ? (
          <a
            href={locationMetadata?.mapsUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className={`underline ${isMine ? 'text-white' : 'text-gray-900'}`}
          >
            📍 {locationMetadata?.label ?? 'Location'}
          </a>
        ) : null}
      </div>
    </div>
  )
}
