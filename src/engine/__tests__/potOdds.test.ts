import { describe, expect, it } from 'vitest'
import { requiredEquity } from '../potOdds'

describe('requiredEquity', () => {
  it('matches the spec example: opponent bets $40 into a $120 pot (pot becomes $160), calling $40 -> final pot $200 -> 20%', () => {
    // potBeforeCall already includes the opponent's $40 bet: 120 + 40 = 160
    expect(requiredEquity(160, 40)).toBeCloseTo(0.2, 5)
  })

  it('returns 0 when there is nothing to call', () => {
    expect(requiredEquity(120, 0)).toBe(0)
  })

  it('approaches 50% for an equal pot-sized bet', () => {
    expect(requiredEquity(100, 100)).toBeCloseTo(0.5, 5)
  })
})
