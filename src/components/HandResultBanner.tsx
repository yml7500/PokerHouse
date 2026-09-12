import type { GameState } from '../types'
import { formatChips } from '../utils/format'

interface HandResultBannerProps {
  state: GameState
  onNextHand: () => void
  buttonLabel?: string
  subtitle?: string
}

export function HandResultBanner({ state, onNextHand, buttonLabel, subtitle }: HandResultBannerProps) {
  if (!state.isHandOver || !state.handResult) return null

  const { winners, amountWon, handDescriptions } = state.handResult
  const winnerNames = winners.map((i) => state.players[i].name).join(' & ')
  const description = handDescriptions[winners[0]]
  const humanWon = winners.includes(0)

  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-amber-400/40 bg-black/60 p-4 text-center">
      <div className={`text-base sm:text-lg font-bold ${humanWon ? 'text-emerald-300' : 'text-amber-200'}`}>
        {winnerNames} won {formatChips(amountWon)}
        {description ? ` with ${description}` : ' (others folded)'}
      </div>
      {subtitle && <div className="text-xs text-neutral-300">{subtitle}</div>}
      <button
        onClick={onNextHand}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 cursor-pointer transition-colors"
      >
        {buttonLabel ?? 'Next Hand'}
      </button>
    </div>
  )
}
