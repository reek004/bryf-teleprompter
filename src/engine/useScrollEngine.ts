import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import type { Settings } from '../state/types'

/** Reading line, as a fraction of viewport height from the top. */
export const EYE_LINE = 0.35

export interface ScrollEngine {
  getOffset(): number
  getMaxScroll(): number
  /** Immediately move to an absolute offset (clamped). */
  setOffset(next: number): void
  /** Move by a delta in screen pixels (clamped). */
  nudge(delta: number): void
  /** Ease to an absolute offset over `ms`. */
  animateTo(target: number, ms?: number): void
  /** Back to the first line, respecting flipY direction. */
  rewind(): void
  /** Hold auto-advance while the operator drags, without leaving play mode. */
  beginScrub(): void
  endScrub(): void
  remeasure(): void
}

interface Options {
  viewportRef: MutableRefObject<HTMLDivElement | null>
  scrollerRef: MutableRefObject<HTMLDivElement | null>
  contentRef: MutableRefObject<HTMLDivElement | null>
  settings: Settings
  playing: boolean
  onReachEnd: () => void
}

/**
 * rAF + translate3d scroller. Deliberately not `scrollTop`: on iOS Safari
 * native scrolling fights momentum and rubber-band, while a transform stays
 * GPU-composited and reads back exactly what we wrote.
 *
 * The live offset lives in a ref, never in React state - a setState per frame
 * at 60fps would re-render the whole script on every tick.
 */
export function useScrollEngine({
  viewportRef,
  scrollerRef,
  contentRef,
  settings,
  playing,
  onReachEnd,
}: Options): ScrollEngine {
  const offsetRef = useRef(0)
  const maxScrollRef = useRef(0)
  const settingsRef = useRef(settings)
  const playingRef = useRef(playing)
  const onReachEndRef = useRef(onReachEnd)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef(0)
  const animRef = useRef<{ from: number; to: number; start: number; ms: number } | null>(null)
  const scrubRef = useRef(false)
  const prevFlipYRef = useRef(settings.flipY)

  settingsRef.current = settings
  playingRef.current = playing
  onReachEndRef.current = onReachEnd

  const apply = useCallback(() => {
    const scroller = scrollerRef.current
    if (scroller) {
      scroller.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`
    }
  }, [scrollerRef])

  const clamp = useCallback((n: number) => Math.min(maxScrollRef.current, Math.max(0, n)), [])

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const prevMax = maxScrollRef.current
    // Reading progress, so a rotation or a font-size change keeps your place.
    const progress =
      prevMax > 0
        ? settingsRef.current.flipY
          ? (prevMax - offsetRef.current) / prevMax
          : offsetRef.current / prevMax
        : 0

    maxScrollRef.current = Math.max(0, content.offsetHeight - viewport.clientHeight)
    const max = maxScrollRef.current
    offsetRef.current = clamp(settingsRef.current.flipY ? max * (1 - progress) : max * progress)
    apply()
  }, [apply, clamp, contentRef, viewportRef])

  const tick = useCallback(
    (ts: number) => {
      rafRef.current = null
      const dt = lastTsRef.current ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0
      lastTsRef.current = ts

      const anim = animRef.current
      if (anim) {
        const t = anim.ms <= 0 ? 1 : Math.min(1, (ts - anim.start) / anim.ms)
        const eased = 1 - Math.pow(1 - t, 3)
        offsetRef.current = anim.from + (anim.to - anim.from) * eased
        if (t >= 1) animRef.current = null
        apply()
      } else if (playingRef.current && !scrubRef.current) {
        const { speed, fontSize, flipY } = settingsRef.current
        // Tie speed to font size so "50" reads at the same pace at any size.
        // 3.6 puts speed 50 @ 30px at ~108 px/s - a natural read-aloud pace.
        const pxPerSec = (speed / 50) * fontSize * 3.6
        const dir = flipY ? -1 : 1
        const next = offsetRef.current + dir * pxPerSec * dt
        const max = maxScrollRef.current

        if (dir > 0 ? next >= max : next <= 0) {
          offsetRef.current = dir > 0 ? max : 0
          apply()
          onReachEndRef.current()
          return
        }
        offsetRef.current = next
        apply()
      }

      if (animRef.current || playingRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        lastTsRef.current = 0
      }
    },
    [apply],
  )

  const ensureLoop = useCallback(() => {
    if (rafRef.current === null) {
      lastTsRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Start/stop the loop with playback.
  useEffect(() => {
    if (playing) ensureLoop()
  }, [playing, ensureLoop])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Re-measure whenever the content box or the viewport changes size.
  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(content)
    ro.observe(viewport)
    window.addEventListener('orientationchange', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', measure)
    }
  }, [measure, viewportRef, contentRef])

  // Flipping vertically reflects the block, so reflect the offset too and the
  // line you were reading stays put.
  useEffect(() => {
    if (prevFlipYRef.current !== settings.flipY) {
      prevFlipYRef.current = settings.flipY
      offsetRef.current = clamp(maxScrollRef.current - offsetRef.current)
      apply()
    }
  }, [settings.flipY, apply, clamp])

  return useMemo<ScrollEngine>(
    () => ({
      getOffset: () => offsetRef.current,
      getMaxScroll: () => maxScrollRef.current,
      setOffset(next) {
        animRef.current = null
        offsetRef.current = clamp(next)
        apply()
      },
      nudge(delta) {
        animRef.current = null
        offsetRef.current = clamp(offsetRef.current + delta)
        apply()
      },
      animateTo(target, ms = 250) {
        animRef.current = {
          from: offsetRef.current,
          to: clamp(target),
          start: performance.now(),
          ms,
        }
        ensureLoop()
      },
      beginScrub() {
        animRef.current = null
        scrubRef.current = true
      },
      endScrub() {
        scrubRef.current = false
        // playback was never stopped, so the loop is still running
        ensureLoop()
      },
      rewind() {
        animRef.current = null
        offsetRef.current = settingsRef.current.flipY ? maxScrollRef.current : 0
        apply()
      },
      remeasure: measure,
    }),
    [apply, clamp, ensureLoop, measure],
  )
}
