import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  label: string
  children: ReactNode
}

export default function ToolbarButton({ active = false, label, children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-11 min-w-11 items-center justify-center rounded-lg px-2 transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-neutral-200 active:bg-neutral-700'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}
