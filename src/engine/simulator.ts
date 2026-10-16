import type { Card, GameState, PersonalityId, PlayerState } from '../types'
import {
  STARTING_STACK,
  BIG_BLIND,
  REALISTIC_BOT_NAMES,
  gameReducer,
} from './gameEngine'
import { decideAIAction } from './ai'
import { estimateEquity, detectDraws } from './equity'
import { getChenScore } from './handRating'
import { evaluateHand } from './handEvaluator'
import { activePlayersRemaining } from './betting'
import { requiredEquity } from './potOdds'
import { PERSONALITY_TO_STYLE } from './personalities'

export interface SimulationOptions {
  /** Number of hands to simulate (e.g. 1000, 10000, 50000) */
  numHands: number
  /** Number of seats at the table (2 to 9, default: 5) */
  tableSize?: number
  /** Personality archetype per seat. Defaults to standard 5-handed mix */
  personalities?: PersonalityId[]
  /** Custom names for bot seats */
  playerNames?: string[]
  /** Starting chip stack per seat (default: 2000 / 100 BB) */
  startingStack?: number
  /** Small blind amount (default: 10) */
  smallBlind?: number
  /** Big blind amount (default: 20) */
  bigBlind?: number
  /** Equity computation strategy: 'fast' (~3000+ hands/sec) or 'monteCarlo' (~50-100 hands/sec) */
  equityMode?: 'fast' | 'monteCarlo'
  /** Number of Monte Carlo iterations when equityMode === 'monteCarlo' (default: 30) */
  equityIterations?: number
  /** Stack threshold below which player reloads back to startingStack (default: 2 * bigBlind) */
  rebuyThreshold?: number
  /** Progress reporting callback */
  onProgress?: (progress: SimulationProgress) => void
  /** How frequently to fire onProgress callback in hands (default: 1000) */
  progressInterval?: number
}

export interface SimulationProgress {
  handsCompleted: number
  totalHands: number
  elapsedMs: number
  handsPerSecond: number
}

export interface PlayerCalibrationStats {
  seatIndex: number
  name: string
  personality: PersonalityId
  handsDealt: number
  handsWon: number
  winRatePct: number
  netChips: number
  bbPer100: number
  rebuysCount: number
  totalRebuyCost: number
  // Preflop statistics
  vpipCount: number
  vpipPct: number
  pfrCount: number
  pfrPct: number
  // Action counts across all streets
  betsCount: number
  raisesCount: number
  callsCount: number
  checksCount: number
  foldsCount: number
  allInCount: number
  aggressionFactor: number
  aggressionFrequencyPct: number
  // Street progress
  sawFlopCount: number
  sawTurnCount: number
  sawRiverCount: number
  // Showdown statistics
  showdownsReached: number
  showdownsWon: number
  wtsdPct: number
  wsdPct: number
}

export interface TableSummaryStats {
  avgPotSize: number
  handsEndedPreflop: number
  handsEndedFlop: number
  handsEndedTurn: number
  handsEndedRiver: number
  handsEndedAtShowdown: number
  preflopFoldsPct: number
  showdownPct: number
}

export interface SimulationResult {
  totalHands: number
  elapsedMs: number
  handsPerSecond: number
  options: SimulationOptions
  playerStats: PlayerCalibrationStats[]
  personalityAverages: Record<string, {
    personality: PersonalityId
    count: number
    avgNetChips: number
    avgBbPer100: number
    avgVpipPct: number
    avgPfrPct: number
    avgAggressionFactor: number
    avgWtsdPct: number
    avgWsdPct: number
  }>
  tableStats: TableSummaryStats
}

/**
 * Ultra-fast analytical equity estimation for high-throughput bot calibration (~0.002ms/call).
 * Combines Bill Chen starting hand rating preflop with hand solver rankings and draw outs postflop,
 * discounted by the number of active opponents.
 */
export function fastEstimateEquity(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number,
): number {
  if (numOpponents <= 0) return 1.0
  if (!holeCards || holeCards.length < 2) return 1.0 / (numOpponents + 1)

  // 1. Preflop: Bill Chen starting hand score
  if (communityCards.length === 0) {
    const chen = getChenScore(holeCards)
    // Heads-up base win probability (Chen score roughly -1 to 20):
    const headsUpEquity = 0.32 + Math.max(0, chen) * 0.0265
    // Multiway degradation:
    const multiway = Math.pow(headsUpEquity, 1 + (numOpponents - 1) * 0.35)
    return Math.max(0.06, Math.min(0.92, multiway))
  }

  // 2. Postflop: Evaluate current hand rank and drawing potential
  const allCards = [...holeCards, ...communityCards]
  const solved = evaluateHand(allCards)
  const draws = detectDraws(holeCards, communityCards)

  const boardRanks = new Set(communityCards.map((c) => c.rank))
  const isPocketPair = holeCards.length >= 2 && holeCards[0].rank === holeCards[1].rank
  const pairsBoard = holeCards.some((c) => boardRanks.has(c.rank))
  const heroContributedPair = isPocketPair || pairsBoard

  let baseStrength = 0.18
  switch (solved.rank) {
    case 1: // High Card
      baseStrength = 0.18
      break
    case 2: // One Pair
      if (!heroContributedPair) {
        baseStrength = 0.18 // Paired board, hero holds unimproved high card
      } else {
        baseStrength = communityCards.length === 3 ? 0.46 : communityCards.length === 4 ? 0.36 : 0.28
      }
      break
    case 3: // Two Pair
      baseStrength = communityCards.length <= 4 ? 0.70 : 0.60
      break
    case 4: // Three of a Kind
      baseStrength = 0.82
      break
    case 5: // Straight
      baseStrength = 0.90
      break
    case 6: // Flush
      baseStrength = 0.93
      break
    case 7: // Full House
      baseStrength = 0.97
      break
    case 8: // Four of a Kind
    case 9: // Straight Flush
      baseStrength = 0.99
      break
  }

  // Draw bonus using Rule of 2 & 4
  if (communityCards.length < 5) {
    const multiplier = communityCards.length === 3 ? 0.04 : 0.02
    if (draws.hasFlushDraw) baseStrength += 9 * multiplier
    if (draws.hasStraightDraw) baseStrength += 8 * multiplier
  }

  // Discount for active multiway opponents
  const opponentFactor = 1 + (numOpponents - 1) * 0.42
  const equity = baseStrength / opponentFactor

  return Math.max(0.04, Math.min(0.98, equity))
}

/**
 * Simulates [N]k+ hands at high throughput for bot calibration and parameter testing.
 */
export function simulateHands(options: SimulationOptions): SimulationResult {
  const numHands = options.numHands
  const tableSize = Math.max(2, Math.min(9, options.tableSize ?? 5))
  const startingStack = options.startingStack ?? STARTING_STACK
  const bigBlind = options.bigBlind ?? BIG_BLIND
  const equityMode = options.equityMode ?? 'fast'
  const equityIterations = options.equityIterations ?? 30
  const rebuyThreshold = options.rebuyThreshold ?? bigBlind * 2
  const progressInterval = options.progressInterval ?? 1000

  const defaultPersonalities: PersonalityId[] = [
    'shark',
    'aggressor',
    'rock',
    'caller',
    'shark',
    'aggressor',
    'rock',
    'caller',
    'shark',
  ]
  const personalities: PersonalityId[] =
    options.personalities?.slice(0, tableSize) ?? defaultPersonalities.slice(0, tableSize)
  while (personalities.length < tableSize) {
    personalities.push('caller')
  }

  const names = options.playerNames?.slice(0, tableSize) ?? REALISTIC_BOT_NAMES.slice(0, tableSize)
  while (names.length < tableSize) {
    names.push(`Bot-${names.length + 1}`)
  }

  // Internal counters per seat
  const handsDealt = new Array(tableSize).fill(0)
  const handsWon = new Array(tableSize).fill(0)
  const rebuysCount = new Array(tableSize).fill(0)
  const totalRebuyCost = new Array(tableSize).fill(0)

  const vpipCount = new Array(tableSize).fill(0)
  const pfrCount = new Array(tableSize).fill(0)

  const betsCount = new Array(tableSize).fill(0)
  const raisesCount = new Array(tableSize).fill(0)
  const callsCount = new Array(tableSize).fill(0)
  const checksCount = new Array(tableSize).fill(0)
  const foldsCount = new Array(tableSize).fill(0)
  const allInCount = new Array(tableSize).fill(0)

  const sawFlopCount = new Array(tableSize).fill(0)
  const sawTurnCount = new Array(tableSize).fill(0)
  const sawRiverCount = new Array(tableSize).fill(0)

  const showdownsReached = new Array(tableSize).fill(0)
  const showdownsWon = new Array(tableSize).fill(0)

  let handsEndedPreflop = 0
  let handsEndedFlop = 0
  let handsEndedTurn = 0
  let handsEndedRiver = 0
  let handsEndedAtShowdown = 0
  let totalPotSum = 0

  // Create initial state with all seats assigned as AI bots
  const initialPlayers: PlayerState[] = personalities.map((personality, idx) => ({
    id: `sim-bot-${idx}`,
    name: names[idx],
    isHuman: false,
    personality,
    stack: startingStack,
    holeCards: [],
    currentBet: 0,
    totalContributed: 0,
    folded: false,
    allIn: false,
    hasActed: false,
  }))

  let state: GameState = {
    mode: 'characterize',
    players: initialPlayers,
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: bigBlind,
    street: 'preflop',
    dealerIndex: -1,
    sbIndex: -1,
    bbIndex: -1,
    actingIndex: 0,
    handNumber: 0,
    actionLog: [],
    isHandOver: true,
    isBettingRoundOver: true,
    handsPlayed: 0,
    handsWon: 0,
  }

  const startTime = performance.now()

  for (let hand = 0; hand < numHands; hand++) {
    // 1. Rebuy / reload any players who dropped below rebuy threshold
    for (let i = 0; i < tableSize; i++) {
      if (state.players[i].stack <= rebuyThreshold) {
        const reload = startingStack - state.players[i].stack
        totalRebuyCost[i] += reload
        rebuysCount[i]++
        state.players[i] = {
          ...state.players[i],
          stack: startingStack,
          folded: false,
        }
      }
    }

    // 2. Start the hand
    state = gameReducer(state, { type: 'NEXT_HAND' })

    for (let i = 0; i < tableSize; i++) {
      if (!state.players[i].folded) {
        handsDealt[i]++
      }
    }

    // Track state within this single hand
    const playerVpipThisHand = new Set<number>()
    const playerPfrThisHand = new Set<number>()
    let flopRecorded = false
    let turnRecorded = false
    let riverRecorded = false

    let safetyGuard = 250
    let lastPotBeforeShowdown = state.pot

    // Play through the hand
    while (!state.isHandOver && safetyGuard-- > 0) {
      if (state.pot > 0) lastPotBeforeShowdown = state.pot

      if (state.isBettingRoundOver) {
        state = gameReducer(state, { type: 'ADVANCE_STREET' })
        if (state.street === 'flop' && !flopRecorded) {
          flopRecorded = true
          state.players.forEach((p, i) => {
            if (!p.folded) sawFlopCount[i]++
          })
        } else if (state.street === 'turn' && !turnRecorded) {
          turnRecorded = true
          state.players.forEach((p, i) => {
            if (!p.folded) sawTurnCount[i]++
          })
        } else if (state.street === 'river' && !riverRecorded) {
          riverRecorded = true
          state.players.forEach((p, i) => {
            if (!p.folded) sawRiverCount[i]++
          })
        }
        continue
      }

      const actingIdx = state.actingIndex
      const acting = state.players[actingIdx]
      if (!acting || acting.folded || acting.allIn) {
        state = gameReducer(state, { type: 'ADVANCE_STREET' })
        continue
      }

      const numOpp = activePlayersRemaining(state.players) - 1
      const equity =
        equityMode === 'fast'
          ? fastEstimateEquity(acting.holeCards, state.communityCards, numOpp)
          : estimateEquity(acting.holeCards, state.communityCards, numOpp, equityIterations)

      const callAmt = Math.max(0, Math.min(state.currentBet - acting.currentBet, acting.stack))
      const reqEq = requiredEquity(state.pot, callAmt)

      const decision = decideAIAction(acting, {
        pot: state.pot,
        callAmt,
        currentBet: state.currentBet,
        street: state.street,
        equity,
        requiredEquity: reqEq,
        mode: state.mode,
        minRaise: state.minRaise,
        bigBlind,
        communityCards: state.communityCards,
      })

      // Track VPIP & PFR in preflop
      if (state.street === 'preflop') {
        const isVoluntaryCall = decision.action === 'call' && (actingIdx !== state.bbIndex || callAmt > 0)
        const isRaise = decision.action === 'raise' || (decision.action === 'all-in' && decision.amount > state.currentBet)
        const isBet = decision.action === 'bet'

        if (isVoluntaryCall || isRaise || isBet) {
          playerVpipThisHand.add(actingIdx)
        }
        if (isRaise) {
          playerPfrThisHand.add(actingIdx)
        }
      }

      // Track action types
      switch (decision.action) {
        case 'fold':
          foldsCount[actingIdx]++
          break
        case 'check':
          checksCount[actingIdx]++
          break
        case 'call':
          callsCount[actingIdx]++
          break
        case 'bet':
          betsCount[actingIdx]++
          break
        case 'raise':
          raisesCount[actingIdx]++
          break
        case 'all-in':
          allInCount[actingIdx]++
          if (decision.amount > state.currentBet) raisesCount[actingIdx]++
          else callsCount[actingIdx]++
          break
      }

      state = gameReducer(state, {
        type: 'APPLY_ACTION',
        playerIndex: actingIdx,
        action: decision.action,
        amount: decision.amount,
      })
    }

    // Apply recorded VPIP and PFR
    playerVpipThisHand.forEach((idx) => vpipCount[idx]++)
    playerPfrThisHand.forEach((idx) => pfrCount[idx]++)

    // Street termination statistics
    totalPotSum += lastPotBeforeShowdown
    const numCards = state.communityCards.length
    const numActive = activePlayersRemaining(state.players)

    if (numActive <= 1) {
      if (numCards === 0) handsEndedPreflop++
      else if (numCards === 3) handsEndedFlop++
      else if (numCards === 4) handsEndedTurn++
      else handsEndedRiver++
    } else {
      handsEndedAtShowdown++
    }

    // Hand winners & Showdown recording
    if (state.handResult) {
      const isShowdown = numCards === 5 && numActive >= 2
      if (isShowdown) {
        state.players.forEach((p, i) => {
          if (!p.folded) showdownsReached[i]++
        })
        state.handResult.winners.forEach((w) => {
          showdownsWon[w]++
        })
      }

      state.handResult.winners.forEach((w) => {
        handsWon[w]++
      })
    }

    // Periodic progress callback
    if (options.onProgress && (hand + 1) % progressInterval === 0) {
      const now = performance.now()
      const elapsed = now - startTime
      options.onProgress({
        handsCompleted: hand + 1,
        totalHands: numHands,
        elapsedMs: elapsed,
        handsPerSecond: Math.round(((hand + 1) / (elapsed / 1000))),
      })
    }
  }

  const elapsedMs = performance.now() - startTime
  const handsPerSecond = Math.round(numHands / (Math.max(1, elapsedMs) / 1000))

  // Compile final player stats
  const playerStats: PlayerCalibrationStats[] = initialPlayers.map((_, i) => {
    const totalInvested = startingStack + totalRebuyCost[i]
    const finalStack = state.players[i].stack
    const netChips = finalStack - totalInvested
    const dealt = Math.max(1, handsDealt[i])
    const bb = bigBlind

    const totalBetsAndRaises = betsCount[i] + raisesCount[i]
    const totalCalls = callsCount[i]
    const totalAggressiveOpportunities = totalBetsAndRaises + totalCalls + foldsCount[i]

    const af = totalCalls === 0 ? totalBetsAndRaises : Number((totalBetsAndRaises / totalCalls).toFixed(2))
    const afq =
      totalAggressiveOpportunities === 0
        ? 0
        : Number(((totalBetsAndRaises / totalAggressiveOpportunities) * 100).toFixed(1))

    const flopsSeen = Math.max(1, sawFlopCount[i])
    const reachesShowdown = showdownsReached[i]
    const wtsdPct = Number(((reachesShowdown / flopsSeen) * 100).toFixed(1))
    const wsdPct =
      reachesShowdown === 0 ? 0 : Number(((showdownsWon[i] / reachesShowdown) * 100).toFixed(1))

    const bbPer100 = Number(((netChips / bb) / (dealt / 100)).toFixed(2))

    return {
      seatIndex: i,
      name: names[i],
      personality: personalities[i],
      handsDealt: dealt,
      handsWon: handsWon[i],
      winRatePct: Number(((handsWon[i] / dealt) * 100).toFixed(1)),
      netChips,
      bbPer100,
      rebuysCount: rebuysCount[i],
      totalRebuyCost: totalRebuyCost[i],
      vpipCount: vpipCount[i],
      vpipPct: Number(((vpipCount[i] / dealt) * 100).toFixed(1)),
      pfrCount: pfrCount[i],
      pfrPct: Number(((pfrCount[i] / dealt) * 100).toFixed(1)),
      betsCount: betsCount[i],
      raisesCount: raisesCount[i],
      callsCount: callsCount[i],
      checksCount: checksCount[i],
      foldsCount: foldsCount[i],
      allInCount: allInCount[i],
      aggressionFactor: af,
      aggressionFrequencyPct: afq,
      sawFlopCount: sawFlopCount[i],
      sawTurnCount: sawTurnCount[i],
      sawRiverCount: sawRiverCount[i],
      showdownsReached: reachesShowdown,
      showdownsWon: showdownsWon[i],
      wtsdPct,
      wsdPct,
    }
  })

  // Group by personality archetype to provide calibrated archetype averages
  const personalityMap: Record<string, { stats: PlayerCalibrationStats[]; count: number }> = {}
  playerStats.forEach((p) => {
    if (!personalityMap[p.personality]) {
      personalityMap[p.personality] = { stats: [], count: 0 }
    }
    personalityMap[p.personality].stats.push(p)
    personalityMap[p.personality].count++
  })

  const personalityAverages: SimulationResult['personalityAverages'] = {}
  Object.entries(personalityMap).forEach(([pers, group]) => {
    const n = group.count
    personalityAverages[pers] = {
      personality: pers as PersonalityId,
      count: n,
      avgNetChips: Math.round(group.stats.reduce((acc, s) => acc + s.netChips, 0) / n),
      avgBbPer100: Number((group.stats.reduce((acc, s) => acc + s.bbPer100, 0) / n).toFixed(2)),
      avgVpipPct: Number((group.stats.reduce((acc, s) => acc + s.vpipPct, 0) / n).toFixed(1)),
      avgPfrPct: Number((group.stats.reduce((acc, s) => acc + s.pfrPct, 0) / n).toFixed(1)),
      avgAggressionFactor: Number((group.stats.reduce((acc, s) => acc + s.aggressionFactor, 0) / n).toFixed(2)),
      avgWtsdPct: Number((group.stats.reduce((acc, s) => acc + s.wtsdPct, 0) / n).toFixed(1)),
      avgWsdPct: Number((group.stats.reduce((acc, s) => acc + s.wsdPct, 0) / n).toFixed(1)),
    }
  })

  const tableStats: TableSummaryStats = {
    avgPotSize: Math.round(totalPotSum / Math.max(1, numHands)),
    handsEndedPreflop,
    handsEndedFlop,
    handsEndedTurn,
    handsEndedRiver,
    handsEndedAtShowdown,
    preflopFoldsPct: Number(((handsEndedPreflop / numHands) * 100).toFixed(1)),
    showdownPct: Number(((handsEndedAtShowdown / numHands) * 100).toFixed(1)),
  }

  return {
    totalHands: numHands,
    elapsedMs,
    handsPerSecond,
    options,
    playerStats,
    personalityAverages,
    tableStats,
  }
}

/**
 * Generates an aligned, human-readable terminal table from simulation results.
 */
export function formatSimulationReport(result: SimulationResult): string {
  const { totalHands, elapsedMs, handsPerSecond, options, playerStats, personalityAverages, tableStats } = result
  const timeSec = (elapsedMs / 1000).toFixed(2)

  const header = [
    '=================================================================================================================',
    ` PokerHouse Bot Calibration: ${totalHands.toLocaleString()} hands in ${timeSec}s (${handsPerSecond.toLocaleString()} hands/sec)`,
    '=================================================================================================================',
    ` Mode: ${options.equityMode ?? 'fast'} | Blinds: $${options.smallBlind ?? 10}/$${options.bigBlind ?? 20} | Stacks: $${options.startingStack ?? 2000}`,
    ` Avg Pot: $${tableStats.avgPotSize} | Preflop Folds: ${tableStats.preflopFoldsPct}% | Showdowns: ${tableStats.showdownPct}%`,
    '-----------------------------------------------------------------------------------------------------------------',
    ' Seat  Name      Personality       Style             Hands    Net ($)     BB/100   VPIP%   PFR%    AF   WTSD%  W$SD%',
    '-----------------------------------------------------------------------------------------------------------------',
  ]

  const rows = playerStats.map((p) => {
    const seat = p.seatIndex.toString().padEnd(4)
    const name = p.name.padEnd(9)
    const pers = p.personality.padEnd(16)
    const style = (PERSONALITY_TO_STYLE[p.personality] ?? '').padEnd(17)
    const hands = p.handsDealt.toString().padStart(6)
    const sign = p.netChips >= 0 ? '+' : ''
    const net = `${sign}${p.netChips.toLocaleString()}`.padStart(10)
    const bbSign = p.bbPer100 >= 0 ? '+' : ''
    const bb = `${bbSign}${p.bbPer100.toFixed(2)}`.padStart(8)
    const vpip = `${p.vpipPct.toFixed(1)}%`.padStart(7)
    const pfr = `${p.pfrPct.toFixed(1)}%`.padStart(7)
    const af = p.aggressionFactor.toFixed(2).padStart(6)
    const wtsd = `${p.wtsdPct.toFixed(1)}%`.padStart(7)
    const wsd = `${p.wsdPct.toFixed(1)}%`.padStart(7)

    return ` ${seat}  ${name} ${pers}  ${style} ${hands} ${net}  ${bb}  ${vpip} ${pfr} ${af}  ${wtsd} ${wsd}`
  })

  const archetypeHeader = [
    '-----------------------------------------------------------------------------------------------------------------',
    ' Archetype Calibration Summary (Averages Across Seats):',
    ' Personality       Style             Seats    Avg Net ($)    Avg BB/100   Avg VPIP%   Avg PFR%   Avg AF   WTSD%  W$SD%',
    '-----------------------------------------------------------------------------------------------------------------',
  ]

  const archetypeRows = Object.values(personalityAverages).map((a) => {
    const pers = a.personality.padEnd(16)
    const style = (PERSONALITY_TO_STYLE[a.personality] ?? '').padEnd(17)
    const seats = a.count.toString().padStart(5)
    const netSign = a.avgNetChips >= 0 ? '+' : ''
    const net = `${netSign}${a.avgNetChips.toLocaleString()}`.padStart(13)
    const bbSign = a.avgBbPer100 >= 0 ? '+' : ''
    const bb = `${bbSign}${a.avgBbPer100.toFixed(2)}`.padStart(12)
    const vpip = `${a.avgVpipPct.toFixed(1)}%`.padStart(11)
    const pfr = `${a.avgPfrPct.toFixed(1)}%`.padStart(10)
    const af = a.avgAggressionFactor.toFixed(2).padStart(8)
    const wtsd = `${a.avgWtsdPct.toFixed(1)}%`.padStart(7)
    const wsd = `${a.avgWsdPct.toFixed(1)}%`.padStart(7)

    return ` ${pers}  ${style} ${seats}  ${net}  ${bb}  ${vpip} ${pfr} ${af}  ${wtsd} ${wsd}`
  })

  const footer = [
    '=================================================================================================================',
  ]

  return [...header, ...rows, ...archetypeHeader, ...archetypeRows, ...footer].join('\n')
}

/**
 * Returns a JSON serialization of the simulation result.
 */
export function exportSimulationJson(result: SimulationResult): string {
  return JSON.stringify(result, null, 2)
}
