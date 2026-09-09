import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onDevice: () => void
  onDrive: () => void
  /** Drive is hidden unless the build has Google credentials. */
  driveEnabled: boolean
  busy: 'drive' | null
  onClose: () => void
}

const DeviceIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
  </svg>
)

/** Google Drive mark, flattened to a single stroke weight for the dark toolbar. */
const DriveIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <path d="M8.4 3h7.2l7.2 12.5h-7.2z" fill="#ffc107" />
    <path d="M1.2 15.5 8.4 3l3.6 6.25-3.6 6.25z" fill="#1976d2" />
    <path d="M1.2 15.5h14.4L12 21.75H4.8z" fill="#4caf50" />
  </svg>
)

export default function ImportSourceModal({
  onDevice,
  onDrive,
  driveEnabled,
  busy,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      // The prompter reads taps on its own surface; this sheet is portalled to
      // the body, so a backdrop tap dismisses without touching the script.
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import a script"
        className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
      >
        <h2 className="px-1 pb-3 text-base font-medium text-neutral-100">Import a script</h2>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onDevice}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-neutral-700 px-4 py-3 text-left text-neutral-100 active:bg-neutral-800"
          >
            <span className="shrink-0 text-neutral-300">
              <DeviceIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Upload from device</span>
              <span className="block text-xs text-neutral-400">
                Files, iCloud Drive or any .docx on this iPad
              </span>
            </span>
          </button>

          {driveEnabled && (
            <button
              type="button"
              disabled={busy === 'drive'}
              onClick={onDrive}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-neutral-700 px-4 py-3 text-left text-neutral-100 active:bg-neutral-800 disabled:opacity-60"
            >
              <span className="shrink-0">
                <DriveIcon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Upload from Google Drive</span>
                <span className="block text-xs text-neutral-400">
                  {busy === 'drive'
                    ? 'Opening Drive…'
                    : 'Word files and Google Docs'}
                </span>
              </span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-11 w-full rounded-xl border border-neutral-700 text-sm text-neutral-300 active:bg-neutral-800"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  )
}
