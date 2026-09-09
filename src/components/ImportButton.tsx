import { useRef, useState } from 'react'
import { importDocx } from '../lib/docx'
import { driveConfigured, pickFromDrive } from '../lib/google'
import ImportSourceModal from './ImportSourceModal'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface Props {
  onImported: (html: string, name: string) => void
  onError: (message: string) => void
}

/**
 * Import opens a source sheet: the device file picker (iPad shows the Files
 * app, so iCloud/Drive docs work as-is) or the Google Picker.
 */
export default function ImportButton({ onImported, onError }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'file' | 'drive' | null>(null)

  const handleFile = async (file: File, source: 'file' | 'drive') => {
    setBusy(source)
    try {
      const html = await importDocx(file)
      onImported(html, file.name.replace(/\.docx$/i, ''))
      setOpen(false)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not read that .docx file.')
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const chooseDrive = async () => {
    setBusy('drive')
    try {
      const file = await pickFromDrive()
      // null means the user backed out of sign-in or the picker - not an error.
      if (!file) return
      await handleFile(file, 'drive')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Google Drive import failed.')
    } finally {
      setBusy((b) => (b === 'drive' ? null : b))
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Import .docx"
        title="Import .docx"
        disabled={busy !== null}
        onClick={() => setOpen(true)}
        className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-neutral-600 px-3 text-sm text-neutral-200 active:bg-neutral-700 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
        {busy ? 'Reading…' : 'Import'}
      </button>

      {open && (
        <ImportSourceModal
          driveEnabled={driveConfigured}
          busy={busy === 'drive' ? 'drive' : null}
          onDevice={() => inputRef.current?.click()}
          onDrive={() => void chooseDrive()}
          onClose={() => setOpen(false)}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={`.docx,${DOCX_MIME}`}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file, 'file')
        }}
      />
    </>
  )
}
