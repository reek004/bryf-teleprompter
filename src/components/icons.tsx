const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      <path d="M8 5v14M16 5v14" />
    </svg>
  )
}

export function RewindIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      <path d="M19 5v14L8 12zM5 5v14" />
    </svg>
  )
}

export function AlignIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  const rows =
    align === 'left'
      ? ['M4 6h16', 'M4 10h10', 'M4 14h16', 'M4 18h10']
      : align === 'right'
        ? ['M4 6h16', 'M10 10h10', 'M4 14h16', 'M10 18h10']
        : ['M4 6h16', 'M7 10h10', 'M4 14h16', 'M7 18h10']
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      {rows.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

export function FlipXIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      <path d="M12 3v18" strokeDasharray="3 3" />
      <path d="M9 6H4v12h5z" />
      <path d="M15 6h5v12h-5z" />
    </svg>
  )
}

export function FlipYIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...stroke}>
      <path d="M3 12h18" strokeDasharray="3 3" />
      <path d="M6 9V4h12v5z" />
      <path d="M6 15v5h12v-5z" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...stroke}>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
    </svg>
  )
}

export function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      {[8, 12, 16].map((y) =>
        [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
      )}
    </svg>
  )
}
