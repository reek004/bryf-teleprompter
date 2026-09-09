import { useEffect, useRef, type MutableRefObject } from 'react'
import { dismissedPopover } from '../lib/popover'

export interface DragStart {
  /** scroll offset captured when the drag began */
  offset: number
}

interface Options {
  elementRef: MutableRefObject<HTMLElement | null>
  /** Short press with no travel. */
  onTap: () => void
  /** fires once, when a press turns into a drag */
  onDragStart: () => void
  /** dy is total travel since the drag started (negative = finger moved up). */
  onDrag: (dy: number, start: DragStart) => void
  /** fires when that drag lets go; velocity is the finger's px/sec at release */
  onDragEnd: (velocity: number) => void
  /** wheel / trackpad scrolling, in scroll-offset pixels */
  onWheel: (delta: number) => void
  /** 1 = forward one paragraph, -1 = back one. */
  onTwoFingerSwipe: (dir: 1 | -1) => void
  getContext: () => DragStart
}

const TAP_SLOP = 10
const TAP_MS = 300
const SWIPE_THRESHOLD = 40
const VELOCITY_WINDOW_MS = 80

/**
 * Touch driving for the prompter surface. Pointer Events cover finger, pencil
 * and mouse in one path; the viewport sets `touch-action: none` so Safari
 * never steals a drag for its own scrolling.
 */
export function useGestures({
  elementRef,
  onTap,
  onDragStart,
  onDrag,
  onDragEnd,
  onWheel,
  onTwoFingerSwipe,
  getContext,
}: Options): void {
  const cb = useRef({ onTap, onDragStart, onDrag, onDragEnd, onWheel, onTwoFingerSwipe, getContext })
  cb.current = { onTap, onDragStart, onDrag, onDragEnd, onWheel, onTwoFingerSwipe, getContext }

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const points = new Map<number, { x: number; y: number }>()
    let startY = 0
    let startX = 0
    let startTime = 0
    let start: DragStart | null = null
    let moved = false
    let mode: 'none' | 'single' | 'two' = 'none'
    let swipeBaseY = 0
    let swipeFired = false
    // recent (time, y) samples, for the release velocity of a flick
    let samples: { t: number; y: number }[] = []

    const velocity = () => {
      if (samples.length < 2) return 0
      const last = samples[samples.length - 1]
      const first = samples.find((s) => last.t - s.t < VELOCITY_WINDOW_MS) ?? samples[0]
      const dt = last.t - first.t
      return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0
    }

    const avgY = () => {
      let sum = 0
      for (const p of points.values()) sum += p.y
      return sum / points.size
    }

    const reset = () => {
      mode = 'none'
      moved = false
      swipeFired = false
      start = null
      samples = []
    }

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('[data-toolbar]')) return
      // this tap only closed a popover - it is not a play/pause tap
      if (dismissedPopover(e)) return
      points.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture(e.pointerId)

      if (points.size === 1) {
        mode = 'single'
        moved = false
        startX = e.clientX
        startY = e.clientY
        startTime = e.timeStamp
        start = cb.current.getContext()
        samples = [{ t: e.timeStamp, y: e.clientY }]
      } else if (points.size === 2) {
        // A second finger cancels whatever the first one was doing.
        if (mode === 'single' && moved) cb.current.onDragEnd(0)
        mode = 'two'
        moved = true
        swipeFired = false
        swipeBaseY = avgY()
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const p = points.get(e.pointerId)
      if (!p) return
      p.x = e.clientX
      p.y = e.clientY

      if (mode === 'two') {
        if (swipeFired) return
        const dy = avgY() - swipeBaseY
        if (Math.abs(dy) > SWIPE_THRESHOLD) {
          swipeFired = true
          // Swipe up = push the script forward.
          cb.current.onTwoFingerSwipe(dy < 0 ? 1 : -1)
        }
        return
      }

      if (mode !== 'single' || !start) return
      samples.push({ t: e.timeStamp, y: e.clientY })
      if (samples.length > 12) samples.shift()
      const dy = e.clientY - startY
      if (!moved && Math.hypot(e.clientX - startX, dy) > TAP_SLOP) {
        moved = true
        cb.current.onDragStart()
      }
      if (moved) cb.current.onDrag(dy, start)
    }

    const endPointer = (e: PointerEvent) => {
      if (!points.has(e.pointerId)) return
      points.delete(e.pointerId)
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)

      if (points.size > 0) return

      if (mode === 'single') {
        if (moved) cb.current.onDragEnd(velocity())
        else if (e.timeStamp - startTime < TAP_MS) cb.current.onTap()
      }
      reset()
    }

    const onWheelEvent = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest('[data-toolbar]')) return
      e.preventDefault()
      // DOM_DELTA_LINE / _PAGE come from mouse wheels and older browsers
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      cb.current.onWheel(e.deltaY * scale)
    }

    el.addEventListener('wheel', onWheelEvent, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', endPointer)
    el.addEventListener('pointercancel', endPointer)

    return () => {
      el.removeEventListener('wheel', onWheelEvent)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', endPointer)
      el.removeEventListener('pointercancel', endPointer)
    }
  }, [elementRef])
}
