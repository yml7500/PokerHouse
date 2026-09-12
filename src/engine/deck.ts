import type { Card, Rank, Suit } from '../types'

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const SUITS: Suit[] = ['h', 'd', 'c', 's']

export function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  return { drawn: deck.slice(0, count), remaining: deck.slice(count) }
}

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`
}
