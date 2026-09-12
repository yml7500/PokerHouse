import { describe, expect, it } from 'vitest'
import type { Card } from '../../types'
import { determineWinners, evaluateHand } from '../handEvaluator'

function cards(spec: string): Card[] {
  return spec.split(' ').map((s) => ({ rank: s[0] as Card['rank'], suit: s[1] as Card['suit'] }))
}

describe('evaluateHand', () => {
  it('identifies a flush', () => {
    const result = evaluateHand(cards('Ah Kh Qh Jh 9h 2c 3d'))
    expect(result.name).toBe('Flush')
  })

  it('identifies a full house', () => {
    const result = evaluateHand(cards('Ah Ac Ad Kh Kc 2c 3d'))
    expect(result.name).toBe('Full House')
  })
})

describe('determineWinners', () => {
  it('picks the higher pair as the winner', () => {
    const board = cards('2h 5c 9d Jc Qs')
    const winners = determineWinners([
      { index: 0, cards: [...cards('Ah Ac'), ...board] },
      { index: 1, cards: [...cards('Kh Kc'), ...board] },
    ])
    expect(winners).toEqual([0])
  })

  it('detects a tie for split pot', () => {
    const board = cards('2h 5c 9d Jc Qs')
    const winners = determineWinners([
      { index: 0, cards: [...cards('Ah 3c'), ...board] },
      { index: 1, cards: [...cards('Ad 3d'), ...board] },
    ])
    expect(winners.sort()).toEqual([0, 1])
  })
})
