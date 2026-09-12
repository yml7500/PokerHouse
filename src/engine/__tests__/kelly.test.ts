import { describe, expect, it } from 'vitest'
import { kellyFraction, netOddsForCall, rawKellyFraction, recommendedKelly } from '../kelly'

describe('rawKellyFraction', () => {
  it('returns positive for winning edge', () => {
    expect(rawKellyFraction(0.58, 1)).toBeCloseTo(0.16, 5)
  })

  it('returns exact negative value for losing edge', () => {
    // p = 0.4, b = 1 -> f* = 0.4 - 0.6/1 = -0.2
    expect(rawKellyFraction(0.4, 1)).toBeCloseTo(-0.2, 5)
    // p = 0.2, b = 2 -> f* = 0.2 - 0.8/2 = 0.2 - 0.4 = -0.2
    expect(rawKellyFraction(0.2, 2)).toBeCloseTo(-0.2, 5)
  })
})

describe('kellyFraction', () => {
  it('matches the spec example: p=0.58, b=1 -> f*=0.16', () => {
    expect(kellyFraction(0.58, 1)).toBeCloseTo(0.16, 5)
  })

  it('returns 0 for a losing edge', () => {
    expect(kellyFraction(0.4, 1)).toBe(0)
  })
})

describe('netOddsForCall', () => {
  it('computes pot / call', () => {
    expect(netOddsForCall(120, 40)).toBeCloseTo(3, 5)
  })
})

describe('recommendedKelly', () => {
  it('recommends half of full Kelly by default, capped at 25% of bankroll', () => {
    const rec = recommendedKelly(0.58, 1, 1000)
    expect(rec.rawKelly).toBeCloseTo(0.16, 5)
    expect(rec.fullKelly).toBeCloseTo(0.16, 5)
    expect(rec.recommendedFraction).toBeCloseTo(0.08, 5)
    expect(rec.recommendedAmount).toBe(80)
  })

  it('preserves negative rawKelly while fullKelly is 0 for losing edges', () => {
    const rec = recommendedKelly(0.3, 1, 1000)
    expect(rec.rawKelly).toBeCloseTo(-0.4, 5)
    expect(rec.fullKelly).toBe(0)
    expect(rec.recommendedFraction).toBe(0)
    expect(rec.recommendedAmount).toBe(0)
  })

  it('never exceeds the 25% bankroll cap even for large edges', () => {
    const rec = recommendedKelly(0.95, 1, 1000, 1)
    expect(rec.recommendedFraction).toBeLessThanOrEqual(0.25)
  })
})
