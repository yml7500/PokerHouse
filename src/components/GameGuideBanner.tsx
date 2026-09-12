import { useState } from 'react'
import type { GameState } from '../types'
import { formatChips } from '../utils/format'

interface GameGuideBannerProps {
  state: GameState
}

export function GameGuideBanner({ state }: GameGuideBannerProps) {
  const [showTableGuide, setShowTableGuide] = useState(false)

  if (state.mode !== 'easy') return null

  const lastAction = state.actionLog.length > 0 ? state.actionLog[state.actionLog.length - 1] : undefined
  const lastPlayer = lastAction !== undefined ? state.players[lastAction.playerIndex] : undefined

  let stageTitle = ''
  let stageDescription = ''
  let stageBadge = ''

  if (state.street === 'preflop') {
    stageBadge = 'Pre-Flop'
    if (state.isBettingRoundOver) {
      stageTitle = 'Pre-Flop Betting Complete'
      stageDescription =
        'All active players have matched the current bet! Chips are locked into the pot. Next, the dealer will reveal the first 3 community cards (The Flop).'
    } else if (lastAction && lastPlayer) {
      if (lastAction.action === 'raise' || lastAction.action === 'bet') {
        stageTitle = `${lastPlayer.name} Raised to ${formatChips(state.currentBet)}!`
        stageDescription =
          'A raise increases the stakes. To stay in the hand, every active player must now either match this higher bet or fold.'
      } else if (lastAction.action === 'call') {
        stageTitle = `${lastPlayer.name} Called ${formatChips(lastAction.amount)}`
        stageDescription = 'Calling matches the current bet so the player can continue in the hand without raising.'
      } else if (lastAction.action === 'fold') {
        stageTitle = `${lastPlayer.name} Folded`
        stageDescription = 'Folding surrenders the player’s cards and removes them from this hand, saving the rest of their chips.'
      } else {
        stageTitle = 'Pre-Flop Betting in Progress'
        stageDescription =
          'Players take turns clockwise from the blinds. Each player decides whether to match the $20 Big Blind, raise, or fold.'
      }
    } else {
      stageTitle = 'Welcome to Texas Hold’em!'
      stageDescription =
        'You have been dealt 2 private hole cards. You and your 4 opponents compete for the pot using your hole cards plus 5 shared community cards.'
    }
  } else if (state.street === 'flop') {
    stageBadge = 'The Flop'
    if (state.isBettingRoundOver) {
      stageTitle = 'Flop Betting Complete'
      stageDescription = 'Flop betting is over! All bets are matched and locked in. The dealer is now dealing the 4th community card (The Turn).'
    } else {
      stageTitle = 'The Flop: 3 Community Cards'
      stageDescription =
        'The first 3 community cards are face-up in the center. Everyone at the table shares these cards! Combine them with your 2 hole cards to make your best 5-card hand.'
    }
  } else if (state.street === 'turn') {
    stageBadge = 'The Turn'
    if (state.isBettingRoundOver) {
      stageTitle = 'Turn Betting Complete'
      stageDescription = 'Turn betting is done! Heading to the final street: the 5th community card (The River).'
    } else {
      stageTitle = 'The Turn: 4th Community Card'
      stageDescription =
        'A 4th shared card is dealt. You now have 6 cards available (2 hole + 4 board) to form your best 5-card hand. Another betting round begins.'
    }
  } else if (state.street === 'river') {
    stageBadge = 'The River'
    if (state.isBettingRoundOver) {
      stageTitle = 'River Betting Complete'
      stageDescription = 'All betting rounds are finished! The remaining players now reveal their hole cards at Showdown.'
    } else {
      stageTitle = 'The River: 5th & Final Card'
      stageDescription =
        'The 5th and final community card is dealt. All 7 cards are available. This is the last chance to bet, call, or bluff before cards are shown!'
    }
  } else if (state.street === 'showdown') {
    stageBadge = 'Showdown'
    stageTitle = 'Showdown: Best 5-Card Hand Wins!'
    stageDescription =
      'All betting is finished. Active players reveal their hole cards, and the player with the highest-ranking 5-card hand wins the pot!'
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-lg backdrop-blur-xs">
      {/* Header bar with stage badge & guide toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
            {stageBadge}
          </span>
          <h3 className="text-sm font-bold text-neutral-100">{stageTitle}</h3>
        </div>
        <button
          onClick={() => setShowTableGuide((prev) => !prev)}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          {showTableGuide ? 'Hide Table Guide ▲' : 'Table & Chip Guide ▼'}
        </button>
      </div>

      {/* Live explanation */}
      <p className="text-xs sm:text-sm leading-relaxed text-neutral-300">{stageDescription}</p>

      {/* Collapsible table elements definitions */}
      {showTableGuide && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-neutral-300">
          <div className="rounded-lg bg-black/40 p-2 border border-white/5">
            <span className="font-bold text-amber-200">Dealer Button (D):</span> Dictates clockwise action order. The
            button shifts one seat clockwise every hand so table position is fair.
          </div>
          <div className="rounded-lg bg-black/40 p-2 border border-white/5">
            <span className="font-bold text-blue-300">Small Blind (SB $10) & Big Blind (BB $20):</span> Mandatory
            starting bets posted before cards are dealt so there are always chips to compete for.
          </div>
          <div className="rounded-lg bg-black/40 p-2 border border-white/5">
            <span className="font-bold text-amber-300">The Pot:</span> The central pile of chips accumulated from
            blinds, bets, and calls. The best hand at showdown (or last player standing) wins it all.
          </div>
          <div className="rounded-lg bg-black/40 p-2 border border-white/5">
            <span className="font-bold text-emerald-300">Hole Cards vs Community Cards:</span> Your 2 hole cards are
            secret to you. Community cards in the center are shared by everyone to make the best 5-card hand.
          </div>
        </div>
      )}
    </div>
  )
}
