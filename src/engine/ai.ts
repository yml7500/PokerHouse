import type { Card, GameMode, PersonalityId, PlayerAction, PlayerState, Street } from '../types'
import { PERSONALITIES } from './personalities'
import { netOddsForCall, recommendedKelly } from './kelly'
import { isPlayablePreflop } from './handRating'
import { evaluateHand } from './handEvaluator'
import { detectDraws } from './equity'

export interface AIDecisionContext {
  pot: number
  callAmt: number
  currentBet: number
  street: Street
  equity: number
  requiredEquity: number
  mode: GameMode
  minRaise: number
  bigBlind: number
  communityCards?: Card[]
}

export interface AIDecision {
  action: PlayerAction
  amount: number
  reasoning: string
}

const FOLD_MARGIN: Record<PersonalityId, number> = {
  rock: 0.08,
  caller: -0.08,
  aggressor: 0.01,
  shark: 0.04,
}

const RAISE_PROFILE: Record<PersonalityId, { minEdge: number; chance: number; potFraction: number; bluffChance: number }> = {
  rock: { minEdge: 0.2, chance: 0.22, potFraction: 0.48, bluffChance: 0.02 },
  caller: { minEdge: 0.18, chance: 0.18, potFraction: 0.45, bluffChance: 0.02 },
  aggressor: { minEdge: 0.08, chance: 0.32, potFraction: 0.55, bluffChance: 0.08 },
  shark: { minEdge: 0.13, chance: 0.35, potFraction: 0.55, bluffChance: 0.05 },
}

function jitter(spread = 0.05): number {
  return (Math.random() * 2 - 1) * spread
}

function clampToRaise(targetTotalBet: number, currentBet: number, minRaise: number, stack: number, currentPlayerBet: number): number {
  const minTotal = currentBet + minRaise
  const capped = Math.min(Math.max(targetTotalBet, minTotal), currentPlayerBet + stack)
  return Math.round(capped)
}

export function decideAIAction(player: PlayerState, ctx: AIDecisionContext): AIDecision {
  const personalityId = player.personality ?? 'caller'
  const personality = PERSONALITIES[personalityId]
  const foldMargin = FOLD_MARGIN[personalityId]
  const raiseProfile = RAISE_PROFILE[personalityId]

  const canCheck = ctx.callAmt === 0
  const equitySurplus = ctx.equity - ctx.requiredEquity

  // Human-realistic preflop range filtering:
  // If facing a bet/call preflop and hand is unplayable junk (e.g. 72o, 83o), fold.
  if (ctx.street === 'preflop' && ctx.callAmt > 0) {
    if (!isPlayablePreflop(player.holeCards, personalityId, ctx.callAmt, ctx.bigBlind)) {
      return {
        action: 'fold',
        reasoning: `${player.name} folds: hand is outside playable preflop range.`,
        amount: 0,
      }
    }
  }

  // Postflop made-hand & draw detection:
  const board = ctx.communityCards ?? []
  const hasCards = player.holeCards && player.holeCards.length >= 2 && board.length >= 3
  const solved = hasCards ? evaluateHand([...player.holeCards, ...board]) : null
  const draws = hasCards ? detectDraws(player.holeCards, board) : { hasFlushDraw: false, hasStraightDraw: false }
  const hasMadeHand = solved ? solved.rank >= 1 : ctx.equity >= 0.35
  const hasDraw = draws.hasFlushDraw || draws.hasStraightDraw
  const hasGenuineStrength = hasMadeHand || hasDraw || ctx.equity >= 0.38

  // Bluff: occasionally bet/raise with a weak hand when checked to, mostly the Aggressor.
  const wantsBluff = canCheck && Math.random() < raiseProfile.bluffChance && ctx.equity < 0.4

  // Value betting/raising requires genuine hand strength or strong equity.
  // Bots cannot "value bet" on un-paired air postflop!
  const isEligibleForValueRaise =
    ctx.street === 'preflop'
      ? isPlayablePreflop(player.holeCards, personalityId, ctx.bigBlind, ctx.bigBlind)
      : hasGenuineStrength

  const wantsValueRaise =
    isEligibleForValueRaise &&
    player.stack > 0 &&
    (equitySurplus + jitter() > raiseProfile.minEdge || ctx.equity > 0.78) &&
    Math.random() < raiseProfile.chance

  if ((wantsValueRaise || wantsBluff) && player.stack > ctx.callAmt) {
    let betSizeFraction = wantsBluff ? Math.min(raiseProfile.potFraction, 0.4) : raiseProfile.potFraction

    if (ctx.mode === 'hard') {
      const b = netOddsForCall(ctx.pot, Math.max(ctx.callAmt, ctx.bigBlind))
      const bankroll = player.stack + player.currentBet
      const kelly = recommendedKelly(ctx.equity, Math.max(b, 1), bankroll, personality.kellyMultiplier)
      betSizeFraction = Math.max(betSizeFraction, Math.min(0.8, kelly.recommendedFraction * 3))
    }

    const potAfterCall = ctx.pot + ctx.callAmt
    const raiseAmountOnTop = Math.max(ctx.minRaise, Math.round(potAfterCall * betSizeFraction))
    const targetTotalBet = ctx.currentBet + raiseAmountOnTop
    const finalTotal = clampToRaise(targetTotalBet, ctx.currentBet, ctx.minRaise, player.stack, player.currentBet)
    const amount = finalTotal - player.currentBet

    if (amount >= player.stack) {
      const isCriticallyShort = player.stack <= ctx.bigBlind * 4
      const hasMonster = ctx.equity > 0.82

      // Only push all-in if holding a monster hand or stack is critically low. Never shove on a bluff.
      if (!wantsBluff && (isCriticallyShort || hasMonster)) {
        return { action: 'all-in', amount: player.stack, reasoning: `${player.name} pushes all-in.` }
      }

      // Otherwise, cap the raise to a controlled portion of stack to allow multi-street play
      const cappedAmount = Math.max(ctx.minRaise, Math.round(player.stack * 0.45))
      if (cappedAmount < player.stack) {
        return {
          action: ctx.currentBet === 0 ? 'bet' : 'raise',
          amount: cappedAmount,
          reasoning: `${player.name} ${ctx.currentBet === 0 ? 'bets' : 'raises'} with ${(ctx.equity * 100).toFixed(0)}% equity.`,
        }
      }
    }
    return {
      action: ctx.currentBet === 0 ? 'bet' : 'raise',
      amount,
      reasoning: wantsBluff
        ? `${player.name} bets as a bluff.`
        : `${player.name} raises for value with ${(ctx.equity * 100).toFixed(0)}% equity.`,
    }
  }

  if (canCheck) {
    return { action: 'check', amount: 0, reasoning: `${player.name} checks.` }
  }

  // When facing a bet postflop, pure un-paired air with no draw and low equity will fold.
  // Even loose callers fold 8-high air when someone bets into them.
  if (ctx.street !== 'preflop' && !hasGenuineStrength && ctx.equity < 0.3) {
    return {
      action: 'fold',
      reasoning: `${player.name} folds: holding no pair, no draw, and low equity.`,
      amount: 0,
    }
  }

  const willCall = ctx.equity + jitter() + 0.001 >= ctx.requiredEquity - foldMargin
  if (willCall) {
    const amount = Math.min(ctx.callAmt, player.stack)
    return {
      action: amount >= player.stack ? 'all-in' : 'call',
      amount,
      reasoning: `${player.name} calls: ${(ctx.equity * 100).toFixed(0)}% equity vs ${(ctx.requiredEquity * 100).toFixed(0)}% required.`,
    }
  }

  return {
    action: 'fold',
    reasoning: `${player.name} folds: ${(ctx.equity * 100).toFixed(0)}% equity vs ${(ctx.requiredEquity * 100).toFixed(0)}% required.`,
    amount: 0,
  }
}
