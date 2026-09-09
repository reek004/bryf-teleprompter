interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export default function RangeControl({ label, value, min, max, step = 1, onChange }: Props) {
  return (
    <label className="flex w-32 shrink-0 flex-col items-center gap-0.5 sm:w-40">
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="text-[11px] leading-none text-neutral-300">{label}</span>
    </label>
  )
}
