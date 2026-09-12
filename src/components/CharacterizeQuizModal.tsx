import { useState, useEffect } from 'react'
import type { PlayerState, PokerStyleId } from '../types'
import { PERSONALITY_TO_STYLE, STYLE_DESCRIPTIONS } from '../engine/personalities'
import { formatChips } from '../utils/format'

interface CharacterizeQuizModalProps {
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

export function CharacterizeQuizModal({
  players,
  handNumber,
  guesses,
  onUpdateGuesses,
  onNextHand,
  onReshuffleAndNextHand,
  onSpotlightSeat,
}: CharacterizeQuizModalProps) {
  // Clockwise bots: Seat 1, Seat 2, Seat 3, Seat 4
  const botSeats = [1, 2, 3, 4]
  const [currentStep, setCurrentStep] = useState(0) // 0..3
  const [localGuesses, setLocalGuesses] = useState<Record<number, PokerStyleId>>({ ...guesses })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const activeSeatIndex = botSeats[currentStep]
  const activeBot = players[activeSeatIndex]

  // Spotlight active seat on the table felt
  useEffect(() => {
    if (!isSubmitted && activeSeatIndex !== undefined) {
      onSpotlightSeat(activeSeatIndex)
    } else {
      onSpotlightSeat(undefined)
    }
  }, [activeSeatIndex, isSubmitted, onSpotlightSeat])

  // Count how many are selected so far
  const totalSelected = botSeats.filter((s) => localGuesses[s] !== undefined).length
  const allSelected = totalSelected === 4

  const handleSelectStyle = (styleId: PokerStyleId) => {
    const next = { ...localGuesses, [activeSeatIndex]: styleId }
    setLocalGuesses(next)
    onUpdateGuesses(next)

    // Advance to next unselected bot or next clockwise bot if available
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  // Calculate score on submission without leaking individual answers
  const calculateScore = () => {
    let correctCount = 0
    botSeats.forEach((seatIdx) => {
      const p = players[seatIdx]
      if (p?.personality) {
        const trueStyle = PERSONALITY_TO_STYLE[p.personality]
        if (localGuesses[seatIdx] === trueStyle) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-neutral-900/95 p-6 shadow-2xl text-neutral-100">
        {!isSubmitted ? (
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Clockwise Opponent Profiling · Hand #{handNumber}
                </span>
                <h2 className="text-lg font-extrabold text-white">Characterize Players</h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <span className="font-bold text-amber-300">{totalSelected}</span>
                <span>/ 4 Selected</span>
              </div>
            </div>

            {/* Circular Seat Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {botSeats.map((seatIdx, idx) => {
                const bot = players[seatIdx]
                const chosen = localGuesses[seatIdx]
                const isActive = idx === currentStep
                return (
                  <button
                    key={seatIdx}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-md scale-105'
                        : chosen
                        ? 'border-emerald-500/40 bg-emerald-950/30 hover:border-emerald-400'
                        : 'border-white/10 bg-black/40 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-bold text-neutral-400">#{idx + 1}</span>
                      <span className="font-semibold text-white truncate max-w-[65px]">{bot?.name}</span>
                    </div>
                    {chosen ? (
                      <span className="text-[9px] font-bold text-emerald-300 truncate max-w-[70px]">
                        {STYLE_DESCRIPTIONS[chosen].tag} ✓
                      </span>
                    ) : (
                      <span className="text-[9px] text-neutral-500">Unset</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active Bot Card */}
            {activeBot && (
              <div className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 font-bold text-white shadow ring-1 ring-amber-400">
                    {activeBot.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{activeBot.name}</span>
                      <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5 text-neutral-300">
                        Seat {activeSeatIndex}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-300">
                      Stack: <span className="font-semibold text-emerald-300">{formatChips(activeBot.stack)}</span>
                      {activeBot.folded && <span className="ml-2 text-rose-300">(Folded this hand)</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Target</span>
                  <div className="text-xs text-neutral-400">Bot {currentStep + 1} of 4</div>
                </div>
              </div>
            )}

            {/* Question */}
            <div className="text-sm font-semibold text-neutral-200">
              What is <span className="text-amber-300">{activeBot?.name}&apos;s</span> playing style?
            </div>

            {/* 4 Choices Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {STYLES.map((styleId) => {
                const meta = STYLE_DESCRIPTIONS[styleId]
                const isCurrentChoice = localGuesses[activeSeatIndex] === styleId

                return (
                  <button
                    key={styleId}
                    onClick={() => handleSelectStyle(styleId)}
                    className={`flex flex-col text-left rounded-xl border p-3 transition-all cursor-pointer ${
                      isCurrentChoice
                        ? `${meta.borderColor} bg-white/10 ring-2 ring-amber-400/80 shadow-lg scale-[1.02]`
                        : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{meta.title}</span>
                      <span className={`text-[10px] font-extrabold uppercase rounded px-1.5 py-0.5 border ${meta.badgeColor}`}>
                        {meta.tag}
                      </span>
                    </div>
                    <span className="mt-0.5 text-[11px] text-neutral-400">{meta.subtitle}</span>
                    <p className="mt-2 text-[10px] leading-relaxed text-neutral-300">{meta.hint}</p>
                  </button>
                )
              })}
            </div>

            {/* Navigation & Submit Bar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Previous Bot
              </button>

              <div className="flex items-center gap-2">
                {currentStep < 3 && (
                  <button
                    onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 cursor-pointer"
                  >
                    Next Bot →
                  </button>
                )}

                <button
                  disabled={!allSelected}
                  onClick={() => setIsSubmitted(true)}
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-transform hover:scale-105"
                >
                  Submit Assessment ({totalSelected}/4)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Submission Results Modal */
          <div className="flex flex-col gap-5 py-2">
            {score.isPerfect ? (
              /* 4/4 Perfect Win Screen */
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl border-2 border-emerald-400 shadow-xl shadow-emerald-500/30 animate-bounce">
                  🎉
                </div>

                <div>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
                    Perfect Deduction · 4 of 4 Correct!
                  </span>
                  <h2 className="mt-3 text-2xl font-black text-white">Outstanding Deduction!</h2>
                </div>

                <p className="text-sm text-neutral-200 leading-relaxed max-w-md">
                  Congratulations! You have successfully read the table and accurately characterized all 4 opponents under pure uncertainty.
                </p>

                {/* User-specified exact reshuffling notification */}
                <div className="w-full rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-200 shadow-inner">
                  The opponents&apos; playstyles have now been reshuffled across the 4 seats. Keep your existing chip stack an see if you can crack the new lineup.
                </div>

                <button
                  onClick={() => {
                    onUpdateGuesses({})
                    onReshuffleAndNextHand()
                  }}
                  className="w-full mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/40 transition-transform hover:scale-102 cursor-pointer"
                >
                  Start Next Challenge (Reshuffled Round) →
                </button>
              </div>
            ) : (
              /* Partial Score Screen */
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-2xl border-2 border-amber-400/50 shadow-lg">
                  📊
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Hand #{handNumber} Evaluation
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold text-white">Profiling Assessment</h2>
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

                <p className="text-xs text-neutral-300 leading-relaxed max-w-md">
                  Keep observing their bet sizings, folds, and calls in the next hand to deduce the remaining styles. Your current selections have been saved.
                </p>

                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/10 cursor-pointer"
                  >
                    ← Review / Change Choices
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
    </div>
  )
}
