import { describe, expect, it } from 'vitest'
import { detectDraws, estimateEquity } from '../equity'
import type { Card } from '../../types'

function cards(spec: string): Card[] {
  return spec.split(' ').map((s) => ({ rank: s[0] as Card['rank'], suit: s[1] as Card['suit'] }))
}

describe('estimateEquity', () => {
  it('gives 1.0 equity when no opponents remain', () => {
    const hero = cards('Ah Kd')
    expect(estimateEquity(hero, [], 0)).toBe(1)
  })

  it('evaluates Pocket Aces heads-up preflop with high equity (>75%)', () => {
    const hero = cards('Ah As')
    const equity = estimateEquity(hero, [], 1, 200)
    expect(equity).toBeGreaterThan(0.75)
  })

  it('evaluates a made nut flush on the flop with very high equity (>80%)', () => {
    const hero = cards('Ah Kh')
    const flop = cards('2h 7h 9h')
    const equity = estimateEquity(hero, flop, 1, 200)
    expect(equity).toBeGreaterThan(0.8)
  })
})

describe('detectDraws', () => {
  it('detects a flush draw on the flop', () => {
    const hero = cards('Ah 3h')
    const flop = cards('7h 9h Kc')
    const draws = detectDraws(hero, flop)
    expect(draws.hasFlushDraw).toBe(true)
  })

  it('detects an open-ended straight draw', () => {
    const hero = cards('8c 9d')
    const flop = cards('Ts Jh 2s')
    const draws = detectDraws(hero, flop)
    expect(draws.hasStraightDraw).toBe(true)
  })

  it('returns no draws preflop or on the river', () => {
    const hero = cards('Ah Kh')
    expect(detectDraws(hero, [])).toEqual({ hasFlushDraw: false, hasStraightDraw: false })

    const river = cards('2h 7h 9h 4d Qs')
    expect(detectDraws(hero, river)).toEqual({ hasFlushDraw: false, hasStraightDraw: false })
  })
})
