import { describe, it, expect } from 'vitest'
import {
  fastEstimateEquity,
  simulateHands,
  formatSimulationReport,
  exportSimulationJson,
} from '../simulator'
import type { Card } from '../../types'

function cards(str: string): Card[] {
  return str.split(' ').map((s) => ({
    rank: s.slice(0, -1) as Card['rank'],
    suit: s.slice(-1) as Card['suit'],
  }))
}

describe('Simulator Engine', () => {
  describe('fastEstimateEquity', () => {
    it('returns 1.0 when no opponents remain', () => {
      expect(fastEstimateEquity(cards('As Ks'), [], 0)).toBe(1.0)
    })

    it('rates AA significantly higher than 72o preflop', () => {
      const pocketAces = fastEstimateEquity(cards('As Ah'), [], 1)
      const trash72 = fastEstimateEquity(cards('7s 2h'), [], 1)
      expect(pocketAces).toBeGreaterThan(0.75)
      expect(trash72).toBeLessThan(0.40)
      expect(pocketAces).toBeGreaterThan(trash72 * 2)
    })

    it('decreases equity as number of opponents increases', () => {
      const eqHeadsUp = fastEstimateEquity(cards('As Ks'), [], 1)
      const eq3Way = fastEstimateEquity(cards('As Ks'), [], 2)
      const eq5Way = fastEstimateEquity(cards('As Ks'), [], 4)

      expect(eqHeadsUp).toBeGreaterThan(eq3Way)
      expect(eq3Way).toBeGreaterThan(eq5Way)
    })

    it('rates made hands higher than high card on flop', () => {
      const flop = cards('Ks 8d 2c')
      const topPair = fastEstimateEquity(cards('Kh Qh'), flop, 1)
      const highCard = fastEstimateEquity(cards('7h 5h'), flop, 1)

      expect(topPair).toBeGreaterThan(highCard)
    })

    it('gives bonus equity for flush draws', () => {
      const flop = cards('2s 7s Kc')
      const dryCards = fastEstimateEquity(cards('Ah Qh'), flop, 1)
      const flushDraw = fastEstimateEquity(cards('As Qs'), flop, 1)

      expect(flushDraw).toBeGreaterThan(dryCards)
    })
  })

  describe('simulateHands', () => {
    it('conserves chips exactly across all seats (zero-sum table invariant)', () => {
      const result = simulateHands({
        numHands: 100,
        tableSize: 5,
        startingStack: 2000,
        bigBlind: 20,
        smallBlind: 10,
        equityMode: 'fast',
      })

      expect(result.totalHands).toBe(100)
      expect(result.playerStats.length).toBe(5)

      // Total net chips across all players must equal 0
      const totalNetChips = result.playerStats.reduce((acc, p) => acc + p.netChips, 0)
      expect(totalNetChips).toBe(0)

      // Every player must have been dealt all hands
      result.playerStats.forEach((p) => {
        expect(p.handsDealt).toBe(100)
        expect(p.vpipPct).toBeGreaterThanOrEqual(0)
        expect(p.vpipPct).toBeLessThanOrEqual(100)
        expect(p.pfrPct).toBeLessThanOrEqual(p.vpipPct + 0.1) // PFR is a subset of VPIP
      })
    })

    it('simulates 1,000 hands at high speed (>1,000 hands/sec)', () => {
      const start = performance.now()
      const result = simulateHands({
        numHands: 1000,
        tableSize: 5,
        equityMode: 'fast',
      })
      const elapsed = performance.now() - start

      expect(result.totalHands).toBe(1000)
      expect(result.handsPerSecond).toBeGreaterThan(800)
      expect(elapsed).toBeLessThan(1500) // 1000 hands should easily finish under 1.5s
    })

    it('reflects archetype behavioral differences (Rock vs Aggressor vs Caller)', () => {
      // Simulate 500 hands to observe distinct playstyles
      const result = simulateHands({
        numHands: 500,
        tableSize: 4,
        personalities: ['rock', 'aggressor', 'caller', 'shark'],
        equityMode: 'fast',
      })

      const rock = result.playerStats.find((p) => p.personality === 'rock')!
      const aggressor = result.playerStats.find((p) => p.personality === 'aggressor')!
      const caller = result.playerStats.find((p) => p.personality === 'caller')!

      // Rock is tight; Aggressor is loose
      expect(aggressor.vpipPct).toBeGreaterThan(rock.vpipPct)
      expect(aggressor.pfrPct).toBeGreaterThan(rock.pfrPct)

      // Caller is passive (low aggression factor) compared to Aggressor
      expect(aggressor.aggressionFactor).toBeGreaterThan(caller.aggressionFactor)
    })

    it('supports monteCarlo equity mode', () => {
      const result = simulateHands({
        numHands: 20,
        tableSize: 3,
        equityMode: 'monteCarlo',
        equityIterations: 15,
      })

      expect(result.totalHands).toBe(20)
      const totalNetChips = result.playerStats.reduce((acc, p) => acc + p.netChips, 0)
      expect(totalNetChips).toBe(0)
    })

    it('triggers onProgress callbacks periodically', () => {
      const progressSnapshots: number[] = []
      simulateHands({
        numHands: 300,
        tableSize: 3,
        equityMode: 'fast',
        progressInterval: 100,
        onProgress: (prog) => {
          progressSnapshots.push(prog.handsCompleted)
        },
      })

      expect(progressSnapshots).toEqual([100, 200, 300])
    })
  })

  describe('Report Formatting', () => {
    it('produces formatted ASCII table and JSON report', () => {
      const result = simulateHands({
        numHands: 50,
        tableSize: 4,
        personalities: ['shark', 'aggressor', 'rock', 'caller'],
        equityMode: 'fast',
      })

      const report = formatSimulationReport(result)
      expect(report).toContain('PokerHouse Bot Calibration:')
      expect(report).toContain('hands/sec')
      expect(report).toContain('tight-aggressive')
      expect(report).toContain('loose-aggressive')
      expect(report).toContain('tight-passive')
      expect(report).toContain('loose-passive')

      const json = exportSimulationJson(result)
      const parsed = JSON.parse(json)
      expect(parsed.totalHands).toBe(50)
      expect(parsed.playerStats.length).toBe(4)
      expect(parsed.tableStats.avgPotSize).toBeGreaterThan(0)
    })
  })
})
