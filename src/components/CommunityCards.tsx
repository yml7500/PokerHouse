import type { Card } from '../types'
import { PlayingCard } from './PlayingCard'

export function CommunityCards({ cards }: { cards: Card[] }) {
  const placeholders = Math.max(0, 5 - cards.length)
  return (
    <div className="flex gap-2">
      {cards.map((card, i) => (
        <PlayingCard key={i} card={card} />
      ))}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div key={`ph-${i}`} className="h-20 w-14 rounded-md border border-dashed border-white/15" />
      ))}
    </div>
  )
}
