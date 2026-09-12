import type { PlayerAction, PlayerState } from '../types'

export function callAmount(player: PlayerState, currentBet: number): number {
  return Math.max(0, Math.min(currentBet - player.currentBet, player.stack))
}

export function legalActions(player: PlayerState, currentBet: number): PlayerAction[] {
  if (player.folded || player.allIn) return []
  const toCall = callAmount(player, currentBet)
  const actions: PlayerAction[] = ['fold']
  if (toCall === 0) actions.push('check')
  else actions.push('call')
  if (player.stack > toCall) actions.push(currentBet === 0 ? 'bet' : 'raise')
  return actions
}

export function isBettingRoundOver(players: PlayerState[], currentBet: number): boolean {
  const live = players.filter((p) => !p.folded)
  if (live.length <= 1) return true
  const contenders = live.filter((p) => !p.allIn)
  if (contenders.length === 0) return true
  return contenders.every((p) => p.hasActed && p.currentBet === currentBet)
}

export function activePlayersRemaining(players: PlayerState[]): number {
  return players.filter((p) => !p.folded).length
}

/** Applies a chip commitment to a player (bet/call/raise/all-in), clamping to their stack. */
export function commitChips(player: PlayerState, amount: number): { player: PlayerState; committed: number } {
  const committed = Math.min(amount, player.stack)
  const updated: PlayerState = {
    ...player,
    stack: player.stack - committed,
    currentBet: player.currentBet + committed,
    totalContributed: player.totalContributed + committed,
    allIn: player.stack - committed === 0,
  }
  return { player: updated, committed }
}
