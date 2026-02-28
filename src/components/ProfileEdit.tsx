'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ProfileEditProps {
  userId: string
  displayName: string | null
  avatarUrl: string | null
}

export default function ProfileEdit({ userId, displayName, avatarUrl }: ProfileEditProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(displayName || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() || null })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1048576) {
      setError('Image must be under 1MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image.')
      return
    }

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Append cache-buster so the browser fetches the new image
    const urlWithBuster = `${publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlWithBuster })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setCurrentAvatar(urlWithBuster)
      router.refresh()
    }
    setUploading(false)
  }

  return (
    <div className="mt-4">
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Edit profile
        </button>
      ) : (
        <div className="space-y-3 bg-zinc-900 border border-zinc-700 rounded-xl p-4">
          {/* Avatar upload */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">Avatar</label>
            <div className="flex items-center gap-3">
              {currentAvatar ? (
                <Image
                  src={currentAvatar}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                  {(name || '?')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              maxLength={50}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setName(displayName || '')
                setError(null)
              }}
              className="text-sm px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
