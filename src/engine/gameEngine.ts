import type { DecisionSnapshot, GameMode, GameState, PlayerAction, PlayerState } from '../types'
import { buildDeck, drawCards, shuffle } from './deck'
import { activePlayersRemaining, commitChips, isBettingRoundOver } from './betting'
import { determineWinners, evaluateHand } from './handEvaluator'
import { PERSONALITIES } from './personalities'
import type { PersonalityId } from '../types'

export const SMALL_BLIND = 10
export const BIG_BLIND = 20
export const STARTING_STACK = 2000

export const REALISTIC_BOT_NAMES = [
  'Marcus',
  'Elena',
  'Darius',
  'Chloe',
  'Julian',
  'Sofia',
  'Leo',
  'Nadia',
  'Vince',
  'Tara',
  'Maya',
  'Liam',
]

export const SEAT_PERSONALITIES: PersonalityId[] = ['rock', 'caller', 'aggressor', 'shark']

export type GameEngineAction =
  | { type: 'START_HAND' }
  | { type: 'APPLY_ACTION'; playerIndex: number; action: PlayerAction; amount: number; snapshot?: DecisionSnapshot }
  | { type: 'ADVANCE_STREET' }
  | { type: 'NEXT_HAND' }
  | { type: 'RESHUFFLE_BOT_PERSONALITIES' }

function createPlayers(mode: GameMode): PlayerState[] {
  const human: PlayerState = {
    id: 'human',
    name: 'You',
    isHuman: true,
    stack: STARTING_STACK,
    holeCards: [],
    currentBet: 0,
    totalContributed: 0,
    folded: false,
    allIn: false,
    hasActed: false,
  }

  const personalities =
    mode === 'easy' ? [...SEAT_PERSONALITIES] : shuffle([...SEAT_PERSONALITIES])
  const names =
    mode === 'easy'
      ? personalities.map((p) => PERSONALITIES[p].name)
      : shuffle([...REALISTIC_BOT_NAMES]).slice(0, 4)

  const ais: PlayerState[] = personalities.map((personality, i) => ({
    id: `ai-${i}`,
    name: names[i],
    isHuman: false,
    personality,
    stack: STARTING_STACK,
    holeCards: [],
    currentBet: 0,
    totalContributed: 0,
    folded: false,
    allIn: false,
    hasActed: false,
  }))
  return [human, ...ais]
}

export function createInitialState(mode: GameMode): GameState {
  return {
    mode,
    players: createPlayers(mode),
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: BIG_BLIND,
    street: 'preflop',
    dealerIndex: -1,
    sbIndex: -1,
    bbIndex: -1,
    actingIndex: 0,
    handNumber: 0,
    actionLog: [],
    isHandOver: false,
    isBettingRoundOver: false,
    handsPlayed: 0,
    handsWon: 0,
  }
}

function nextLiveSeat(players: PlayerState[], fromIndex: number): number {
  const n = players.length
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n
    if (players[idx].stack > 0) return idx
  }
  return fromIndex
}

function nextToAct(players: PlayerState[], fromIndex: number): number {
  const n = players.length
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n
    if (!players[idx].folded && !players[idx].allIn) return idx
  }
  return -1
}

function startHand(state: GameState): GameState {
  const deck0 = shuffle(buildDeck())
  const dealerIndex = state.handNumber === 0 ? 0 : nextLiveSeat(state.players, state.dealerIndex)

  let players: PlayerState[] = state.players.map((p) => ({
    ...p,
    holeCards: [],
    currentBet: 0,
    totalContributed: 0,
    folded: p.stack <= 0,
    allIn: false,
    hasActed: false,
    lastAction: undefined,
    lastActionAmount: undefined,
  }))

  let deck = deck0
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].folded) continue
      const { drawn, remaining } = drawCards(deck, 1)
      players[i] = { ...players[i], holeCards: [...players[i].holeCards, ...drawn] }
      deck = remaining
    }
  }

  const sbIndex = nextLiveSeat(players, dealerIndex)
  const bbIndex = nextLiveSeat(players, sbIndex)

  const sbAmt = Math.min(SMALL_BLIND, players[sbIndex].stack)
  const { player: sbPlayer } = commitChips(players[sbIndex], sbAmt)
  players[sbIndex] = { ...sbPlayer, lastAction: 'bet', lastActionAmount: sbAmt }

  const bbAmt = Math.min(BIG_BLIND, players[bbIndex].stack)
  const { player: bbPlayer } = commitChips(players[bbIndex], bbAmt)
  players[bbIndex] = { ...bbPlayer, lastAction: 'bet', lastActionAmount: bbAmt }

  const pot = sbAmt + bbAmt
  const firstToAct = nextToAct(players, bbIndex)

  return {
    ...state,
    deck,
    communityCards: [],
    players,
    pot,
    currentBet: bbAmt,
    minRaise: BIG_BLIND,
    street: 'preflop',
    dealerIndex,
    sbIndex,
    bbIndex,
    actingIndex: firstToAct,
    handNumber: state.handNumber + 1,
    actionLog: [],
    lastDecisionSnapshot: undefined,
    handResult: undefined,
    isHandOver: false,
    isBettingRoundOver: false,
  }
}

function awardWinByFold(state: GameState): GameState {
  const winnerIndex = state.players.findIndex((p) => !p.folded)
  const players = state.players.map((p, i) => (i === winnerIndex ? { ...p, stack: p.stack + state.pot } : { ...p }))
  return {
    ...state,
    players,
    pot: 0,
    street: 'showdown',
    isHandOver: true,
    isBettingRoundOver: true,
    handResult: { winners: [winnerIndex], amountWon: state.pot, handDescriptions: {} },
    handsPlayed: state.handsPlayed + 1,
    handsWon: winnerIndex === 0 ? state.handsWon + 1 : state.handsWon,
  }
}

function runShowdown(state: GameState): GameState {
  const live = state.players.map((p, i) => ({ p, i })).filter((x) => !x.p.folded)
  const winners = determineWinners(live.map((x) => ({ index: x.i, cards: [...x.p.holeCards, ...state.communityCards] })))
  const share = Math.floor(state.pot / winners.length)
  const remainder = state.pot - share * winners.length

  const players = state.players.map((p) => ({ ...p }))
  winners.forEach((idx, i) => {
    players[idx].stack += share + (i === 0 ? remainder : 0)
  })

  const handDescriptions: Record<number, string> = {}
  live.forEach((x) => {
    handDescriptions[x.i] = evaluateHand([...x.p.holeCards, ...state.communityCards]).descr
  })

  return {
    ...state,
    players,
    pot: 0,
    street: 'showdown',
    isHandOver: true,
    isBettingRoundOver: true,
    handResult: { winners, amountWon: share, handDescriptions },
    handsPlayed: state.handsPlayed + 1,
    handsWon: winners.includes(0) ? state.handsWon + 1 : state.handsWon,
  }
}

function advanceStreet(state: GameState): GameState {
  if (activePlayersRemaining(state.players) <= 1) {
    return awardWinByFold(state)
  }

  let deck = state.deck
  let communityCards = state.communityCards
  let street = state.street

  if (street === 'preflop') {
    const { drawn, remaining } = drawCards(deck, 3)
    communityCards = [...communityCards, ...drawn]
    deck = remaining
    street = 'flop'
  } else if (street === 'flop') {
    const { drawn, remaining } = drawCards(deck, 1)
    communityCards = [...communityCards, ...drawn]
    deck = remaining
    street = 'turn'
  } else if (street === 'turn') {
    const { drawn, remaining } = drawCards(deck, 1)
    communityCards = [...communityCards, ...drawn]
    deck = remaining
    street = 'river'
  } else {
    return runShowdown(state)
  }

  const players = state.players.map((p) =>
    p.folded ? p : { ...p, currentBet: 0, hasActed: p.allIn, lastAction: undefined, lastActionAmount: undefined },
  )
  const contenders = players.filter((p) => !p.folded && !p.allIn)
  const firstToAct = nextToAct(players, state.dealerIndex)

  return {
    ...state,
    deck,
    communityCards,
    street,
    players,
    currentBet: 0,
    minRaise: BIG_BLIND,
    actingIndex: firstToAct === -1 ? state.actingIndex : firstToAct,
    isBettingRoundOver: contenders.length === 0,
  }
}

function applyAction(state: GameState, playerIndex: number, action: PlayerAction, amount: number, snapshot?: DecisionSnapshot): GameState {
  let players = [...state.players]
  const player = players[playerIndex]
  let pot = state.pot
  let currentBet = state.currentBet
  let minRaise = state.minRaise

  if (action === 'fold') {
    players[playerIndex] = { ...player, folded: true, hasActed: true, lastAction: 'fold', lastActionAmount: 0 }
  } else if (action === 'check') {
    players[playerIndex] = { ...player, hasActed: true, lastAction: 'check', lastActionAmount: 0 }
  } else {
    const { player: updated, committed } = commitChips(player, amount)
    pot += committed
    const isRaise = updated.currentBet > currentBet
    if (isRaise) {
      minRaise = Math.max(minRaise, updated.currentBet - currentBet)
      currentBet = updated.currentBet
      players = players.map((p, i) => {
        if (i === playerIndex) return p
        if (p.folded || p.allIn) return p
        return { ...p, hasActed: false }
      })
    }
    const resolvedAction: PlayerAction = updated.allIn ? 'all-in' : action === 'bet' || action === 'raise' ? action : 'call'
    players[playerIndex] = { ...updated, hasActed: true, lastAction: resolvedAction, lastActionAmount: committed }
  }

  const actionLog = [...state.actionLog, { playerIndex, action, amount, street: state.street }]
  const nextState: GameState = {
    ...state,
    players,
    pot,
    currentBet,
    minRaise,
    actionLog,
    lastDecisionSnapshot: snapshot ?? state.lastDecisionSnapshot,
  }

  if (activePlayersRemaining(players) <= 1) {
    return awardWinByFold(nextState)
  }

  const bettingOver = isBettingRoundOver(players, currentBet)
  if (bettingOver) {
    return { ...nextState, isBettingRoundOver: true }
  }

  return { ...nextState, actingIndex: nextToAct(players, playerIndex), isBettingRoundOver: false }
}

export function gameReducer(state: GameState, action: GameEngineAction): GameState {
  switch (action.type) {
    case 'START_HAND':
    case 'NEXT_HAND':
      return startHand(state)
    case 'APPLY_ACTION':
      return applyAction(state, action.playerIndex, action.action, action.amount, action.snapshot)
    case 'ADVANCE_STREET':
      return advanceStreet(state)
    case 'RESHUFFLE_BOT_PERSONALITIES': {
      const newPersonalities = shuffle([...SEAT_PERSONALITIES])
      return {
        ...state,
        players: state.players.map((p, idx) => {
          if (p.isHuman) return p
          return {
            ...p,
            personality: newPersonalities[idx - 1],
          }
        }),
      }
    }
    default:
      return state
  }
}
