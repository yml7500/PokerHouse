declare module 'pokersolver' {
  export class Hand {
    static solve(cards: string[], game?: string): Hand
    static winners(hands: Hand[]): Hand[]
    cards: unknown[]
    name: string
    descr: string
    rank: number
  }
}
