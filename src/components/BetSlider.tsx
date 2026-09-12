import { formatChips } from '../utils/format'

interface BetSliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}

export function BetSlider({ min, max, value, onChange }: BetSliderProps) {
  if (max <= min) return null

  return (
    <div className="flex w-full items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={Math.max(1, Math.round((max - min) / 100))}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 accent-amber-400"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-24 rounded-md border border-white/20 bg-black/30 px-2 py-1 text-right text-sm text-neutral-100"
      />
      <span className="text-xs text-neutral-400">{formatChips(max)} max</span>
    </div>
  )
}
