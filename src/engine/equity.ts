import { Hand } from 'pokersolver'
import type { Card } from '../types'
import { buildDeck, cardToString } from './deck'

function removeCards(deck: Card[], used: Card[]): Card[] {
  const usedKeys = new Set(used.map(cardToString))
  return deck.filter((c) => !usedKeys.has(cardToString(c)))
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Monte Carlo estimate of hero's equity (win + tie/2) against `numOpponents`
 * random hands, given the known community cards so far.
 */
export function estimateEquity(
  heroCards: Card[],
  communityCards: Card[],
  numOpponents: number,
  iterations = 300,
): number {
  if (numOpponents <= 0) return 1
  const known = [...heroCards, ...communityCards]
  const baseDeck = removeCards(buildDeck(), known)
  const cardsNeededForBoard = 5 - communityCards.length

  let wins = 0
  let ties = 0

  for (let i = 0; i < iterations; i++) {
    const pool = shuffleInPlace([...baseDeck])
    let cursor = 0
    const oppHoleCards: Card[][] = []
    for (let o = 0; o < numOpponents; o++) {
      oppHoleCards.push([pool[cursor], pool[cursor + 1]])
      cursor += 2
    }
    const board = [...communityCards, ...pool.slice(cursor, cursor + cardsNeededForBoard)]

    const heroHand = Hand.solve([...heroCards, ...board].map(cardToString))
    const oppHands = oppHoleCards.map((hole) => Hand.solve([...hole, ...board].map(cardToString)))

    const allHands = [heroHand, ...oppHands]
    const winners = Hand.winners(allHands)
    if (winners.includes(heroHand)) {
      if (winners.length === 1) wins++
      else ties++
    }
  }

  return (wins + ties / 2) / iterations
}

interface DrawInfo {
  hasFlushDraw: boolean
  hasStraightDraw: boolean
}

/** Simple draw detection for Easy-mode education text (not used for equity math). */
export function detectDraws(heroCards: Card[], communityCards: Card[]): DrawInfo {
  const allCards = [...heroCards, ...communityCards]
  if (communityCards.length === 0 || communityCards.length >= 5) {
    return { hasFlushDraw: false, hasStraightDraw: false }
  }

  const suitCounts: Record<string, number> = {}
  for (const c of allCards) suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1
  const hasFlushDraw = Object.values(suitCounts).some((count) => count === 4)

  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
  const rankValues = Array.from(new Set(allCards.map((c) => rankOrder.indexOf(c.rank)))).sort((a, b) => a - b)
  let hasStraightDraw = false
  for (let i = 0; i < rankValues.length; i++) {
    const windowVals = rankValues.filter((v) => v >= rankValues[i] && v <= rankValues[i] + 4)
    if (windowVals.length === 4) {
      hasStraightDraw = true
      break
    }
  }

  return { hasFlushDraw, hasStraightDraw }
}
