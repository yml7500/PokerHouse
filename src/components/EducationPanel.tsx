import { useState } from 'react'
import type { GameMode, GameState, DecisionSnapshot } from '../types'
import { callAmount } from '../engine/betting'
import { netOddsForCall } from '../engine/kelly'
import { requiredEquity } from '../engine/potOdds'
import { formatChips, formatPercent } from '../utils/format'
import { buildExplanation, evaluateDecision, easyModeExplanation } from '../engine/education'

interface EducationPanelProps {
  mode: GameMode
  state?: GameState
  snapshot?: DecisionSnapshot
}

function RetrospectiveReview({ mode, snapshot }: { mode: GameMode; snapshot: DecisionSnapshot }) {
  const evaluation = evaluateDecision(mode, snapshot)

  if (mode === 'hard' && snapshot.kelly) {
    const k = snapshot.kelly
    const rawKelly = k.rawKelly ?? k.fullKelly
    const isFreeCheck = snapshot.callAmount === 0 && snapshot.action === 'check'
    const isNegative = rawKelly < 0
    const pPct = formatPercent(snapshot.estimatedEquity)

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-black/30 p-4 text-neutral-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
            Last Action Review · {snapshot.street.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                evaluation.isCorrect
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-rose-400/50 bg-rose-500/20 text-rose-300'
              }`}
            >
              {evaluation.badgeText}
            </span>
            {isFreeCheck ? (
              <span className="rounded-md border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                Free Check
              </span>
            ) : isNegative ? (
              <span className="rounded-md border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                Negative Edge (-EV)
              </span>
            ) : (
              <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Positive Edge (+EV)
              </span>
            )}
          </div>
        </div>

        {/* Top metrics badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[10px] uppercase text-neutral-400">Bankroll</div>
            <div className="font-semibold text-neutral-100">{formatChips(snapshot.bankroll)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[10px] uppercase text-neutral-400">Actual Win Rate (p)</div>
            <div className="font-semibold text-violet-300">{pPct}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[10px] uppercase text-neutral-400">Net Odds (b)</div>
            <div className="font-semibold text-neutral-100">{k.b.toFixed(2)} : 1</div>
          </div>
        </div>

        {/* Formatted Equation without slashes */}
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 shadow-inner">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Kelly Criterion Formula
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm text-neutral-100 flex-wrap">
            <span className="font-bold text-violet-300">f*</span>
            <span className="text-neutral-400">=</span>
            <span>p</span>
            <span className="text-neutral-400">−</span>
            <span className="inline-flex flex-col items-center justify-center leading-none">
              <span className="border-b border-neutral-400 px-1 pb-0.5">q</span>
              <span className="pt-0.5">b</span>
            </span>
            <span className="text-neutral-400">=</span>
            <span>{k.p.toFixed(2)}</span>
            <span className="text-neutral-400">−</span>
            <span className="inline-flex flex-col items-center justify-center leading-none">
              <span className="border-b border-neutral-400 px-1 pb-0.5">{(1 - k.p).toFixed(2)}</span>
              <span className="pt-0.5">{k.b.toFixed(2)}</span>
            </span>
            <span className="text-neutral-400">=</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-xs sm:text-sm ${
                isNegative ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {rawKelly >= 0 ? '+' : ''}{(rawKelly * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Coach Takeaway Banner */}
        <div
          className={`rounded-lg border p-2.5 text-xs leading-relaxed ${
            evaluation.isCorrect
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="font-bold mb-0.5">{evaluation.badgeText}</div>
          <div>{evaluation.summary}</div>
        </div>
      </div>
    )
  }

  if (mode === 'medium') {
    const isPositive = snapshot.estimatedEquity >= snapshot.requiredEquity

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-sky-500/30 bg-black/30 p-4 text-neutral-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Last Action Review · {snapshot.street.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                evaluation.isCorrect
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-rose-400/50 bg-rose-500/20 text-rose-300'
              }`}
            >
              {evaluation.badgeText}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                isPositive
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-rose-400/40 bg-rose-400/10 text-rose-300'
              }`}
            >
              {isPositive ? 'Favorable Odds (+EV)' : 'Unfavorable Odds (-EV)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[10px] uppercase text-neutral-400">Required Equity</div>
            <div className="font-semibold text-sky-300">{formatPercent(snapshot.requiredEquity)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-[10px] uppercase text-neutral-400">Actual Hand Equity</div>
            <div className={`font-semibold ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatPercent(snapshot.estimatedEquity)}
            </div>
          </div>
        </div>

        {/* Coach Takeaway Banner */}
        <div
          className={`rounded-lg border p-2.5 text-xs leading-relaxed ${
            evaluation.isCorrect
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="font-bold mb-0.5">{evaluation.badgeText}</div>
          <div>{evaluation.summary}</div>
        </div>
      </div>
    )
  }

  if (mode === 'easy') {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-black/30 p-4 text-neutral-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Last Action Review · {snapshot.street.toUpperCase()}
          </span>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
              evaluation.isCorrect
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                : 'border-rose-400/50 bg-rose-500/20 text-rose-300'
            }`}
          >
            {evaluation.badgeText}
          </span>
        </div>

        <div
          className={`rounded-lg border p-2.5 text-xs leading-relaxed ${
            evaluation.isCorrect
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="font-bold mb-0.5">{evaluation.badgeText}</div>
          <div>{evaluation.summary}</div>
        </div>

        <div className="text-xs leading-relaxed text-neutral-300">
          {easyModeExplanation(snapshot, snapshot.heroCards, snapshot.boardAtDecision)}
        </div>
      </div>
    )
  }

  const text = buildExplanation(mode, snapshot, snapshot.heroCards, snapshot.boardAtDecision)
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-neutral-300">
      {text}
    </div>
  )
}

export function EducationPanel({ mode, state, snapshot }: EducationPanelProps) {
  const [showPrevReview, setShowPrevReview] = useState(false)

  const human = state?.players[0]
  const isHumanTurn =
    Boolean(state && state.actingIndex === 0 && !state.isHandOver && !state.isBettingRoundOver)

  // When human is actively deciding what to do under uncertainty:
  if (isHumanTurn && state && human) {
    const callAmt = callAmount(human, state.currentBet)
    const reqEquity = requiredEquity(state.pot, callAmt)
    const b = netOddsForCall(state.pot, Math.max(callAmt, state.minRaise))
    const breakEvenProb = 1 / (b + 1)
    const breakEvenRatio = reqEquity > 0 ? (1 / reqEquity).toFixed(1) : '∞'

    return (
      <div className="flex flex-col gap-3">
        {/* Active Live Coaching Card */}
        {mode === 'medium' && (
          <div className="flex flex-col gap-3 rounded-xl border border-sky-500/40 bg-sky-950/25 p-4 text-neutral-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
              <span className="flex items-center gap-1.5 rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 border border-sky-500/30">
                Pot Odds · Live Decision
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 capitalize">{state.street}</span>
            </div>

            {/* Public Table Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">Pot</div>
                <div className="font-bold text-white">{formatChips(state.pot)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">To Call</div>
                <div className="font-bold text-sky-300">{formatChips(callAmt)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">Req. Equity</div>
                <div className="font-bold text-amber-300">{formatPercent(reqEquity)}</div>
              </div>
            </div>

            {/* Guiding Question & Contextual Nudge */}
            <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-3">
              <div className="text-xs font-extrabold text-sky-200">
                {callAmt > 0
                  ? `Is your hand strong enough to call into a pot for ${formatPercent(reqEquity)} equity?`
                  : 'Checking is $0. Do you want to take a free card, or bet for value?'}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-300">
                {callAmt > 0
                  ? `Count your outs or evaluate your showdown value. You need to win roughly 1 in every ${breakEvenRatio} times for calling to be profitable (+EV).`
                  : 'Free cards protect your stack. Only bet if you believe worse hands will call you.'}
              </p>
            </div>
          </div>
        )}

        {mode === 'hard' && (
          <div className="flex flex-col gap-3 rounded-xl border border-violet-500/40 bg-violet-950/25 p-4 text-neutral-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-2">
              <span className="flex items-center gap-1.5 rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 border border-violet-500/30">
                Kelly Criterion · Live Decision
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 capitalize">{state.street}</span>
            </div>

            {/* Public Table Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">Bankroll</div>
                <div className="font-bold text-white">{formatChips(human.stack + human.currentBet)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">Net Odds (b)</div>
                <div className="font-bold text-violet-300">{b.toFixed(1)} : 1</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[9px] uppercase text-neutral-400">Break-Even</div>
                <div className="font-bold text-amber-300">{formatPercent(breakEvenProb)}</div>
              </div>
            </div>

            {/* Guiding Question & Contextual Nudge */}
            <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 p-3">
              <div className="text-xs font-extrabold text-violet-200">
                {callAmt > 0
                  ? 'What percent of your stack are you comfortable exposing given your estimated hand strength?'
                  : 'No cost to continue. What sizing makes sense if you choose to open the betting?'}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-300">
                {callAmt > 0
                  ? `The pot offers ${b.toFixed(1)}:1 net odds. Under Kelly, you have an edge only if your win rate exceeds ${formatPercent(breakEvenProb)}. Scale with the slider if you hold an edge; otherwise, preserve bankroll.`
                  : 'Kelly bets scale with your perceived edge. Zero edge = zero wager. Check to see more cards for free.'}
              </p>
            </div>
          </div>
        )}

        {mode === 'easy' && (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-4 text-neutral-100 shadow-xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <span>💡</span> Coach Tip
            </div>
            <div className="text-xs font-bold text-white">
              It’s your turn! Review your cards and the board.
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Fold weak cards for $0 to protect chips. Check if free, call to see the next cards, or raise if you have high pairs.
            </p>
          </div>
        )}

        {/* Previous Action Review Accordion if a snapshot exists */}
        {snapshot && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <button
              onClick={() => setShowPrevReview((prev) => !prev)}
              className="w-full flex items-center justify-between text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Previous Action Review ({snapshot.street})</span>
              <span>{showPrevReview ? '▲' : '▼'}</span>
            </button>
            {showPrevReview && (
              <div className="mt-3">
                <RetrospectiveReview mode={mode} snapshot={snapshot} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // When NOT human's turn (e.g. bots deliberating, or end of hand, or between rounds):
  if (snapshot) {
    return <RetrospectiveReview mode={mode} snapshot={snapshot} />
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-neutral-400 text-center">
      Waiting for action to reach your seat…
      <div className="mt-1 text-[11px] text-neutral-500">Coach will prompt your decisions under uncertainty.</div>
    </div>
  )
}
