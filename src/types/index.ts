export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export type GameMode = 'easy' | 'medium' | 'hard' | 'characterize' | 'unsupervised'

export type PokerStyleId = 'tight-aggressive' | 'loose-aggressive' | 'tight-passive' | 'loose-passive'

export type PersonalityId = 'rock' | 'caller' | 'aggressor' | 'shark'

export interface Personality {
  id: PersonalityId
  name: string
  description: string
  kellyMultiplier: number
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

export interface ActionRecord {
  playerIndex: number
  action: PlayerAction
  amount: number
  street: Street
}

export interface DecisionSnapshot {
  playerIndex: number
  street: Street
  potBeforeAction: number
  callAmount: number
  requiredEquity: number
  estimatedEquity: number
  bankroll: number
  kelly?: {
    p: number
    b: number
    rawKelly: number
    fullKelly: number
    recommendedFraction: number
    recommendedAmount: number
  }
  action: PlayerAction
  amount: number
  handDescription?: string
  heroCards: Card[]
  boardAtDecision: Card[]
}

export interface PlayerState {
  id: string
  name: string
  isHuman: boolean
  personality?: PersonalityId
  stack: number
  holeCards: Card[]
  currentBet: number
  totalContributed: number
  folded: boolean
  allIn: boolean
  hasActed: boolean
  lastAction?: PlayerAction
  lastActionAmount?: number
}

export interface HandResult {
  winners: number[]
  amountWon: number
  handDescriptions: Record<number, string>
}

export interface GameState {
  mode: GameMode
  players: PlayerState[]
  deck: Card[]
  communityCards: Card[]
  pot: number
  currentBet: number
  minRaise: number
  street: Street
  dealerIndex: number
  sbIndex: number
  bbIndex: number
  actingIndex: number
  handNumber: number
  actionLog: ActionRecord[]
  lastDecisionSnapshot?: DecisionSnapshot
  handResult?: HandResult
  isHandOver: boolean
  isBettingRoundOver: boolean
  handsPlayed: number
  handsWon: number
}
