import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { getUserName, setUserName } from '@/store/session'
import { getAvatar, setAvatar } from '@/store/storage'

interface ProfileModalProps {
  open: boolean
  onClose: (wasSaved?: boolean) => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setDisplayName(getUserName() ?? '')
      setAvatarDataUrl(getAvatar())
    }
  }, [open])

  const handleSave = () => {
    const name = displayName.trim()
    if (name) setUserName(name)
    setAvatar(avatarDataUrl)
    onClose(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setAvatarDataUrl(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setAvatarDataUrl(null)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => onClose()} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h2 id="profile-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Profile
        </h2>

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          placeholder="Your name"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Profile picture
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload
            </Button>
            {avatarDataUrl && (
              <Button variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
