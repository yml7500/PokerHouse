import { Hand } from 'pokersolver'
import type { Card } from '../types'
import { cardToString } from './deck'

export interface EvaluatedHand {
  name: string
  descr: string
  rank: number
  solverHand: Hand
}

export function evaluateHand(cards: Card[]): EvaluatedHand {
  const solved = Hand.solve(cards.map(cardToString))
  return { name: solved.name, descr: solved.descr, rank: solved.rank, solverHand: solved }
}

/** Returns indices of the winning hands among the provided hands (ties possible). */
export function determineWinners(hands: { index: number; cards: Card[] }[]): number[] {
  const solved = hands.map((h) => ({ index: h.index, hand: Hand.solve(h.cards.map(cardToString)) }))
  const winningHands = Hand.winners(solved.map((s) => s.hand))
  return solved.filter((s) => winningHands.includes(s.hand)).map((s) => s.index)
}
