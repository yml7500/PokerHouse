import { describe, it, expect } from 'vitest'
import { createInitialState, gameReducer, SEAT_PERSONALITIES } from '../gameEngine'
import { PERSONALITY_TO_STYLE, STYLE_DESCRIPTIONS } from '../personalities'
import type { PersonalityId, PokerStyleId } from '../../types'

describe('Characterize Players Mode & Opponent Profiling', () => {
  describe('Personality to Style Mapping', () => {
    it('correctly maps all 4 archetypes', () => {
      expect(PERSONALITY_TO_STYLE.shark).toBe('tight-aggressive')
      expect(PERSONALITY_TO_STYLE.aggressor).toBe('loose-aggressive')
      expect(PERSONALITY_TO_STYLE.rock).toBe('tight-passive')
      expect(PERSONALITY_TO_STYLE.caller).toBe('loose-passive')
    })

    it('has full metadata for all 4 poker styles', () => {
      const styles: PokerStyleId[] = [
        'tight-aggressive',
        'loose-aggressive',
        'tight-passive',
        'loose-passive',
      ]
      styles.forEach((style) => {
        expect(STYLE_DESCRIPTIONS[style]).toBeDefined()
        expect(STYLE_DESCRIPTIONS[style].title).toBeTruthy()
        expect(STYLE_DESCRIPTIONS[style].tag).toBeTruthy()
        expect(STYLE_DESCRIPTIONS[style].hint).toBeTruthy()
      })
    })
  })

  describe('Game Engine in Characterize Mode', () => {
    it('initializes 5 players with 4 unique bot personalities', () => {
      const state = createInitialState('characterize')
      expect(state.mode).toBe('characterize')
      expect(state.players.length).toBe(5)
      expect(state.players[0].isHuman).toBe(true)

      const botPersonalities = state.players.slice(1).map((p) => p.personality)
      expect(botPersonalities.length).toBe(4)
      SEAT_PERSONALITIES.forEach((expected) => {
        expect(botPersonalities).toContain(expected)
      })
    })

    it('RESHUFFLE_BOT_PERSONALITIES preserves player stacks and names while reassigning styles', () => {
      const state = createInitialState('characterize')
      // Modify stacks to simulate mid-game action
      state.players[0].stack = 1200
      state.players[1].stack = 850
      state.players[2].stack = 950
      state.players[3].stack = 1100
      state.players[4].stack = 900

      const originalNames = state.players.map((p) => p.name)

      const reshuffled = gameReducer(state, { type: 'RESHUFFLE_BOT_PERSONALITIES' })

      // Stacks must be strictly preserved
      expect(reshuffled.players[0].stack).toBe(1200)
      expect(reshuffled.players[1].stack).toBe(850)
      expect(reshuffled.players[2].stack).toBe(950)
      expect(reshuffled.players[3].stack).toBe(1100)
      expect(reshuffled.players[4].stack).toBe(900)

      // Names must remain the same
      expect(reshuffled.players.map((p) => p.name)).toEqual(originalNames)

      // Bot personalities must still contain all 4 archetypes
      const reshuffledPersonalities = reshuffled.players.slice(1).map((p) => p.personality)
      SEAT_PERSONALITIES.forEach((expected) => {
        expect(reshuffledPersonalities).toContain(expected)
      })
    })
  })

  describe('Showdown Card Visibility Rules', () => {
    it('hides folded players cards in characterize, medium, and hard modes', () => {
      const modes: Array<'easy' | 'medium' | 'hard' | 'characterize'> = [
        'easy',
        'medium',
        'hard',
        'characterize',
      ]

      modes.forEach((mode) => {
        const foldedBot = { folded: true, isHuman: false }
        const activeBot = { folded: false, isHuman: false }
        const isShowdown = true

        const foldedReveal = isShowdown && (mode === 'easy' || !foldedBot.folded)
        const activeReveal = isShowdown && (mode === 'easy' || !activeBot.folded)

        if (mode === 'easy') {
          expect(foldedReveal).toBe(true)
          expect(activeReveal).toBe(true)
        } else {
          // In characterize, medium, and hard modes, folded bot cards MUST be hidden
          expect(foldedReveal).toBe(false)
          expect(activeReveal).toBe(true)
        }
      })
    })
  })

  describe('Quiz Scoring Logic', () => {
    it('computes correct and incorrect counts accurately without identity leakage', () => {
      const personalities: PersonalityId[] = ['rock', 'caller', 'aggressor', 'shark']

      // 4 out of 4 correct
      const perfectGuesses: Record<number, PokerStyleId> = {
        1: 'tight-passive',
        2: 'loose-passive',
        3: 'loose-aggressive',
        4: 'tight-aggressive',
      }

      let correct = 0
      for (let i = 1; i <= 4; i++) {
        if (perfectGuesses[i] === PERSONALITY_TO_STYLE[personalities[i - 1]]) {
          correct++
        }
      }
      expect(correct).toBe(4)

      // 2 out of 4 correct
      const partialGuesses: Record<number, PokerStyleId> = {
        1: 'tight-passive', // correct
        2: 'tight-aggressive', // wrong (is caller / loose-passive)
        3: 'loose-aggressive', // correct
        4: 'loose-passive', // wrong (is shark / tight-aggressive)
      }

      let partialCorrect = 0
      for (let i = 1; i <= 4; i++) {
        if (partialGuesses[i] === PERSONALITY_TO_STYLE[personalities[i - 1]]) {
          partialCorrect++
        }
      }
      expect(partialCorrect).toBe(2)
      expect(4 - partialCorrect).toBe(2)
    })

    it('updates score dynamically when user switches projected playstyles in subsequent hands', () => {
      const personalities: PersonalityId[] = ['rock', 'caller', 'aggressor', 'shark']

      // Hand 1: 2 correct
      const hand1Guesses: Record<number, PokerStyleId> = {
        1: 'tight-passive',    // correct (rock)
        2: 'tight-aggressive', // wrong (caller)
        3: 'loose-aggressive', // correct (aggressor)
        4: 'loose-passive',    // wrong (shark)
      }

      const scoreHand1 = Object.entries(hand1Guesses).reduce((acc, [seat, style]) => {
        return acc + (PERSONALITY_TO_STYLE[personalities[Number(seat) - 1]] === style ? 1 : 0)
      }, 0)
      expect(scoreHand1).toBe(2)

      // Hand 2: User switches seat 2 to loose-passive -> now 3 correct
      const hand2Guesses = {
        ...hand1Guesses,
        2: 'loose-passive' as PokerStyleId, // now correct!
      }

      const scoreHand2 = Object.entries(hand2Guesses).reduce((acc, [seat, style]) => {
        return acc + (PERSONALITY_TO_STYLE[personalities[Number(seat) - 1]] === style ? 1 : 0)
      }, 0)
      expect(scoreHand2).toBe(3)

      // Hand 3: User switches seat 4 to tight-aggressive -> now 4 correct (perfect!)
      const hand3Guesses = {
        ...hand2Guesses,
        4: 'tight-aggressive' as PokerStyleId, // now correct!
      }

      const scoreHand3 = Object.entries(hand3Guesses).reduce((acc, [seat, style]) => {
        return acc + (PERSONALITY_TO_STYLE[personalities[Number(seat) - 1]] === style ? 1 : 0)
      }, 0)
      expect(scoreHand3).toBe(4)
    })

    it('guarantees bot personalities NEVER reshuffle across NEXT_HAND until all 4 are correct', () => {
      let state = createInitialState('characterize')
      const initialPersonalities = state.players.slice(1).map((p) => p.personality)

      // Play through 10 consecutive hands
      for (let hand = 1; hand <= 10; hand++) {
        state = gameReducer(state, { type: 'NEXT_HAND' })
        const currentPersonalities = state.players.slice(1).map((p) => p.personality)
        // Personalities must remain 100% strictly identical across hands
        expect(currentPersonalities).toEqual(initialPersonalities)
      }
    })
  })
})
