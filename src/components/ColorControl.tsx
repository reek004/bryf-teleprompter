import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  '#000000',
  '#111827',
  '#ffffff',
  '#e5e7eb',
  '#fbbf24',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
]

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  /** popover opens downward when the toolbar is docked at the top */
  openDown: boolean
}

export default function ColorControl({ label, value, onChange, openDown }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 active:bg-neutral-700"
      >
        <span
          className="block h-5 w-9 rounded border border-neutral-400"
          style={{ background: value }}
        />
        <span className="text-[11px] leading-none text-neutral-300">{label}</span>
      </button>

      {open && (
        <div
          className={`absolute left-1/2 z-20 w-52 -translate-x-1/2 rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl ${
            openDown ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                onClick={() => {
                  onChange(preset)
                  setOpen(false)
                }}
                className={`h-10 rounded-lg border ${
                  preset.toLowerCase() === value.toLowerCase()
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-neutral-600'
                }`}
                style={{ background: preset }}
              />
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between text-xs text-neutral-300">
            Custom
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-neutral-600 bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  )
}
