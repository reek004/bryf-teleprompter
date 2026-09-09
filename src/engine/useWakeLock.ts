import { useEffect, useRef } from 'react'

type WakeLockSentinelLike = { release(): Promise<void>; released: boolean }

/**
 * Keeps the iPad awake while the script is rolling. Safari drops the lock the
 * moment the tab is backgrounded, so re-acquire on visibilitychange.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } }).wakeLock
    if (!wakeLock) return

    let cancelled = false

    const acquire = async () => {
      if (!active || document.visibilityState !== 'visible' || sentinelRef.current) return
      try {
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // denied (low battery, unsupported) - nothing to do about it
      }
    }

    const release = () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel && !sentinel.released) void sentinel.release()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
      else sentinelRef.current = null
    }

    if (active) void acquire()
    else release()

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      release()
    }
  }, [active])
}
