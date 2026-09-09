/**
 * A pointerdown that dismisses an open popover should do only that - without
 * this the same tap also reaches the prompter surface and starts playback.
 * Popovers listen in the capture phase, so the mark is always set before the
 * viewport's own handler runs.
 */
const dismissals = new WeakSet<Event>()

export function markPopoverDismiss(event: Event): void {
  dismissals.add(event)
}

export function dismissedPopover(event: Event): boolean {
  return dismissals.has(event)
}
