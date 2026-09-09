import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { markPopoverDismiss } from '../lib/popover'

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

const POPOVER_WIDTH = 208
const EDGE_GAP = 8

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  /** popover opens downward when the toolbar is docked at the top */
  openDown: boolean
}

export default function ColorControl({ label, value, onChange, openDown }: Props) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ left: number; top?: number; bottom?: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)

  // The toolbar row scrolls horizontally, which makes its computed overflow-y
  // `auto` - an absolutely positioned popover inside it gets clipped to the
  // 57px bar. So the panel lives in a portal, anchored to the button by hand.
  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.min(
      window.innerWidth - POPOVER_WIDTH - EDGE_GAP,
      Math.max(EDGE_GAP, rect.left + rect.width / 2 - POPOVER_WIDTH / 2),
    )
    setAnchor(
      openDown
        ? { left, top: rect.bottom + EDGE_GAP }
        : { left, bottom: window.innerHeight - rect.top + EDGE_GAP },
    )
  }, [openDown])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return

    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return
      markPopoverDismiss(e)
      setOpen(false)
    }

    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('resize', place)
    window.addEventListener('orientationchange', place)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('orientationchange', place)
    }
  }, [open, place])

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
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

      {open &&
        anchor &&
        createPortal(
          // data-toolbar keeps the prompter's tap-to-play gesture off this panel
          <div
            ref={popRef}
            data-toolbar
            className="fixed z-50 rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl"
            style={{ left: anchor.left, top: anchor.top, bottom: anchor.bottom, width: POPOVER_WIDTH }}
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
          </div>,
          document.body,
        )}
    </div>
  )
}
