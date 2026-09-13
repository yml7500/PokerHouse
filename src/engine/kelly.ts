/**
 * Standard Kelly formula for a binary wager: f* = (bp - q) / b
 * where b = net odds received, p = win probability, q = 1 - p.
 *
 * Equivalent form used here: f* = p - q / b.
 * For an even-money wager (b = 1) this reduces to f* = 2p - 1, matching the
 * spec's worked example (p = 0.58 -> f* = 0.16).
 */
export function rawKellyFraction(p: number, b: number): number {
  if (b <= 0) return 0
  const q = 1 - p
  return p - q / b
}

export function kellyFraction(p: number, b: number): number {
  return Math.max(0, rawKellyFraction(p, b))
}

/** Net odds for calling: amount you can win vs. amount you risk. */
export function netOddsForCall(potBeforeCall: number, callAmount: number): number {
  if (callAmount <= 0) return 0
  return potBeforeCall / callAmount
}

// Lowered from 0.25 -> 0.12 -> 0.08: tighter hard cap on recommended bankroll
// exposure so a single decision can't risk a large slice of the stack. This
// is a percentage-of-bankroll cap rather than a flat chip amount, so it stays
// grounded in the same statistics driving the rest of the bet (it naturally
// scales with stack size instead of hardcoding a blind count).
const MAX_BANKROLL_FRACTION = 0.08

export interface KellyRecommendation {
  rawKelly: number
  fullKelly: number
  recommendedFraction: number
  recommendedAmount: number
}

/**
 * Kelly is an educational bankroll-risk framework here, not a bet-sizing
 * formula for every poker decision. We recommend half-Kelly by default and
 * always hard-cap the suggested exposure so the player is never nudged
 * toward risking their whole bankroll just because raw Kelly says so.
 */
export function recommendedKelly(p: number, b: number, bankroll: number, multiplier = 0.5): KellyRecommendation {
  const rawKelly = rawKellyFraction(p, b)
  const fullKelly = Math.max(0, rawKelly)
  const recommendedFraction = Math.min(fullKelly * multiplier, MAX_BANKROLL_FRACTION)
  const recommendedAmount = Math.round(recommendedFraction * bankroll)
  return { rawKelly, fullKelly, recommendedFraction, recommendedAmount }
}
