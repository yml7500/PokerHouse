import type { Card } from '../types'

const SUIT_SYMBOL: Record<Card['suit'], string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
}

const RANK_DISPLAY: Record<Card['rank'], string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  T: '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
}

interface PlayingCardProps {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md'
}

export function PlayingCard({ card, faceDown, size = 'md' }: PlayingCardProps) {
  const dims = size === 'sm' ? 'w-9 h-[3.25rem] text-xs' : 'w-14 h-20 text-base'

  if (faceDown || !card) {
    return (
      <div
        className={`${dims} rounded-md border border-white/20 bg-gradient-to-br from-indigo-700 to-indigo-900 shadow-md`}
        aria-hidden
      />
    )
  }

  const isRed = card.suit === 'h' || card.suit === 'd'

  return (
    <div
      className={`${dims} flex flex-col items-center justify-center rounded-md border border-neutral-300 bg-white font-semibold shadow-md ${
        isRed ? 'text-red-600' : 'text-neutral-900'
      }`}
    >
      <span className="leading-none">{RANK_DISPLAY[card.rank]}</span>
      <span className="text-lg leading-none">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  )
}
