import { describe, it, expect } from 'vitest'
import { evaluateDecision, hardModeExplanation, mediumModeExplanation, easyModeExplanation } from '../education'
import type { DecisionSnapshot } from '../../types'

describe('education engine', () => {
  const baseSnapshot: DecisionSnapshot = {
    playerIndex: 0,
    street: 'flop',
    potBeforeAction: 100,
    callAmount: 20,
    requiredEquity: 0.1667,
    estimatedEquity: 0.10, // below required
    bankroll: 1000,
    action: 'fold',
    amount: 0,
    heroCards: [{ rank: '2', suit: 's' }, { rank: '7', suit: 'h' }],
    boardAtDecision: [{ rank: 'K', suit: 'd' }, { rank: 'Q', suit: 'c' }, { rank: 'J', suit: 's' }],
    handDescription: 'High Card',
  }

  describe('Hard Mode (Kelly Criterion)', () => {
    it('marks a fold with negative Kelly edge as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        action: 'fold',
        kelly: {
          p: 0.10,
          b: 5,
          rawKelly: -0.08,
          fullKelly: 0,
          recommendedFraction: 0,
          recommendedAmount: 0,
        },
      }

      const evaluation = evaluateDecision('hard', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')
      expect(evaluation.summary).toContain('Disciplined fold')

      const explanation = hardModeExplanation(snap)
      expect(explanation).toContain('✓ Correct Decision!')
      expect(explanation).toContain('Disciplined fold')
    })

    it('marks a call with negative Kelly edge as a Suboptimal Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        action: 'call',
        amount: 20,
        kelly: {
          p: 0.10,
          b: 5,
          rawKelly: -0.08,
          fullKelly: 0,
          recommendedFraction: 0,
          recommendedAmount: 0,
        },
      }

      const evaluation = evaluateDecision('hard', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')

      const explanation = hardModeExplanation(snap)
      expect(explanation).toContain('✕ Suboptimal Decision!')
    })

    it('marks a call or bet with positive Kelly edge as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        action: 'call',
        amount: 20,
        estimatedEquity: 0.40,
        kelly: {
          p: 0.40,
          b: 5,
          rawKelly: 0.28,
          fullKelly: 0.28,
          recommendedFraction: 0.14,
          recommendedAmount: 140,
        },
      }

      const evaluation = evaluateDecision('hard', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')

      const explanation = hardModeExplanation(snap)
      expect(explanation).toContain('✓ Correct Decision!')
    })

    it('marks a fold with positive Kelly edge as a Suboptimal Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        action: 'fold',
        estimatedEquity: 0.40,
        kelly: {
          p: 0.40,
          b: 5,
          rawKelly: 0.28,
          fullKelly: 0.28,
          recommendedFraction: 0.14,
          recommendedAmount: 140,
        },
      }

      const evaluation = evaluateDecision('hard', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')
    })

    it('marks a free check ($0 to call) as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        action: 'check',
        callAmount: 0,
        kelly: {
          p: 0.15,
          b: 0,
          rawKelly: 0,
          fullKelly: 0,
          recommendedFraction: 0,
          recommendedAmount: 0,
        },
      }

      const evaluation = evaluateDecision('hard', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')
      expect(evaluation.summary).toContain('Free Check')
    })
  })

  describe('Medium Mode (Pot Odds)', () => {
    it('marks a fold below required pot odds as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 50,
        potBeforeAction: 100,
        requiredEquity: 0.333,
        estimatedEquity: 0.15,
        action: 'fold',
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')
      expect(evaluation.summary).toContain('Disciplined fold')

      const explanation = mediumModeExplanation(snap)
      expect(explanation).toContain('✓ Correct Decision!')
      expect(explanation).toContain('Disciplined fold')
    })

    it('marks a call below required pot odds as a Suboptimal Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 50,
        potBeforeAction: 100,
        requiredEquity: 0.333,
        estimatedEquity: 0.15,
        action: 'call',
        amount: 50,
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')

      const explanation = mediumModeExplanation(snap)
      expect(explanation).toContain('✕ Suboptimal Decision!')
    })

    it('marks a call exceeding required pot odds as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 20,
        potBeforeAction: 100,
        requiredEquity: 0.167,
        estimatedEquity: 0.45,
        action: 'call',
        amount: 20,
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')

      const explanation = mediumModeExplanation(snap)
      expect(explanation).toContain('✓ Correct Decision!')
    })

    it('marks a fold when holding equity above pot odds as Suboptimal', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 20,
        potBeforeAction: 100,
        requiredEquity: 0.167,
        estimatedEquity: 0.45,
        action: 'fold',
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')
    })

    it('marks a check when callAmount is 0 as Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 0,
        action: 'check',
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')
    })

    it('marks a fold when callAmount is 0 as Suboptimal', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 0,
        action: 'fold',
      }

      const evaluation = evaluateDecision('medium', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')
    })
  })

  describe('Easy Mode (Fundamentals)', () => {
    it('marks folding facing a bet as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 20,
        action: 'fold',
      }

      const evaluation = evaluateDecision('easy', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')

      const explanation = easyModeExplanation(snap, snap.heroCards, snap.boardAtDecision)
      expect(explanation).toContain('✓ Correct Decision!')
    })

    it('marks checking when callAmount is 0 as a Correct Decision', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 0,
        action: 'check',
      }

      const evaluation = evaluateDecision('easy', snap)
      expect(evaluation.isCorrect).toBe(true)
      expect(evaluation.badgeText).toBe('✓ Correct Decision')
    })

    it('marks folding when callAmount is 0 as Suboptimal', () => {
      const snap: DecisionSnapshot = {
        ...baseSnapshot,
        callAmount: 0,
        action: 'fold',
      }

      const evaluation = evaluateDecision('easy', snap)
      expect(evaluation.isCorrect).toBe(false)
      expect(evaluation.badgeText).toBe('✕ Suboptimal Decision')
    })
  })
})
