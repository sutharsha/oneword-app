'use client'

import { useState, useEffect } from 'react'

function getTimeUntilMidnight(): { hours: number; minutes: number; expired: boolean } {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diffMs = midnight.getTime() - now.getTime()
  if (diffMs <= 0) return { hours: 0, minutes: 0, expired: true }
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return { hours, minutes, expired: false }
}

export default function PromptTimer() {
  const [time, setTime] = useState(getTimeUntilMidnight)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnight())
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (time.expired) {
    return (
      <span className="text-xs text-zinc-500">New prompt incoming...</span>
    )
  }

  const colorClass =
    time.hours >= 6
      ? 'text-zinc-500'
      : time.hours >= 2
      ? 'text-yellow-400'
      : 'text-red-400'

  const label =
    time.hours > 0
      ? `Expires in ${time.hours}h ${time.minutes}m`
      : `Expires in ${time.minutes}m`

  return (
    <span className={`text-xs ${colorClass}`}>{label}</span>
  )
}
