'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt: string
  name?: string | null
  width: number
  height: number
  className?: string
  fallbackClassName?: string
}

export default function Avatar({
  src,
  alt,
  name,
  width,
  height,
  className = '',
  fallbackClassName = '',
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const initial = useMemo(() => {
    const value = (name || alt || '?').trim()
    return value[0]?.toUpperCase() || '?'
  }, [name, alt])

  if (!src || failedSrc === src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white ${fallbackClassName || className}`.trim()}
        style={{ width, height }}
        aria-label={alt}
      >
        {initial}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  )
}
