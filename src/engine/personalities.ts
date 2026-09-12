import type { Personality, PersonalityId, PokerStyleId } from '../types'

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  rock: {
    id: 'rock',
    name: 'The Rock',
    description: 'Very tight. Folds weak hands, calls reasonable bets, raises with strong hands.',
    kellyMultiplier: 0.25,
  },
  caller: {
    id: 'caller',
    name: 'The Caller',
    description: 'Loose and passive. Calls often, rarely folds to small bets, raises with strong hands.',
    kellyMultiplier: 0.5,
  },
  aggressor: {
    id: 'aggressor',
    name: 'The Aggressor',
    description: 'Bets and raises often, takes bigger risks, sometimes bluffs.',
    kellyMultiplier: 1.0,
  },
  shark: {
    id: 'shark',
    name: 'The Shark',
    description: 'Uses equity and pot odds intelligently. Selective aggression.',
    kellyMultiplier: 0.5,
  },
}

export const PERSONALITY_TO_STYLE: Record<PersonalityId, PokerStyleId> = {
  shark: 'tight-aggressive',
  aggressor: 'loose-aggressive',
  rock: 'tight-passive',
  caller: 'loose-passive',
}

export interface StyleMeta {
  id: PokerStyleId
  title: string
  subtitle: string
  tag: string
  badgeColor: string
  borderColor: string
  hint: string
}

export const STYLE_DESCRIPTIONS: Record<PokerStyleId, StyleMeta> = {
  'tight-aggressive': {
    id: 'tight-aggressive',
    title: 'Tight-Aggressive',
    subtitle: 'Selective & Aggressive (TAG)',
    tag: 'TAG',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    borderColor: 'border-violet-500/40',
    hint: 'Folds weak hands preflop. Only enters pots with strong holdings, but bets and raises aggressively.',
  },
  'loose-aggressive': {
    id: 'loose-aggressive',
    title: 'Loose-Aggressive',
    subtitle: 'Wide Range & Aggressive (LAG)',
    tag: 'LAG',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderColor: 'border-rose-500/40',
    hint: 'Enters a wide variety of hands. Bets, raises, and bluffs frequently to apply relentless table pressure.',
  },
  'tight-passive': {
    id: 'tight-passive',
    title: 'Tight-Passive',
    subtitle: 'Cautious & Predictable (Rock)',
    tag: 'Rock',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderColor: 'border-sky-500/40',
    hint: 'Plays few hands. Folds when challenged without good cards; bets or raises when holding strong made hands.',
  },
  'loose-passive': {
    id: 'loose-passive',
    title: 'Loose-Passive',
    subtitle: 'Persistent Caller (Calling Station)',
    tag: 'Caller',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/40',
    hint: 'Plays many hands preflop and calls bets down to showdown. Raises occasionally when holding strong hands.',
  },
}

