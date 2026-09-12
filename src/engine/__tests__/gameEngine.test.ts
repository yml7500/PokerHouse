import { describe, expect, it } from 'vitest'
import {
  BIG_BLIND,
  SMALL_BLIND,
  STARTING_STACK,
  createInitialState,
  gameReducer,
} from '../gameEngine'
import type { GameState } from '../../types'

function totalChips(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.stack, 0) + state.pot
}

describe('gameEngine - player creation per mode', () => {
  it('creates archetype named bots in easy mode in fixed order', () => {
    const state = createInitialState('easy')
    expect(state.players).toHaveLength(5)
    expect(state.players[0].name).toBe('You')
    expect(state.players[0].isHuman).toBe(true)

    expect(state.players[1].name).toBe('The Rock')
    expect(state.players[1].personality).toBe('rock')

    expect(state.players[2].name).toBe('The Caller')
    expect(state.players[2].personality).toBe('caller')

    expect(state.players[3].name).toBe('The Aggressor')
    expect(state.players[3].personality).toBe('aggressor')

    expect(state.players[4].name).toBe('The Shark')
    expect(state.players[4].personality).toBe('shark')
  })

  it('creates realistic named bots and shuffles personalities in medium and hard modes', () => {
    const stateMedium = createInitialState('medium')
    const stateHard = createInitialState('hard')

    const mediumBots = stateMedium.players.slice(1)
    const hardBots = stateHard.players.slice(1)

    // Names should not be "The Rock", etc.
    const archetypeNames = ['The Rock', 'The Caller', 'The Aggressor', 'The Shark']
    for (const bot of mediumBots) {
      expect(archetypeNames).not.toContain(bot.name)
      expect(bot.name.length).toBeGreaterThan(1)
    }
    for (const bot of hardBots) {
      expect(archetypeNames).not.toContain(bot.name)
      expect(bot.name.length).toBeGreaterThan(1)
    }

    // All 4 personalities must still exist among the 4 bots
    const mediumPersonas = mediumBots.map((b) => b.personality).sort()
    expect(mediumPersonas).toEqual(['aggressor', 'caller', 'rock', 'shark'])

    const hardPersonas = hardBots.map((b) => b.personality).sort()
    expect(hardPersonas).toEqual(['aggressor', 'caller', 'rock', 'shark'])
  })

  it('creates realistic named bots with 4 unique styles for unsupervised free play mode', () => {
    const state = createInitialState('unsupervised')
    expect(state.mode).toBe('unsupervised')
    expect(state.players).toHaveLength(5)
    expect(state.players[0].isHuman).toBe(true)
    expect(state.players[0].stack).toBe(STARTING_STACK)

    const bots = state.players.slice(1)
    expect(bots).toHaveLength(4)

    const archetypeNames = ['The Rock', 'The Caller', 'The Aggressor', 'The Shark']
    for (const bot of bots) {
      expect(archetypeNames).not.toContain(bot.name)
      expect(bot.name.length).toBeGreaterThan(1)
      expect(bot.stack).toBe(STARTING_STACK)
    }

    const personas = bots.map((b) => b.personality).sort()
    expect(personas).toEqual(['aggressor', 'caller', 'rock', 'shark'])
  })
})

describe('gameEngine - start hand & dealer/blind rotation', () => {
  it('posts small and big blinds and sets acting index to UTG preflop', () => {
    let state = createInitialState('easy')
    state = gameReducer(state, { type: 'START_HAND' })

    expect(state.handNumber).toBe(1)
    expect(state.dealerIndex).toBe(0) // Seat 0 is dealer on hand 1
    expect(state.sbIndex).toBe(1)      // Seat 1 is small blind
    expect(state.bbIndex).toBe(2)      // Seat 2 is big blind
    expect(state.actingIndex).toBe(3)  // Seat 3 is UTG (first to act)

    expect(state.players[1].stack).toBe(STARTING_STACK - SMALL_BLIND)
    expect(state.players[1].currentBet).toBe(SMALL_BLIND)

    expect(state.players[2].stack).toBe(STARTING_STACK - BIG_BLIND)
    expect(state.players[2].currentBet).toBe(BIG_BLIND)

    expect(state.pot).toBe(SMALL_BLIND + BIG_BLIND)
    expect(state.currentBet).toBe(BIG_BLIND)

    // Every active player got 2 cards
    for (const p of state.players) {
      expect(p.holeCards).toHaveLength(2)
    }

    // Total chips invariant
    expect(totalChips(state)).toBe(5 * STARTING_STACK)
  })

  it('rotates dealer, SB, and BB clockwise on NEXT_HAND', () => {
    let state = createInitialState('easy')
    state = gameReducer(state, { type: 'START_HAND' })
    expect(state.dealerIndex).toBe(0)
    expect(state.sbIndex).toBe(1)
    expect(state.bbIndex).toBe(2)

    // Advance to hand 2
    state = gameReducer(state, { type: 'NEXT_HAND' })
    expect(state.handNumber).toBe(2)
    expect(state.dealerIndex).toBe(1)
    expect(state.sbIndex).toBe(2)
    expect(state.bbIndex).toBe(3)
    expect(state.actingIndex).toBe(4)

    // Advance to hand 3
    state = gameReducer(state, { type: 'NEXT_HAND' })
    expect(state.dealerIndex).toBe(2)
    expect(state.sbIndex).toBe(3)
    expect(state.bbIndex).toBe(4)
    expect(state.actingIndex).toBe(0)
  })

  it('skips busted players (stack = 0) in rotation and dealing', () => {
    let state = createInitialState('easy')
    // Bust seat 1
    state.players[1].stack = 0

    state = gameReducer(state, { type: 'START_HAND' })
    expect(state.dealerIndex).toBe(0)
    // Seat 1 is busted, so SB goes to seat 2
    expect(state.sbIndex).toBe(2)
    // BB goes to seat 3
    expect(state.bbIndex).toBe(3)
    // Busted player was auto-folded with 0 hole cards
    expect(state.players[1].folded).toBe(true)
    expect(state.players[1].holeCards).toHaveLength(0)
  })
})

describe('gameEngine - chip conservation & win by fold', () => {
  it('conserves chips through bets, calls, and folds', () => {
    let state = createInitialState('easy')
    state = gameReducer(state, { type: 'START_HAND' })
    expect(totalChips(state)).toBe(5 * STARTING_STACK)

    // Seat 3 calls BB ($20)
    state = gameReducer(state, {
      type: 'APPLY_ACTION',
      playerIndex: 3,
      action: 'call',
      amount: 20,
    })
    expect(totalChips(state)).toBe(5 * STARTING_STACK)

    // Seat 4 folds
    state = gameReducer(state, {
      type: 'APPLY_ACTION',
      playerIndex: 4,
      action: 'fold',
      amount: 0,
    })
    expect(totalChips(state)).toBe(5 * STARTING_STACK)

    // Seat 0 (human) raises to $60 (amount committed is 60)
    state = gameReducer(state, {
      type: 'APPLY_ACTION',
      playerIndex: 0,
      action: 'raise',
      amount: 60,
    })
    expect(totalChips(state)).toBe(5 * STARTING_STACK)
    expect(state.currentBet).toBe(60)

    // Everyone else folds to Seat 0
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 1, action: 'fold', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 2, action: 'fold', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 3, action: 'fold', amount: 0 })

    // Seat 0 wins by fold!
    expect(state.isHandOver).toBe(true)
    expect(state.handResult?.winners).toEqual([0])
    expect(state.players[0].stack).toBe(STARTING_STACK - 60 + state.handResult!.amountWon)
    expect(totalChips(state)).toBe(5 * STARTING_STACK)
  })
})

describe('gameEngine - all-in runout regression', () => {
  it('runs all streets to showdown when players are all-in preflop', () => {
    let state = createInitialState('easy')
    state = gameReducer(state, { type: 'START_HAND' })

    // Fold seats 3 and 4
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 3, action: 'fold', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 4, action: 'fold', amount: 0 })

    // Seat 0 pushes all-in ($2000)
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 0, action: 'all-in', amount: STARTING_STACK })

    // Seat 1 folds
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 1, action: 'fold', amount: 0 })

    // Seat 2 (BB) calls all-in ($1980 remaining)
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 2, action: 'all-in', amount: STARTING_STACK - BIG_BLIND })

    expect(state.isBettingRoundOver).toBe(true)
    expect(state.communityCards).toHaveLength(0)

    // Flop
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('flop')
    expect(state.communityCards).toHaveLength(3)
    expect(state.isBettingRoundOver).toBe(true) // both contenders all-in

    // Turn
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('turn')
    expect(state.communityCards).toHaveLength(4)
    expect(state.isBettingRoundOver).toBe(true)

    // River
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('river')
    expect(state.communityCards).toHaveLength(5)
    expect(state.isBettingRoundOver).toBe(true)

    // Showdown
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('showdown')
    expect(state.isHandOver).toBe(true)
    expect(state.handResult).toBeDefined()
    expect(state.handResult?.winners.length).toBeGreaterThanOrEqual(1)
    expect(totalChips(state)).toBe(5 * STARTING_STACK)
  })

  it('guarantees minRaise is 1 BB ($20) and currentBet is 0 on flop, turn, and river street transitions', () => {
    let state = createInitialState('easy')
    state = gameReducer(state, { type: 'START_HAND' })

    // Simulate preflop callers to close betting without going all-in
    // Acting index starts at seat 3
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 3, action: 'call', amount: 20 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 4, action: 'call', amount: 20 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 0, action: 'call', amount: 20 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 1, action: 'call', amount: 10 }) // SB completes to 20
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 2, action: 'check', amount: 0 }) // BB checks

    expect(state.isBettingRoundOver).toBe(true)

    // Advance to Flop
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('flop')
    expect(state.currentBet).toBe(0)
    expect(state.minRaise).toBe(BIG_BLIND) // $20 minimum open bet

    // Seat 1 checks, Seat 2 checks, Seat 3 checks, Seat 4 checks, Hero checks
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 1, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 2, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 3, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 4, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 0, action: 'check', amount: 0 })

    expect(state.isBettingRoundOver).toBe(true)

    // Advance to Turn
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('turn')
    expect(state.currentBet).toBe(0)
    expect(state.minRaise).toBe(BIG_BLIND) // $20 minimum open bet

    // Seat 1 checks, Seat 2 checks, Seat 3 checks, Seat 4 checks, Hero checks
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 1, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 2, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 3, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 4, action: 'check', amount: 0 })
    state = gameReducer(state, { type: 'APPLY_ACTION', playerIndex: 0, action: 'check', amount: 0 })

    expect(state.isBettingRoundOver).toBe(true)

    // Advance to River
    state = gameReducer(state, { type: 'ADVANCE_STREET' })
    expect(state.street).toBe('river')
    expect(state.currentBet).toBe(0)
    expect(state.minRaise).toBe(BIG_BLIND) // $20 minimum open bet
  })
})
