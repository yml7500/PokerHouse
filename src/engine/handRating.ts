import type { Card, PersonalityId, Rank } from '../types'

/**
 * Feature flag to easily enable or disable human range filtering if necessary.
 */
export const ENABLE_HUMAN_RANGE_FILTERING = true

const RANK_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

const CHEN_BASE_POINTS: Record<Rank, number> = {
  A: 10,
  K: 8,
  Q: 7,
  J: 6,
  T: 5,
  '9': 4.5,
  '8': 4,
  '7': 3.5,
  '6': 3,
  '5': 2.5,
  '4': 2,
  '3': 1.5,
  '2': 1,
}

/**
 * Computes the classic Bill Chen Formula score for 2 Texas Hold'em hole cards.
 * Returns a score between -1 and 20 (higher = stronger starting hand).
 *
 * Rules:
 * 1. Score highest card (A=10, K=8, Q=7, J=6, T=5, 9..2 = rank/2).
 * 2. If pair: double high card score, minimum pair score is 5.
 * 3. If suited: add 2 points.
 * 4. Gaps: gap 0 = 0, gap 1 = -1, gap 2 = -2, gap 3 = -4, gap 4+ = -5.
 * 5. Straight bonus: +1 point if gap <= 1 and highest card < Queen.
 */
export function getChenScore(holeCards: Card[]): number {
  if (!holeCards || holeCards.length < 2) return 0

  const card1 = holeCards[0]
  const card2 = holeCards[1]

  const rankIdx1 = RANK_ORDER.indexOf(card1.rank)
  const rankIdx2 = RANK_ORDER.indexOf(card2.rank)

  const highRank = rankIdx1 >= rankIdx2 ? card1.rank : card2.rank

  const highIdx = Math.max(rankIdx1, rankIdx2)
  const lowIdx = Math.min(rankIdx1, rankIdx2)

  const isPair = card1.rank === card2.rank
  const isSuited = card1.suit === card2.suit

  let score = 0

  if (isPair) {
    score = Math.max(5, CHEN_BASE_POINTS[highRank] * 2)
  } else {
    score = CHEN_BASE_POINTS[highRank]

    // Suited bonus
    if (isSuited) score += 2

    // Gap calculation
    const gap = Math.max(0, highIdx - lowIdx - 1)
    if (gap === 1) score -= 1
    else if (gap === 2) score -= 2
    else if (gap === 3) score -= 4
    else if (gap >= 4) score -= 5

    // Straight bonus: connected or 1-gap with high card lower than Queen (Q is index 10)
    if (gap <= 1 && highIdx < 10) {
      score += 1
    }
  }

  return Math.round(score * 10) / 10
}

/**
 * Minimum Chen scores by archetype. Loosened from the original tighter
 * baseline (rock 7.0, shark 6.0, aggressor 4.5, caller 4.0) across all modes
 * to favor livelier preflop action: tight archetypes loosened the most (they
 * were folding around the most often), loose archetypes loosened a bit
 * further too.
 * - rock (Tight-Passive): Chen >= 5.0
 * - shark (Tight-Aggressive): Chen >= 4.5
 * - aggressor (Loose-Aggressive): Chen >= 3.5
 * - caller (Loose-Passive): Chen >= 3.0
 */
export const MIN_CHEN_SCORES: Record<PersonalityId, number> = {
  rock: 5.0,
  shark: 4.5,
  aggressor: 3.5,
  caller: 3.0,
}

/**
 * Checks whether a 2-card hand is playable preflop according to the archetype and bet size.
 * If callAmt is 0 (e.g. Big Blind option or free check), any hand is playable.
 */
export function isPlayablePreflop(holeCards: Card[], personality: PersonalityId, callAmt: number, bigBlind: number): boolean {
  if (!ENABLE_HUMAN_RANGE_FILTERING) return true
  if (callAmt <= 0) return true

  const chen = getChenScore(holeCards)
  const baseThreshold = MIN_CHEN_SCORES[personality] ?? 4.5

  // Sizing penalty: if facing a significant raise above 1 BB, threshold tightens
  const raisesAboveOneBB = Math.max(0, (callAmt - bigBlind) / bigBlind)
  const requiredChen = baseThreshold + raisesAboveOneBB * 1.0

  return chen >= requiredChen
}
