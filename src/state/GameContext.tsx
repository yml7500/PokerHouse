import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react'
import type { GameMode, GameState } from '../types'
import { BIG_BLIND, createInitialState, gameReducer, type GameEngineAction } from '../engine/gameEngine'
import { activePlayersRemaining } from '../engine/betting'
import { estimateEquity } from '../engine/equity'
import { requiredEquity } from '../engine/potOdds'
import { decideAIAction } from '../engine/ai'

interface GameContextValue {
  state: GameState
  dispatch: Dispatch<GameEngineAction>
}

const GameContext = createContext<GameContextValue | null>(null)

const AI_ACTION_DELAY_MS = 2100
const STREET_ADVANCE_DELAY_MS = 1500

export function GameProvider({ mode, children }: { mode: GameMode; children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, mode, createInitialState)
  const isProcessingRef = useRef(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    dispatch({ type: 'START_HAND' })
  }, [])

  useEffect(() => {
    if (state.isHandOver || state.isBettingRoundOver) return
    if (isProcessingRef.current) return

    const acting = state.players[state.actingIndex]
    if (!acting || acting.isHuman || acting.folded || acting.allIn) return

    isProcessingRef.current = true
    const timer = setTimeout(
      () => {
        const numOpponents = activePlayersRemaining(state.players) - 1
        const equity = estimateEquity(acting.holeCards, state.communityCards, numOpponents)
        const callAmt = Math.max(0, Math.min(state.currentBet - acting.currentBet, acting.stack))
        const reqEquity = requiredEquity(state.pot, callAmt)
        const decision = decideAIAction(acting, {
          pot: state.pot,
          callAmt,
          currentBet: state.currentBet,
          street: state.street,
          equity,
          requiredEquity: reqEquity,
          mode: state.mode,
          minRaise: state.minRaise,
          bigBlind: BIG_BLIND,
          communityCards: state.communityCards,
        })
        dispatch({ type: 'APPLY_ACTION', playerIndex: state.actingIndex, action: decision.action, amount: decision.amount })
        isProcessingRef.current = false
      },
      AI_ACTION_DELAY_MS,
    )

    return () => clearTimeout(timer)
  }, [state])

  useEffect(() => {
    if (state.isHandOver || !state.isBettingRoundOver) return
    if (isProcessingRef.current) return

    isProcessingRef.current = true
    const timer = setTimeout(() => {
      dispatch({ type: 'ADVANCE_STREET' })
      isProcessingRef.current = false
    }, STREET_ADVANCE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
