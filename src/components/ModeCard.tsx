import type { GameMode } from '../types'

interface ModeCardProps {
  mode: GameMode
  title: string
  subtitle: string
  description: string
  onSelect: (mode: GameMode) => void
}

export function ModeCard({ mode, title, subtitle, description, onSelect }: ModeCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-6 text-left">
      <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">{title}</div>
      <div className="text-xl font-semibold text-neutral-100">{subtitle}</div>
      <p className="flex-1 text-sm text-neutral-400">{description}</p>
      <button
        onClick={() => onSelect(mode)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Start
      </button>
    </div>
  )
}
