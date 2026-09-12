import type { GameState } from '../types'
import { formatChips } from '../utils/format'

interface TopBarProps {
  state: GameState
  onQuit: () => void
  onOpenTutorial?: () => void
}

const MODE_LABEL: Record<GameState['mode'], string> = {
  easy: 'Beginner · Poker Basics',
  medium: 'Proficient · Pot Odds',
  hard: 'Advanced · Kelly Criterion',
  characterize: 'Characterize Players · Opponent Profiling',
  unsupervised: 'Unsupervised · Free Play',
}

export function TopBar({ state, onQuit, onOpenTutorial }: TopBarProps) {
  const human = state.players[0]

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-3">
      <div className="flex items-center gap-3">
        <button onClick={onQuit} className="text-lg font-bold tracking-tight text-neutral-100 hover:text-emerald-300 cursor-pointer">
          PokerHouse
        </button>
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 cursor-pointer transition-colors"
          >
            How to Play (?)
          </button>
        )}
      </div>
      <div className="text-sm text-neutral-300 hidden sm:block">{MODE_LABEL[state.mode]}</div>
      <div className="flex items-center gap-4 text-sm text-neutral-300">
        <span>Hand #{state.handNumber}</span>
        <span>
          Record {state.handsWon}/{state.handsPlayed}
        </span>
        <span className="font-semibold text-emerald-300">{formatChips(human.stack)}</span>
      </div>
    </header>
  )
}
