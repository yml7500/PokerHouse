import type React from 'react'
import type { PlayerState } from '../types'
import { formatChips } from '../utils/format'
import { PlayingCard } from './PlayingCard'

interface SeatProps {
  player: PlayerState
  isActing: boolean
  revealCards: boolean
  isDealer?: boolean
  isSB?: boolean
  isBB?: boolean
  isSpotlighted?: boolean
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const ACTION_LABEL: Record<string, string> = {
  fold: 'Folded',
  check: 'Checked',
  call: 'Called',
  bet: 'Bet',
  raise: 'Raised',
  'all-in': 'All-in',
}

export function Seat({ player, isActing, revealCards, isDealer, isSB, isBB, isSpotlighted }: SeatProps) {
  const showCards = revealCards || player.isHuman

  let actionDisplay: React.ReactNode = null
  if (isActing) {
    actionDisplay = (
      <span className="font-semibold text-amber-300 animate-pulse">
        {player.isHuman ? 'Your turn' : 'Thinking…'}
      </span>
    )
  } else if (player.folded) {
    actionDisplay = 'Folded'
  } else if (!player.hasActed && player.currentBet > 0) {
    if (isSB) {
      actionDisplay = `Posted SB ${formatChips(player.currentBet)}`
    } else if (isBB) {
      actionDisplay = `Posted BB ${formatChips(player.currentBet)}`
    } else {
      actionDisplay = `Bet ${formatChips(player.currentBet)}`
    }
  } else if (player.lastAction) {
    actionDisplay = `${ACTION_LABEL[player.lastAction]}${
      player.lastActionAmount ? ` ${formatChips(player.lastActionAmount)}` : ''
    }`
  }

  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-all duration-300 ${
        isSpotlighted
          ? 'border-amber-400 bg-amber-500/25 shadow-2xl shadow-amber-400/50 ring-4 ring-amber-400 scale-110 z-30 animate-pulse'
          : isActing
          ? 'border-amber-400 bg-amber-400/15 shadow-lg shadow-amber-400/25 ring-2 ring-amber-400/50 scale-105 z-20'
          : 'border-white/15 bg-black/40 shadow-md backdrop-blur-xs'
      } ${player.folded && !isSpotlighted ? 'opacity-40' : ''}`}
    >
      {isSpotlighted && (
        <div className="absolute -bottom-3 flex items-center justify-center rounded-full border border-amber-300 bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-lg z-30">
          🎯 Profiling
        </div>
      )}
      {/* Dealer and Blind chip pucks */}
      <div className="absolute -top-3 -right-2 flex items-center gap-1 z-30">
        {isDealer && (
          <span
            title="Dealer Button (D): Action proceeds clockwise around the table. Shifts one seat clockwise every hand."
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-100 text-[11px] font-black text-slate-900 shadow-lg ring-1 ring-amber-400 select-none cursor-help"
          >
            D
          </span>
        )}
        {isSB && (
          <span
            title="Small Blind (SB): Forced bet of $10 posted before cards are dealt to seed the pot."
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-600 text-[10px] font-extrabold text-white shadow-lg ring-1 ring-black/40 select-none cursor-help"
          >
            SB
          </span>
        )}
        {isBB && (
          <span
            title="Big Blind (BB): Forced bet of $20 posted before cards are dealt to set the baseline bet."
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-800 bg-amber-500 text-[10px] font-black text-slate-950 shadow-lg ring-1 ring-amber-300 select-none cursor-help"
          >
            BB
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${
            player.isHuman ? 'bg-indigo-600 ring-1 ring-indigo-400' : 'bg-emerald-700 ring-1 ring-emerald-500'
          }`}
        >
          {initials(player.name)}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-neutral-100">{player.name}</div>
          <div className="text-xs text-neutral-400">{formatChips(player.stack)}</div>
        </div>
      </div>

      <div className="flex gap-1">
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => <PlayingCard key={i} card={card} faceDown={!showCards} size="sm" />)
        ) : (
          <>
            <PlayingCard size="sm" faceDown />
            <PlayingCard size="sm" faceDown />
          </>
        )}
      </div>

      <div className="h-4 text-[11px] font-medium text-neutral-300 truncate max-w-[140px] text-center">
        {actionDisplay}
      </div>
    </div>
  )
}
