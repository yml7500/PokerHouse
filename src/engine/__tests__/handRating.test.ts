import { describe, expect, it } from 'vitest'
import { getChenScore, isPlayablePreflop } from '../handRating'
import type { Card } from '../../types'

describe('Chen Formula Starting Hand Rating', () => {
  it('correctly scores premium pairs and high cards', () => {
    // AA = 10 * 2 = 20
    const aa: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }]
    expect(getChenScore(aa)).toBe(20)

    // KK = 8 * 2 = 16
    const kk: Card[] = [{ rank: 'K', suit: 's' }, { rank: 'K', suit: 'd' }]
    expect(getChenScore(kk)).toBe(16)

    // AKs = 10 + 2 (suited) - 0 = 12
    const aks: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }]
    expect(getChenScore(aks)).toBe(12)

    // AKo = 10 - 0 = 10
    const ako: Card[] = [{ rank: 'A', suit: 's' }, { rank: 'K', suit: 'h' }]
    expect(getChenScore(ako)).toBe(10)
  })

  it('correctly scores small pairs with minimum 5 points', () => {
    // 22 = max(5, 1 * 2) = 5
    const deuces: Card[] = [{ rank: '2', suit: 'c' }, { rank: '2', suit: 'd' }]
    expect(getChenScore(deuces)).toBe(5)

    // 55 = max(5, 2.5 * 2) = 5
    const fives: Card[] = [{ rank: '5', suit: 's' }, { rank: '5', suit: 'h' }]
    expect(getChenScore(fives)).toBe(5)
  })

  it('correctly scores suited connectors with straight bonus', () => {
    // 87s: 8=4, suited=+2, gap 0=0, straight bonus=+1 -> 7
    const s87: Card[] = [{ rank: '8', suit: 's' }, { rank: '7', suit: 's' }]
    expect(getChenScore(s87)).toBe(7)

    // 65s: 6=3, suited=+2, gap 0=0, straight bonus=+1 -> 6
    const s65: Card[] = [{ rank: '6', suit: 'h' }, { rank: '5', suit: 'h' }]
    expect(getChenScore(s65)).toBe(6)
  })

  it('heavily penalizes unplayable offsuit trash hands', () => {
    // 72o: 7=3.5, gap 4=-5 -> -1.5 (<= 0)
    const trash72: Card[] = [{ rank: '7', suit: 's' }, { rank: '2', suit: 'd' }]
    expect(getChenScore(trash72)).toBeLessThanOrEqual(0)

    // 83o: 8=4, gap 4=-5 -> -1 (<= 0)
    const trash83: Card[] = [{ rank: '8', suit: 'h' }, { rank: '3', suit: 'c' }]
    expect(getChenScore(trash83)).toBeLessThanOrEqual(0)

    // 92o: 9=4.5, gap 6=-5 -> -0.5 (<= 0)
    const trash92: Card[] = [{ rank: '9', suit: 'd' }, { rank: '2', suit: 's' }]
    expect(getChenScore(trash92)).toBeLessThanOrEqual(0)
  })

  it('filters preflop ranges properly for loose archetypes', () => {
    const trash72: Card[] = [{ rank: '7', suit: 's' }, { rank: '2', suit: 'd' }]
    const s87: Card[] = [{ rank: '8', suit: 's' }, { rank: '7', suit: 's' }]
    const deuces: Card[] = [{ rank: '2', suit: 'c' }, { rank: '2', suit: 'd' }]

    // Aggressor and Caller MUST fold 72o when facing a bet
    expect(isPlayablePreflop(trash72, 'aggressor', 20, 20)).toBe(false)
    expect(isPlayablePreflop(trash72, 'caller', 20, 20)).toBe(false)
    expect(isPlayablePreflop(trash72, 'rock', 20, 20)).toBe(false)
    expect(isPlayablePreflop(trash72, 'shark', 20, 20)).toBe(false)

    // Aggressor and Caller WILL play suited connectors (87s) and pairs (22)
    expect(isPlayablePreflop(s87, 'aggressor', 20, 20)).toBe(true)
    expect(isPlayablePreflop(s87, 'caller', 20, 20)).toBe(true)
    expect(isPlayablePreflop(deuces, 'aggressor', 20, 20)).toBe(true)
    expect(isPlayablePreflop(deuces, 'caller', 20, 20)).toBe(true)

    // Big Blind free check (callAmt = 0) is always playable even with trash
    expect(isPlayablePreflop(trash72, 'aggressor', 0, 20)).toBe(true)
  })
})
