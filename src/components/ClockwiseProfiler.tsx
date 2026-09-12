import { useState, useEffect } from 'react'
import type { PlayerState, PokerStyleId } from '../types'
import { PERSONALITY_TO_STYLE, STYLE_DESCRIPTIONS } from '../engine/personalities'
import { formatChips } from '../utils/format'

interface ClockwiseProfilerProps {
  players: PlayerState[]
  handNumber: number
  guesses: Record<number, PokerStyleId>
  onUpdateGuesses: (guesses: Record<number, PokerStyleId>) => void
  onNextHand: () => void
  onReshuffleAndNextHand: () => void
  onSpotlightSeat: (seatIndex: number | undefined) => void
}

const STYLES: PokerStyleId[] = [
  'tight-aggressive',
  'loose-aggressive',
  'tight-passive',
  'loose-passive',
]

export function ClockwiseProfiler({
  players,
  handNumber,
  guesses,
  onUpdateGuesses,
  onNextHand,
  onReshuffleAndNextHand,
  onSpotlightSeat,
}: ClockwiseProfilerProps) {
  // Clockwise order starting from the player to the user's left:
  // Seat 1 (Lower-Left), Seat 2 (Top-Left), Seat 3 (Top-Right), Seat 4 (Lower-Right)
  const botSeats = [1, 2, 3, 4]
  const [currentStep, setCurrentStep] = useState(0) // 0..3
  const [showAssessment, setShowAssessment] = useState(false)

  const activeSeatIndex = botSeats[currentStep]
  const activeBot = players[activeSeatIndex]

  // Update spotlight on table felt
  useEffect(() => {
    if (!showAssessment && activeSeatIndex !== undefined) {
      onSpotlightSeat(activeSeatIndex)
    } else {
      onSpotlightSeat(undefined)
    }
  }, [activeSeatIndex, showAssessment, onSpotlightSeat])

  const handleSelectStyle = (styleId: PokerStyleId) => {
    const updated = { ...guesses, [activeSeatIndex]: styleId }
    onUpdateGuesses(updated)
    // Selection only updates the read for this bot.
    // Progression to the next bot or assessment is handled manually via the navigation buttons.
  }

  const allChosen = botSeats.every((seatIdx) => guesses[seatIdx] !== undefined)
  const chosenCount = botSeats.filter((seatIdx) => guesses[seatIdx] !== undefined).length

  // Calculate score without identity leakage
  const calculateScore = () => {
    let correctCount = 0
    botSeats.forEach((seatIdx) => {
      const p = players[seatIdx]
      if (p?.personality) {
        const trueStyle = PERSONALITY_TO_STYLE[p.personality]
        if (guesses[seatIdx] === trueStyle) {
          correctCount++
        }
      }
    })
    return {
      correctCount,
      incorrectCount: 4 - correctCount,
      isPerfect: correctCount === 4,
    }
  }

  const score = calculateScore()

  return (
    <div className="w-full rounded-2xl border border-amber-500/30 bg-black/60 p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
      {!showAssessment ? (
        /* Sequential Clockwise Question View */
        <div className="flex flex-col gap-4">
          {/* Header & Clockwise Stepper */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-slate-950">
                {currentStep + 1}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Clockwise Profiling · Opponent {currentStep + 1} of 4
              </span>
            </div>

            {/* Step Pills with Current Read Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {botSeats.map((seatIdx, idx) => {
                const bot = players[seatIdx]
                const isCurrent = idx === currentStep
                const currentStyle = guesses[seatIdx]
                const meta = currentStyle ? STYLE_DESCRIPTIONS[currentStyle] : null

                return (
                  <button
                    key={seatIdx}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'border border-amber-400 bg-amber-500/30 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                        : meta
                        ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : 'border border-white/10 bg-white/5 text-neutral-400 hover:border-white/25'
                    }`}
                  >
                    <span>{bot?.name}</span>
                    {meta ? (
                      <span className="rounded bg-black/40 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-400/30">
                        {meta.tag}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500">?</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Bot Spotlight Summary */}
          {activeBot && (
            <div className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 font-bold text-white shadow ring-2 ring-amber-400">
                  {activeBot.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{activeBot.name}</span>
                    <span className="text-[10px] font-semibold rounded bg-white/10 px-1.5 py-0.5 text-neutral-300">
                      Seat {activeSeatIndex} (
                      {currentStep === 0
                        ? "User's Left"
                        : currentStep === 1
                        ? 'Top-Left'
                        : currentStep === 2
                        ? 'Top-Right'
                        : 'Lower-Right'}
                      )
                    </span>
                    {guesses[activeSeatIndex] && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Current Read: {STYLE_DESCRIPTIONS[guesses[activeSeatIndex]].tag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Stack: <span className="font-semibold text-emerald-300">{formatChips(activeBot.stack)}</span>
                    {activeBot.folded && <span className="ml-2 text-rose-300 font-medium">(Folded this hand)</span>}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 animate-pulse">
                  🎯 Spotlighted on Table
                </span>
              </div>
            </div>
          )}

          {/* Question Prompt */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-200">
              What is <span className="text-amber-300 font-bold">{activeBot?.name}&apos;s</span> playing style?
            </div>
            {allChosen && (
              <button
                onClick={() => setShowAssessment(true)}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                View Assessment Results ({chosenCount}/4) →
              </button>
            )}
          </div>

          {/* 4 Choices Grid (Select style for active bot) */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STYLES.map((styleId) => {
              const meta = STYLE_DESCRIPTIONS[styleId]
              const isSelected = guesses[activeSeatIndex] === styleId

              return (
                <button
                  key={styleId}
                  onClick={() => handleSelectStyle(styleId)}
                  className={`flex flex-col text-left rounded-xl border p-3 transition-all cursor-pointer hover:scale-[1.02] ${
                    isSelected
                      ? `${meta.borderColor} bg-white/10 ring-2 ring-amber-400/80 shadow-lg`
                      : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {meta.title} {isSelected && '✓'}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase rounded px-1.5 py-0.5 border ${meta.badgeColor}`}>
                      {meta.tag}
                    </span>
                  </div>
                  <span className="mt-0.5 text-[11px] text-neutral-400">{meta.subtitle}</span>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-300">{meta.hint}</p>
                </button>
              )
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  ← Previous Opponent
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Early review shortcut: subtle secondary button on steps 0-2 so it is not overly highlighted */}
              {allChosen && currentStep < 3 && (
                <button
                  onClick={() => setShowAssessment(true)}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  Confirm All 4 Reads & View Results →
                </button>
              )}

              {currentStep < 3 ? (
                guesses[activeSeatIndex] !== undefined ? (
                  <button
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md cursor-pointer transition-transform hover:scale-102"
                  >
                    Keep Read & Next Opponent →
                  </button>
                ) : (
                  <button
                    disabled
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-neutral-500 cursor-not-allowed"
                  >
                    Choose Playstyle to Continue →
                  </button>
                )
              ) : (
                /* Final Opponent (Step 4) */
                allChosen ? (
                  <button
                    onClick={() => setShowAssessment(true)}
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md cursor-pointer transition-transform hover:scale-102"
                  >
                    Confirm All 4 Reads & View Results →
                  </button>
                ) : (
                  <button
                    disabled
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-neutral-500 cursor-not-allowed"
                  >
                    Choose Playstyle to View Results →
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Assessment Results Card */
        <div className="flex flex-col items-center gap-4 text-center py-2 animate-fadeIn">
          {score.isPerfect ? (
            /* 4/4 Perfect Score Screen */
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-3xl border-2 border-emerald-400 shadow-xl shadow-emerald-500/30 animate-bounce">
                🎉
              </div>

              <div>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
                  Perfect Deduction · 4 of 4 Correct!
                </span>
                <h2 className="mt-2 text-2xl font-black text-white">Outstanding Deduction!</h2>
              </div>

              <p className="text-sm text-neutral-200 leading-relaxed max-w-lg">
                Congratulations! You have successfully read the table and accurately characterized all 4 opponents under pure uncertainty.
              </p>

              {/* Exact user-requested reshuffling text */}
              <div className="w-full max-w-lg rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-200 shadow-inner">
                The opponents&apos; playstyles have now been reshuffled across the 4 seats. Keep your existing chip stack an see if you can crack the new lineup.
              </div>

              <button
                onClick={() => {
                  onUpdateGuesses({})
                  onReshuffleAndNextHand()
                }}
                className="w-full max-w-md mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/40 transition-transform hover:scale-102 cursor-pointer"
              >
                Start Next Challenge (Reshuffled Round) →
              </button>
            </div>
          ) : (
            /* Partial Score Screen */
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-2xl border-2 border-amber-400/50 shadow-lg">
                📊
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Hand #{handNumber} Assessment
                </span>
                <h2 className="mt-1 text-xl font-extrabold text-white">Profiling Results</h2>
              </div>

              {/* Aggregate Score Display (Zero Individual Leakage) */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Correct</div>
                  <div className="text-2xl font-black text-emerald-300">{score.correctCount}</div>
                </div>
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Incorrect</div>
                  <div className="text-2xl font-black text-rose-300">{score.incorrectCount}</div>
                </div>
              </div>

              {/* Current Hypothesis Recap */}
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Your Current Hypothesis
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {botSeats.map((seatIdx) => {
                    const bot = players[seatIdx]
                    const styleId = guesses[seatIdx]
                    const meta = styleId ? STYLE_DESCRIPTIONS[styleId] : null
                    return (
                      <div
                        key={seatIdx}
                        className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5"
                      >
                        <span className="font-semibold text-white truncate mr-2">{bot?.name}:</span>
                        {meta ? (
                          <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${meta.badgeColor}`}>
                            {meta.tag}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500">Unset</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed max-w-md">
                Opponents&apos; playstyles remain unchanged. Observe betting patterns on future streets to deduce the remaining styles. Your reads are saved.
              </p>

              <div className="flex w-full max-w-md gap-3 mt-1">
                <button
                  onClick={() => {
                    setShowAssessment(false)
                    setCurrentStep(0)
                  }}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/10 cursor-pointer"
                >
                  ← Revise Reads
                </button>
                <button
                  onClick={onNextHand}
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer"
                >
                  Deal Next Hand →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
