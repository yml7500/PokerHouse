import type { Card, DecisionSnapshot, GameMode } from '../types'
import { detectDraws } from './equity'

const HAND_STRENGTH_TEXT: Record<string, string> = {
  'Royal Flush': 'the best possible hand',
  'Straight Flush': 'an extremely strong hand',
  'Four of a Kind': 'a very strong hand',
  'Full House': 'a very strong hand',
  Flush: 'a strong hand',
  Straight: 'a strong hand',
  'Three of a Kind': 'a solid hand',
  'Two Pair': 'a decent hand',
  Pair: 'a modest hand',
  'High Card': 'a weak hand',
}

export interface ActionEvaluation {
  isCorrect: boolean
  badgeText: string // '✓ Correct Decision' | '✕ Suboptimal Decision'
  summary: string
}

export function evaluateDecision(mode: GameMode, snapshot: DecisionSnapshot): ActionEvaluation {
  if (mode === 'hard') {
    const k = snapshot.kelly
    const rawKelly = k ? (k.rawKelly ?? k.fullKelly) : 0
    if (snapshot.callAmount === 0 && snapshot.action === 'check') {
      return {
        isCorrect: true,
        badgeText: '✓ Correct Decision',
        summary: 'Zero Risk (Free Check): Checking costs $0 and preserves your bankroll.',
      }
    }
    if (rawKelly <= 0) {
      if (snapshot.action === 'fold') {
        return {
          isCorrect: true,
          badgeText: '✓ Correct Decision',
          summary: 'Disciplined fold: Negative Kelly edge (-EV). Risking 0% protects your bankroll from long-term loss.',
        }
      }
      if (snapshot.action === 'check') {
        return {
          isCorrect: true,
          badgeText: '✓ Correct Decision',
          summary: 'Optimal check: Checking with non-positive edge preserves bankroll.',
        }
      }
      return {
        isCorrect: false,
        badgeText: '✕ Suboptimal Decision',
        summary: 'Suboptimal action: Kelly indicates negative edge (-EV). Risking chips here leads to bankroll drawdown.',
      }
    } else {
      if (snapshot.action === 'fold') {
        return {
          isCorrect: false,
          badgeText: '✕ Suboptimal Decision',
          summary: 'Suboptimal fold: You held a positive Kelly edge (+EV) with profitable betting/calling odds.',
        }
      }
      return {
        isCorrect: true,
        badgeText: '✓ Correct Decision',
        summary: 'Profitable action: Capitalizing on a positive edge (+EV) according to the Kelly Criterion.',
      }
    }
  }

  if (mode === 'medium') {
    const hasPositiveOdds = snapshot.estimatedEquity >= snapshot.requiredEquity
    if (snapshot.callAmount === 0) {
      if (snapshot.action === 'fold') {
        return {
          isCorrect: false,
          badgeText: '✕ Suboptimal Decision',
          summary: 'Suboptimal fold: You could have checked for free at $0 to see another card.',
        }
      }
      return {
        isCorrect: true,
        badgeText: '✓ Correct Decision',
        summary:
          snapshot.action === 'check'
            ? 'Free check: Seeing more cards at $0 cost preserves your equity.'
            : 'Value bet: Capitalizing on the betting option to build the pot.',
      }
    }

    if (!hasPositiveOdds) {
      if (snapshot.action === 'fold') {
        return {
          isCorrect: true,
          badgeText: '✓ Correct Decision',
          summary: 'Disciplined fold: Hand equity was below the required pot odds threshold (-EV).',
        }
      }
      return {
        isCorrect: false,
        badgeText: '✕ Suboptimal Decision',
        summary: 'Suboptimal call: Hand equity was below the required pot odds threshold (-EV).',
      }
    } else {
      if (snapshot.action === 'fold') {
        return {
          isCorrect: false,
          badgeText: '✕ Suboptimal Decision',
          summary: 'Suboptimal fold: Hand equity exceeded the required pot odds threshold (+EV).',
        }
      }
      return {
        isCorrect: true,
        badgeText: '✓ Correct Decision',
        summary: 'Profitable play: Hand equity exceeded the required pot odds threshold (+EV).',
      }
    }
  }

  // Easy mode (Beginner):
  if (snapshot.callAmount === 0 && snapshot.action === 'fold') {
    return {
      isCorrect: false,
      badgeText: '✕ Suboptimal Decision',
      summary: 'You could have checked for free at $0 instead of folding.',
    }
  }
  if (snapshot.action === 'fold') {
    return {
      isCorrect: true,
      badgeText: '✓ Correct Decision',
      summary: 'Disciplined fold! Folding protects your chips when facing bets.',
    }
  }
  if (snapshot.action === 'check') {
    return {
      isCorrect: true,
      badgeText: '✓ Correct Decision',
      summary: 'Good check! Seeing more cards for free preserves your chips.',
    }
  }
  return {
    isCorrect: true,
    badgeText: '✓ Correct Decision',
    summary: 'Active play! Putting chips in the pot to challenge opponents.',
  }
}

export function easyModeExplanation(snapshot: DecisionSnapshot, heroCards: Card[], communityCards: Card[]): string {
  const strengthPhrase = snapshot.handDescription ? HAND_STRENGTH_TEXT[snapshot.handDescription] ?? 'a hand' : undefined
  const draws = detectDraws(heroCards, communityCards)
  const evalResult = evaluateDecision('easy', snapshot)

  const parts: string[] = []
  parts.push(`${evalResult.badgeText}!`)

  if (snapshot.action === 'fold') {
    parts.push(`You folded${strengthPhrase ? ` with ${strengthPhrase} (${snapshot.handDescription})` : ''}. Folding weak hands protects your chips.`)
  } else if (snapshot.action === 'check') {
    parts.push(`You checked${strengthPhrase ? ` with ${strengthPhrase}` : ''}, keeping the pot small while you see more cards for free.`)
  } else if (snapshot.action === 'call') {
    parts.push(`You called with ${strengthPhrase ?? 'your hand'}${snapshot.handDescription ? ` (${snapshot.handDescription})` : ''}.`)
  } else {
    parts.push(`You ${snapshot.action === 'raise' ? 'raised' : snapshot.action === 'bet' ? 'bet' : 'went all-in'} with ${strengthPhrase ?? 'your hand'}${snapshot.handDescription ? ` (${snapshot.handDescription})` : ''}. Betting strong hands builds the pot.`)
  }

  if (draws.hasFlushDraw) parts.push("You're holding a flush draw — you have potential to improve on later streets.")
  if (draws.hasStraightDraw) parts.push("You're holding a straight draw — a few more cards could complete a strong hand.")

  return parts.join(' ')
}

export function mediumModeExplanation(snapshot: DecisionSnapshot): string {
  const pct = (n: number) => `${Math.round(n * 100)}%`
  const base = `POT: $${snapshot.potBeforeAction} · CALL: $${snapshot.callAmount}. Required equity = ${snapshot.callAmount} / (${snapshot.potBeforeAction} + ${snapshot.callAmount}) = ${pct(snapshot.requiredEquity)}. Your estimated equity was ${pct(snapshot.estimatedEquity)}.`
  const evalResult = evaluateDecision('medium', snapshot)

  return `${base} ${evalResult.badgeText}! ${evalResult.summary}`
}

export function hardModeExplanation(snapshot: DecisionSnapshot): string {
  const k = snapshot.kelly
  if (!k) return `BANKROLL: $${snapshot.bankroll}. Not enough information to compute a Kelly recommendation for this decision.`

  const pPct = Math.round(snapshot.estimatedEquity * 100)
  const rawKelly = k.rawKelly ?? k.fullKelly
  const rawPct = (rawKelly * 100).toFixed(1)
  const evalResult = evaluateDecision('hard', snapshot)

  return [
    `BANKROLL: $${snapshot.bankroll} · WIN PROBABILITY: ${pPct}% · NET ODDS: ${k.b.toFixed(2)}:1`,
    `f* = p - (1-p)/b = ${k.p.toFixed(2)} - ${(1 - k.p).toFixed(2)}/${k.b.toFixed(2)} = ${rawKelly >= 0 ? '+' : ''}${rawPct}%`,
    `${evalResult.badgeText}! ${evalResult.summary}`,
  ].join('\n')
}

export function buildExplanation(
  mode: GameMode,
  snapshot: DecisionSnapshot,
  heroCards: Card[],
  communityCards: Card[],
): string {
  if (mode === 'easy') return easyModeExplanation(snapshot, heroCards, communityCards)
  if (mode === 'medium') return mediumModeExplanation(snapshot)
  return hardModeExplanation(snapshot)
}
