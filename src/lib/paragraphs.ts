export interface ParaBox {
  top: number
  bottom: number
}

/**
 * Paragraph boxes in *content-local* coordinates. `.prompter-content` is
 * `position: relative`, so children report offsetTop against it and the mirror
 * transforms above it never distort these numbers.
 */
export function measureParagraphs(content: HTMLElement): ParaBox[] {
  const boxes: ParaBox[] = []
  for (const child of Array.from(content.children) as HTMLElement[]) {
    if (child.offsetHeight === 0) continue
    boxes.push({ top: child.offsetTop, bottom: child.offsetTop + child.offsetHeight })
  }
  return boxes
}

/**
 * Where each paragraph's leading edge sits once the mirror layer has been
 * applied, sorted top to bottom. With flipY the block is reflected about its
 * centre, so a paragraph's visual top comes from its local *bottom*.
 */
export function visualTops(boxes: ParaBox[], contentHeight: number, flipY: boolean): number[] {
  const tops = flipY ? boxes.map((b) => contentHeight - b.bottom) : boxes.map((b) => b.top)
  return tops.sort((a, b) => a - b)
}
