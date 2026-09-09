import type { MutableRefObject } from 'react'
import type { ScriptDoc, Settings } from '../state/types'

interface Props {
  viewportRef: MutableRefObject<HTMLDivElement | null>
  scrollerRef: MutableRefObject<HTMLDivElement | null>
  contentRef: MutableRefObject<HTMLDivElement | null>
  settings: Settings
  script: ScriptDoc
}

/**
 * viewport (clips, owns gestures)
 *  └ scroller (translate3d in *screen* space)
 *     └ mirror  (scaleX/scaleY, flips the block in place)
 *        └ content (typography + margins)
 */
export default function PrompterView({
  viewportRef,
  scrollerRef,
  contentRef,
  settings,
  script,
}: Props) {
  const { flipX, flipY, margin, fontSize, textColor, bgColor, align, lineHeight } = settings

  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 overflow-hidden touch-none select-none"
      style={{ background: bgColor }}
    >
      <div ref={scrollerRef} className="will-change-transform">
        <div style={{ transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` }}>
          <div
            ref={contentRef}
            className="prompter-content relative"
            style={{
              paddingBlock: '50dvh',
              paddingInline: `${margin}%`,
              fontSize: `${fontSize}px`,
              lineHeight,
              color: textColor,
              textAlign: align,
            }}
            dangerouslySetInnerHTML={{ __html: script.html }}
          />
        </div>
      </div>
    </div>
  )
}
