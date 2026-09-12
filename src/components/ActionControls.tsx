import { useMemo, useState, type Dispatch } from 'react'
import type { DecisionSnapshot, GameState, PlayerAction } from '../types'
import { activePlayersRemaining, callAmount, legalActions } from '../engine/betting'
import { estimateEquity } from '../engine/equity'
import { requiredEquity } from '../engine/potOdds'
import { netOddsForCall, recommendedKelly } from '../engine/kelly'
import { evaluateHand } from '../engine/handEvaluator'
import { formatChips, formatPercent } from '../utils/format'
import { BetSlider } from './BetSlider'
import type { GameEngineAction } from '../engine/gameEngine'

interface ActionControlsProps {
  state: GameState
  dispatch: Dispatch<GameEngineAction>
  onOpenGuide?: () => void
}

export function ActionControls({ state, dispatch, onOpenGuide }: ActionControlsProps) {
  const human = state.players[0]
  const isHumanTurn = state.actingIndex === 0 && !state.isHandOver && !state.isBettingRoundOver

  const callAmt = callAmount(human, state.currentBet)
  const legal = legalActions(human, state.currentBet)

  const equity = useMemo(() => {
    if (!isHumanTurn) return 0
    const numOpponents = activePlayersRemaining(state.players) - 1
    return estimateEquity(human.holeCards, state.communityCards, numOpponents)
  }, [isHumanTurn, human.holeCards, state.communityCards, state.players])

  const reqEquity = requiredEquity(state.pot, callAmt)

  const minRaiseTotal = Math.min(state.currentBet + state.minRaise, human.currentBet + human.stack)
  const maxTotal = human.currentBet + human.stack
  const [betTotal, setBetTotal] = useState(minRaiseTotal)

  const [prevStreet, setPrevStreet] = useState(state.street)
  const [prevCurrentBet, setPrevCurrentBet] = useState(state.currentBet)

  // React official pattern: adjust state during render when props change
  if (state.street !== prevStreet || state.currentBet !== prevCurrentBet) {
    setPrevStreet(state.street)
    setPrevCurrentBet(state.currentBet)
    setBetTotal(minRaiseTotal)
  }

  const effectiveBetTotal = Math.min(Math.max(betTotal, minRaiseTotal), maxTotal)

  if (!isHumanTurn) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-sm text-neutral-400">
        Waiting for other players…
      </div>
    )
  }

  function buildSnapshot(action: PlayerAction, amount: number): DecisionSnapshot {
    const handDescription = human.holeCards.length
      ? evaluateHand([...human.holeCards, ...state.communityCards]).descr
      : undefined

    const snapshot: DecisionSnapshot = {
      playerIndex: 0,
      street: state.street,
      potBeforeAction: state.pot,
      callAmount: callAmt,
      requiredEquity: reqEquity,
      estimatedEquity: equity,
      bankroll: human.stack + human.currentBet,
      action,
      amount,
      handDescription,
      heroCards: human.holeCards,
      boardAtDecision: state.communityCards,
    }

    if (state.mode === 'hard') {
      const b = netOddsForCall(state.pot, Math.max(callAmt, state.minRaise))
      const kelly = recommendedKelly(equity, Math.max(b, 0.01), human.stack + human.currentBet)
      snapshot.kelly = {
        p: equity,
        b: Math.max(b, 0.01),
        rawKelly: kelly.rawKelly,
        fullKelly: kelly.fullKelly,
        recommendedFraction: kelly.recommendedFraction,
        recommendedAmount: kelly.recommendedAmount,
      }
    }

    return snapshot
  }

  function act(action: PlayerAction, amount: number) {
    dispatch({ type: 'APPLY_ACTION', playerIndex: 0, action, amount, snapshot: buildSnapshot(action, amount) })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
      {state.mode === 'medium' && callAmt > 0 && (
        <div
          id="tutorial-target-pot-odds-bar"
          className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-100 flex items-center justify-between flex-wrap gap-2"
        >
          <span>POT: {formatChips(state.pot)} · CALL: {formatChips(callAmt)}</span>
          <span className="font-semibold text-sky-300">REQUIRED EQUITY: {formatPercent(reqEquity)}</span>
        </div>
      )}

      {state.mode === 'hard' && (
        <div
          id="tutorial-target-kelly-bar"
          className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs text-violet-100 flex items-center justify-between flex-wrap gap-2"
        >
          <span>BANKROLL: {formatChips(human.stack + human.currentBet)} · POT: {formatChips(state.pot)} · CALL: {formatChips(callAmt)}</span>
          <span className="font-semibold text-violet-300">
            NET ODDS (b): {netOddsForCall(state.pot, Math.max(callAmt, state.minRaise)).toFixed(2)} : 1
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          id="tutorial-target-fold"
          onClick={() => act('fold', 0)}
          disabled={!legal.includes('fold')}
          className="flex flex-col items-center rounded-lg bg-rose-700 px-4 py-2 font-semibold text-white disabled:opacity-30 cursor-pointer"
          title="Fold: Surrender your cards and forfeit the pot without risking more chips"
        >
          <span className="text-sm">Fold</span>
          {state.mode === 'easy' && <span className="text-[10px] font-normal opacity-85">Drop cards ($0)</span>}
        </button>

        {legal.includes('check') && (
          <button
            id="tutorial-target-call"
            onClick={() => act('check', 0)}
            className="flex flex-col items-center rounded-lg bg-neutral-700 px-4 py-2 font-semibold text-white cursor-pointer hover:bg-neutral-600 transition-colors"
            title="Check: Pass action to the next player without betting chips"
          >
            <span className="text-sm">Check</span>
            {state.mode === 'easy' && <span className="text-[10px] font-normal opacity-85">Pass turn ($0)</span>}
          </button>
        )}

        {legal.includes('call') && (
          <button
            id="tutorial-target-call"
            onClick={() => act('call', callAmt)}
            className="flex flex-col items-center rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white cursor-pointer hover:bg-emerald-600 transition-colors"
            title={`Call: Match the current bet of ${formatChips(callAmt)} to stay in the hand`}
          >
            <span className="text-sm">Call {formatChips(callAmt)}</span>
            {state.mode === 'easy' && <span className="text-[10px] font-normal opacity-85">Match bet</span>}
          </button>
        )}

        {(legal.includes('bet') || legal.includes('raise')) && (
          <button
            id="tutorial-target-raise"
            onClick={() => act(state.currentBet === 0 ? 'bet' : 'raise', effectiveBetTotal - human.currentBet)}
            className="flex flex-col items-center rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white cursor-pointer hover:bg-amber-500 transition-colors"
            title="Bet / Raise: Increase the wager amount, forcing players after you to call or fold"
          >
            <span className="text-sm">
              {state.currentBet === 0 ? 'Bet' : 'Raise to'} {formatChips(effectiveBetTotal)}
            </span>
            {state.mode === 'easy' && (
              <span className="text-[10px] font-normal opacity-85">
                {state.currentBet === 0 ? 'Start the betting' : 'Increase stakes'}
              </span>
            )}
          </button>
        )}

        {(legal.includes('bet') || legal.includes('raise')) && (
          <button
            id="tutorial-target-allin"
            onClick={() => act('all-in', human.stack)}
            className="flex flex-col items-center rounded-lg bg-fuchsia-700 px-4 py-2 font-semibold text-white cursor-pointer hover:bg-fuchsia-600 transition-colors"
            title="All-in: Risk all of your remaining chips in this pot"
          >
            <span className="text-sm">All-in</span>
            {state.mode === 'easy' && <span className="text-[10px] font-normal opacity-85">Wager all chips</span>}
          </button>
        )}

        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className={`ml-auto flex flex-col items-center rounded-lg border px-3.5 py-2 font-semibold transition-colors cursor-pointer ${
              state.mode === 'hard'
                ? 'border-violet-500/50 bg-violet-950/40 text-violet-300 hover:bg-violet-900/60'
                : state.mode === 'medium'
                ? 'border-sky-500/50 bg-sky-950/40 text-sky-300 hover:bg-sky-900/60'
                : 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
            }`}
            title={
              state.mode === 'hard'
                ? 'Review Kelly Criterion and optimal bet sizing pointers'
                : state.mode === 'medium'
                ? 'Review Pot Odds and Required Equity pointers'
                : 'Review game rules and action button pointers'
            }
          >
            <span className="text-sm">
              {state.mode === 'hard'
                ? 'Kelly Guide (?)'
                : state.mode === 'medium'
                ? 'Pot Odds Guide (?)'
                : 'Tutorial (?)'}
            </span>
            <span className="text-[10px] font-normal opacity-85">
              {state.mode === 'hard' ? 'Review equation' : state.mode === 'medium' ? 'Review formula' : 'How to play'}
            </span>
          </button>
        )}
      </div>

      {(legal.includes('bet') || legal.includes('raise')) && (
        <BetSlider min={minRaiseTotal} max={maxTotal} value={effectiveBetTotal} onChange={setBetTotal} />
      )}
    </div>
  )
}
