import { formatChips } from '../utils/format'

export function PotDisplay({ pot }: { pot: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-full border border-amber-400/30 bg-black/40 px-5 py-2">
      <span className="text-[11px] uppercase tracking-wide text-amber-300/80">Pot</span>
      <span className="text-lg font-bold text-amber-200">{formatChips(pot)}</span>
    </div>
  )
}
