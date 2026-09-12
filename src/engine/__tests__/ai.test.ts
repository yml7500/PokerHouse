import { describe, expect, it } from 'vitest'
import { decideAIAction, type AIDecisionContext } from '../ai'
import { legalActions } from '../betting'
import type { PersonalityId, PlayerState } from '../../types'

function makePlayer(personality: PersonalityId, stack = 1000, currentBet = 0, name = 'TestBot'): PlayerState {
  return {
    id: 'test-ai',
    name,
    isHuman: false,
    personality,
    stack,
    holeCards: [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 'h' },
    ],
    currentBet,
    totalContributed: currentBet,
    folded: false,
    allIn: false,
    hasActed: false,
  }
}

describe('decideAIAction', () => {
  const personalities: PersonalityId[] = ['rock', 'caller', 'aggressor', 'shark']

  it('always produces an action within legalActions', () => {
    for (const p of personalities) {
      const player = makePlayer(p, 500, 20)
      const ctx: AIDecisionContext = {
        pot: 100,
        callAmt: 40,
        currentBet: 60,
        street: 'flop',
        equity: 0.5,
        requiredEquity: 0.28,
        mode: 'medium',
        minRaise: 20,
        bigBlind: 20,
      }
      const legal = legalActions(player, ctx.currentBet)
      const decision = decideAIAction(player, ctx)

      expect(legal).toContain(decision.action)
      expect(decision.amount).toBeLessThanOrEqual(player.stack)
    }
  })

  it('never folds when check is available (callAmt === 0)', () => {
    for (const p of personalities) {
      for (let i = 0; i < 20; i++) {
        const player = makePlayer(p, 500, 0)
        const ctx: AIDecisionContext = {
          pot: 80,
          callAmt: 0,
          currentBet: 0,
          street: 'turn',
          equity: 0.1, // Even with very low equity
          requiredEquity: 0,
          mode: 'hard',
          minRaise: 20,
          bigBlind: 20,
        }
        const decision = decideAIAction(player, ctx)
        expect(['check', 'bet', 'raise', 'all-in']).toContain(decision.action)
        expect(decision.action).not.toBe('fold')
        expect(decision.action).not.toBe('call')
      }
    }
  })

  it('never checks when facing a bet (callAmt > 0)', () => {
    for (const p of personalities) {
      const player = makePlayer(p, 500, 0)
      const ctx: AIDecisionContext = {
        pot: 120,
        callAmt: 40,
        currentBet: 40,
        street: 'flop',
        equity: 0.6,
        requiredEquity: 0.25,
        mode: 'medium',
        minRaise: 20,
        bigBlind: 20,
      }
      const decision = decideAIAction(player, ctx)
      expect(decision.action).not.toBe('check')
      expect(['fold', 'call', 'raise', 'all-in']).toContain(decision.action)
    }
  })

  it('uses player.name in reasoning rather than archetype name', () => {
    const player = makePlayer('shark', 500, 0, 'Chloe')
    const ctx: AIDecisionContext = {
      pot: 100,
      callAmt: 0,
      currentBet: 0,
      street: 'river',
      equity: 0.5,
      requiredEquity: 0,
      mode: 'medium',
      minRaise: 20,
      bigBlind: 20,
    }
    const decision = decideAIAction(player, ctx)
    expect(decision.reasoning).toContain('Chloe')
    expect(decision.reasoning).not.toContain('The Shark')
  })

  it('allows passive players (The Rock and The Caller) to raise when holding strong edges', () => {
    // Both Rock and Caller should occasionally raise or bet with high equity
    const passivePersonalities: PersonalityId[] = ['rock', 'caller']

    for (const p of passivePersonalities) {
      const player = makePlayer(p, 1000, 0)
      const ctx: AIDecisionContext = {
        pot: 100,
        callAmt: 0,
        currentBet: 0,
        street: 'turn',
        equity: 0.85, // Very strong edge
        requiredEquity: 0,
        mode: 'medium',
        minRaise: 20,
        bigBlind: 20,
      }

      let raisedOrBetted = 0
      for (let trial = 0; trial < 100; trial++) {
        const decision = decideAIAction(player, ctx)
        if (decision.action === 'bet' || decision.action === 'raise' || decision.action === 'all-in') {
          raisedOrBetted++
        }
      }

      // With 18-22% chance, 100 trials will reliably observe at least 5 raises/bets
      expect(raisedOrBetted).toBeGreaterThan(5)
    }
  })

  it('folds unplayable preflop trash (72o) for loose bots when facing a bet', () => {
    const looseBots: PersonalityId[] = ['aggressor', 'caller']
    for (const p of looseBots) {
      const player = makePlayer(p, 2000, 0)
      player.holeCards = [
        { rank: '7', suit: 's' },
        { rank: '2', suit: 'd' },
      ]
      const ctx: AIDecisionContext = {
        pot: 50,
        callAmt: 20,
        currentBet: 20,
        street: 'preflop',
        equity: 0.15,
        requiredEquity: 0.28,
        mode: 'medium',
        minRaise: 20,
        bigBlind: 20,
      }
      const decision = decideAIAction(player, ctx)
      expect(decision.action).toBe('fold')
    }
  })

  it('folds postflop un-paired air with no draw and low equity when facing a bet', () => {
    const looseBots: PersonalityId[] = ['aggressor', 'caller']
    for (const p of looseBots) {
      const player = makePlayer(p, 2000, 0)
      player.holeCards = [
        { rank: '8', suit: 's' },
        { rank: '3', suit: 'd' },
      ]
      const ctx: AIDecisionContext = {
        pot: 120,
        callAmt: 40,
        currentBet: 40,
        street: 'flop',
        equity: 0.12,
        requiredEquity: 0.25,
        mode: 'medium',
        minRaise: 20,
        bigBlind: 20,
        communityCards: [
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 'h' },
          { rank: 'J', suit: 's' },
        ],
      }
      const decision = decideAIAction(player, ctx)
      expect(decision.action).toBe('fold')
    }
  })
})
