/**
 * Required equity to profitably call.
 *
 * `potBeforeCall` must already include every chip contributed so far this hand
 * (by every player, on every street, plus any bet the opponent just made) —
 * do not add the opponent's current bet again on top of it.
 *
 * requiredEquity = callAmount / (potBeforeCall + callAmount)
 *
 * Example from spec: a $40 bet into a $120 pot means you call $40 to compete
 * for a final pot of $200, so requiredEquity = 40 / 200 = 20%.
 */
export function requiredEquity(potBeforeCall: number, callAmount: number): number {
  if (callAmount <= 0) return 0
  return callAmount / (potBeforeCall + callAmount)
}

export function potOddsRatio(potBeforeCall: number, callAmount: number): string {
  if (callAmount <= 0) return '—'
  const finalPot = potBeforeCall + callAmount
  return `${callAmount} / (${potBeforeCall} + ${callAmount}) = ${Math.round((callAmount / finalPot) * 100)}%`
}
