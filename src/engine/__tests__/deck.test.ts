import { describe, expect, it } from 'vitest'
import { buildDeck, cardToString, drawCards, shuffle } from '../deck'

describe('buildDeck', () => {
  it('has 52 unique cards', () => {
    const deck = buildDeck()
    expect(deck).toHaveLength(52)
    const unique = new Set(deck.map(cardToString))
    expect(unique.size).toBe(52)
  })
})

describe('shuffle', () => {
  it('preserves all cards', () => {
    const deck = buildDeck()
    const shuffled = shuffle(deck)
    expect(shuffled).toHaveLength(52)
    expect(new Set(shuffled.map(cardToString))).toEqual(new Set(deck.map(cardToString)))
  })
})

describe('drawCards', () => {
  it('splits drawn and remaining correctly', () => {
    const deck = buildDeck()
    const { drawn, remaining } = drawCards(deck, 5)
    expect(drawn).toHaveLength(5)
    expect(remaining).toHaveLength(47)
  })
})
