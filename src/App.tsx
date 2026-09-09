import { useCallback, useEffect, useRef } from 'react'
import PrompterView from './components/PrompterView'
import ScriptEditor from './components/ScriptEditor'
import Toolbar from './components/Toolbar'
import { useGestures, type DragStart } from './engine/useGestures'
import { EYE_LINE, useScrollEngine } from './engine/useScrollEngine'
import { useWakeLock } from './engine/useWakeLock'
import { measureParagraphs, visualTops } from './lib/paragraphs'
import { PrompterProvider, usePrompter } from './state/PrompterContext'

function Prompter() {
  const { state, dispatch } = usePrompter()
  const { settings, script, playing, editorOpen, toast } = state

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const onReachEnd = useCallback(
    () => dispatch({ type: 'SET_PLAYING', playing: false }),
    [dispatch],
  )

  const engine = useScrollEngine({
    viewportRef,
    scrollerRef,
    contentRef,
    settings,
    playing,
    onReachEnd,
  })

  useWakeLock(playing)

  // A new script starts from the first line.
  useEffect(() => {
    engine.remeasure()
    engine.rewind()
  }, [script.html, engine])

  const jumpParagraph = useCallback(
    (dir: 1 | -1) => {
      const content = contentRef.current
      const viewport = viewportRef.current
      if (!content || !viewport) return

      const tops = visualTops(
        measureParagraphs(content),
        content.offsetHeight,
        settings.flipY,
      )
      const eye = viewport.clientHeight * EYE_LINE
      const current = engine.getOffset() + eye
      // With flipY the script advances upward on screen, so "forward" walks
      // the visual list backwards.
      const forwardIsDown = !settings.flipY
      const searchDown = dir === 1 ? forwardIsDown : !forwardIsDown

      const target = searchDown
        ? tops.find((t) => t > current + 4)
        : [...tops].reverse().find((t) => t < current - 4)

      if (target === undefined) return
      engine.animateTo(target - eye)
    },
    [engine, settings.flipY],
  )

  const getContext = useCallback((): DragStart => ({ offset: engine.getOffset() }), [engine])

  // Dragging always moves the script, playing or not: auto-advance is held for
  // the length of the drag and picks up again from wherever you let go.
  // Direct manipulation of what is on the iPad screen - the scroller translates
  // in screen space, so this holds for every mirror mode.
  const onDrag = useCallback(
    (dy: number, start: DragStart) => engine.setOffset(start.offset - dy),
    [engine],
  )

  useGestures({
    elementRef: viewportRef,
    onTap: () => dispatch({ type: 'TOGGLE_PLAY' }),
    onDragStart: engine.beginScrub,
    onDrag,
    // finger velocity is screen-space; the offset moves the other way
    onDragEnd: (velocity) => engine.endScrub(-velocity),
    onWheel: engine.wheel,
    onTwoFingerSwipe: jumpParagraph,
    getContext,
  })

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => dispatch({ type: 'TOAST', message: null }), 3500)
    return () => clearTimeout(id)
  }, [toast, dispatch])

  return (
    <div className="relative h-full w-full">
      <PrompterView
        viewportRef={viewportRef}
        scrollerRef={scrollerRef}
        contentRef={contentRef}
        settings={settings}
        script={script}
      />

      <Toolbar
        onRewind={() => {
          dispatch({ type: 'SET_PLAYING', playing: false })
          engine.rewind()
        }}
      />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <p className="rounded-lg bg-red-600/95 px-4 py-2 text-sm text-white shadow-lg">{toast}</p>
        </div>
      )}

      {editorOpen && <ScriptEditor />}
    </div>
  )
}

export default function App() {
  return (
    <PrompterProvider>
      <Prompter />
    </PrompterProvider>
  )
}
