import { useRef, useState } from 'react'
import { SETTING_LIMITS } from '../state/defaults'
import { usePrompter } from '../state/PrompterContext'
import ColorControl from './ColorControl'
import ImportButton from './ImportButton'
import RangeControl from './RangeControl'
import ToolbarButton from './ToolbarButton'
import {
  AlignIcon,
  FlipXIcon,
  FlipYIcon,
  GripIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RewindIcon,
} from './icons'

interface Props {
  onRewind: () => void
}

export default function Toolbar({ onRewind }: Props) {
  const { state, dispatch } = usePrompter()
  const { settings, playing } = state
  const barRef = useRef<HTMLDivElement | null>(null)
  const grabOffset = useRef(0)
  const [dragTop, setDragTop] = useState<number | null>(null)

  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    dispatch({ type: 'SET_SETTING', key, value })

  // Grip drags the whole bar between the top and bottom edge.
  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect) return
    grabOffset.current = e.clientY - rect.top
    setDragTop(rect.top)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const moveDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragTop === null) return
    const height = barRef.current?.offsetHeight ?? 0
    const next = Math.min(
      window.innerHeight - height,
      Math.max(0, e.clientY - grabOffset.current),
    )
    setDragTop(next)
  }

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragTop === null) return
    const height = barRef.current?.offsetHeight ?? 0
    set('toolbarSide', dragTop + height / 2 < window.innerHeight / 2 ? 'top' : 'bottom')
    setDragTop(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const docked = settings.toolbarSide
  const position =
    dragTop !== null
      ? { top: `${dragTop}px` }
      : docked === 'top'
        ? { top: 0 }
        : { bottom: 0 }

  return (
    <div
      ref={barRef}
      data-toolbar
      className="fixed inset-x-0 z-10 border-neutral-800 bg-neutral-950/95 backdrop-blur"
      style={{
        ...position,
        paddingTop: docked === 'top' ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: docked === 'bottom' ? 'env(safe-area-inset-bottom)' : undefined,
        borderBottomWidth: docked === 'top' ? 1 : 0,
        borderTopWidth: docked === 'bottom' ? 1 : 0,
      }}
    >
      <div className="overflow-x-auto px-2 py-1.5 sm:px-3">
        {/* w-max + mx-auto centres the row when it fits and still scrolls cleanly when it does not */}
        <div className="mx-auto flex w-max items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Move toolbar"
            title="Drag to move the toolbar"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-500 active:cursor-grabbing"
          >
            <GripIcon />
          </button>

          <ToolbarButton
            label={playing ? 'Pause' : 'Play'}
            onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </ToolbarButton>

          <ToolbarButton label="Back to start" onClick={onRewind}>
            <RewindIcon />
          </ToolbarButton>

          <ToolbarButton
            label={`Align: ${settings.align}`}
            onClick={() => dispatch({ type: 'CYCLE_ALIGN' })}
          >
            <AlignIcon align={settings.align} />
          </ToolbarButton>

          <ToolbarButton
            label="Mirror left/right"
            active={settings.flipX}
            onClick={() => dispatch({ type: 'TOGGLE_FLIP_X' })}
          >
            <FlipXIcon />
          </ToolbarButton>

          <ToolbarButton
            label="Mirror top/bottom"
            active={settings.flipY}
            onClick={() => dispatch({ type: 'TOGGLE_FLIP_Y' })}
          >
            <FlipYIcon />
          </ToolbarButton>

          <ColorControl
            label="Background color"
            value={settings.bgColor}
            openDown={docked === 'top'}
            onChange={(v) => set('bgColor', v)}
          />
          <ColorControl
            label="Text color"
            value={settings.textColor}
            openDown={docked === 'top'}
            onChange={(v) => set('textColor', v)}
          />

          <RangeControl
            label={`Text size: ${settings.fontSize}px`}
            value={settings.fontSize}
            {...SETTING_LIMITS.fontSize}
            onChange={(v) => set('fontSize', v)}
          />
          <RangeControl
            label={`Margin: ${settings.margin}%`}
            value={settings.margin}
            {...SETTING_LIMITS.margin}
            onChange={(v) => set('margin', v)}
          />
          <RangeControl
            label={`Speed: ${settings.speed}`}
            value={settings.speed}
            {...SETTING_LIMITS.speed}
            onChange={(v) => set('speed', v)}
          />

          <ImportButton
            onImported={(html, name) => dispatch({ type: 'SET_SCRIPT', html, name })}
            onError={(message) => dispatch({ type: 'TOAST', message })}
          />

          <ToolbarButton
            label="Edit script"
            onClick={() => dispatch({ type: 'SET_EDITOR_OPEN', open: true })}
          >
            <PencilIcon />
          </ToolbarButton>
        </div>
      </div>
    </div>
  )
}
