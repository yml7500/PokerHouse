import type { GameState } from '../types'
import { CommunityCards } from './CommunityCards'
import { PotDisplay } from './PotDisplay'
import { Seat } from './Seat'

const SEAT_POSITIONS = [
  { top: '83%', left: '50%' }, // Seat 0: Human (Bottom Center)
  { top: '58%', left: '10%' }, // Seat 1: Lower-Left
  { top: '14%', left: '25%' }, // Seat 2: Top-Left
  { top: '14%', left: '75%' }, // Seat 3: Top-Right
  { top: '58%', left: '90%' }, // Seat 4: Lower-Right
]

interface PokerTableProps {
  state: GameState
  spotlightSeatIndex?: number
}

export function PokerTable({ state, spotlightSeatIndex }: PokerTableProps) {
  const isShowdown = state.street === 'showdown'
  const isActingActive = !state.isHandOver && !state.isBettingRoundOver

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-3xl rounded-[999px] border-8 border-neutral-800 bg-gradient-to-b from-emerald-800 to-emerald-900 shadow-2xl">
      {state.players.map((player, i) => {
        // Folded players never show cards at showdown in non-beginner modes (medium, hard, characterize)
        const revealCards = isShowdown && (state.mode === 'easy' || !player.folded)

        return (
          <div
            key={player.id}
            id={i === 0 ? 'tutorial-target-hero' : undefined}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={SEAT_POSITIONS[i]}
          >
            <Seat
              player={player}
              isActing={isActingActive && state.actingIndex === i}
              revealCards={revealCards}
              isDealer={state.dealerIndex === i}
              isSB={state.sbIndex === i}
              isBB={state.bbIndex === i}
              isSpotlighted={spotlightSeatIndex === i}
            />
          </div>
        )
      })}

      <div
        id="tutorial-target-pot"
        className="absolute top-[47%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-2xl p-2 transition-all"
      >
        <CommunityCards cards={state.communityCards} />
        <PotDisplay pot={state.handResult ? state.handResult.amountWon : state.pot} />
      </div>
    </div>
  )
}
