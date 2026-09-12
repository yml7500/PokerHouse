import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GameMode, GameState } from '../types'
import { callAmount } from '../engine/betting'
import { requiredEquity } from '../engine/potOdds'
import { formatChips, formatPercent } from '../utils/format'

interface TutorialStep {
  targetId: string
  title: string
  badge: string
  description: string
}

interface InteractiveTutorialProps {
  mode: GameMode
  state: GameState
  onDismiss: () => void
}

export function InteractiveTutorial({ mode, state, onDismiss }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const human = state.players[0]
  const callAmt = callAmount(human, state.currentBet)
  const reqEquity = requiredEquity(state.pot, callAmt)

  const steps: TutorialStep[] = useMemo(() => {
    if (mode === 'medium') {
      return [
        {
          targetId: 'tutorial-target-pot',
          title: `The Pot vs. Price to Call (${formatChips(state.pot)})`,
          badge: 'Pot Odds Principle',
          description: `Compare the cost to call (${formatChips(callAmt)}) against the total pot you could win (${formatChips(state.pot + callAmt)}).`,
        },
        {
          targetId: 'tutorial-target-pot-odds-bar',
          title: 'The Required Equity Threshold',
          badge: 'Break-Even Price',
          description: `Required Equity = Call / (Pot + Call). Here, ${formatChips(callAmt)} / (${formatChips(state.pot)} + ${formatChips(callAmt)}) = ${formatPercent(reqEquity)}. This is the minimum win rate your hand needs to break even.`,
        },
        {
          targetId: 'tutorial-target-hero',
          title: 'Estimating Strength Under Uncertainty',
          badge: 'Hole Cards & Outs',
          description: `You make decisions under uncertainty without seeing your exact win rate. Count your outs (cards that complete your hand) or evaluate your showdown value against opponent ranges.`,
        },
        {
          targetId: 'tutorial-target-call',
          title: 'The Decision Rule (+EV vs -EV)',
          badge: 'Decision Guidance',
          description: `Look at the Coach panel on the right: "Is your hand strong enough to call into a pot for ${formatPercent(reqEquity)} equity?" If you believe your win rate meets or exceeds ${formatPercent(reqEquity)}, calling is profitable (+EV)!`,
        },
      ]
    }

    if (mode === 'hard') {
      return [
        {
          targetId: 'tutorial-target-hero',
          title: `Your Bankroll (${formatChips(human.stack + human.currentBet)})`,
          badge: 'Capital Management',
          description: `In Advanced mode, chips represent your investment bankroll. The Kelly Criterion maximizes compound wealth growth while protecting against risk of ruin.`,
        },
        {
          targetId: 'tutorial-target-kelly-bar',
          title: 'Payoff Odds (b) & Pot Ratio',
          badge: 'Risk vs Reward',
          description: `The status bar shows your bankroll and net odds b = Pot / Wager. To apply Kelly, you estimate your win probability p under uncertainty without computer assistance.`,
        },
        {
          targetId: 'tutorial-target-raise',
          title: 'Kelly Criterion Formula: f* = p − (q / b)',
          badge: 'Edge Detection',
          description: `A positive edge requires your estimated win rate p to exceed the break-even rate 1 / (b + 1). Use the Bet Slider to scale your wager proportionally to your perceived edge.`,
        },
        {
          targetId: 'tutorial-target-allin',
          title: 'The Coach: Stack Exposure',
          badge: 'Live Guidance',
          description: `The Coach on the right asks: "What percent of your stack are you comfortable exposing given your estimated hand strength?" Aim for Half-Kelly to capture growth while minimizing variance.`,
        },
      ]
    }

    // Default: easy (Beginner)
    return [
      {
        targetId: 'tutorial-target-pot',
        title: `The Blinds & Pot (${formatChips(state.pot)})`,
        badge: 'Table Center',
        description: `Before cards were dealt, the Small Blind ($10) and Big Blind ($20) were automatically posted into the pot. Because the current bet is $20, the price to stay in this hand right now is ${formatChips(callAmt)}.`,
      },
      {
        targetId: 'tutorial-target-hero',
        title: 'Your 2 Hole Cards',
        badge: 'Your Seat',
        description: `These 2 cards are private and visible only to you. You will combine them with 5 shared community cards dealt across the center to make your best 5-card poker hand!`,
      },
      {
        targetId: 'tutorial-target-fold',
        title: 'Fold Button',
        badge: 'Drop Cards · $0',
        description: `Surrender your cards and forfeit this pot. Folding costs $0. Use this when your starting hand is weak to protect the rest of your chips for future hands.`,
      },
      {
        targetId: 'tutorial-target-call',
        title: callAmt > 0 ? `Call ${formatChips(callAmt)} Button` : 'Check Button',
        badge: callAmt > 0 ? 'Match Bet' : 'Pass Turn · $0',
        description:
          callAmt > 0
            ? `Match the current bet of ${formatChips(callAmt)} to stay in the hand and see the first 3 community cards (The Flop).`
            : 'Pass the action to the next player without betting any chips ($0). Available when no one has bet yet!',
      },
      {
        targetId: 'tutorial-target-raise',
        title: state.currentBet === 0 ? 'Bet Button' : 'Raise Button',
        badge: 'Increase Stakes',
        description: `Increase the wager amount using the bet slider below. Raising forces all opponents behind you to either match your higher bet or fold!`,
      },
      {
        targetId: 'tutorial-target-allin',
        title: 'All-in Button',
        badge: 'Maximum Wager',
        description: `Risk all of your remaining chips in this pot. This is the maximum commitment in poker, applying immense pressure to your opponents or protecting a monster hand.`,
      },
    ]
  }, [mode, state.pot, state.currentBet, callAmt, reqEquity, human.stack, human.currentBet])

  const updateRect = useCallback(() => {
    const step = steps[currentStep]
    if (!step) return
    const el = document.getElementById(step.targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    } else {
      setTargetRect(null)
    }
  }, [currentStep, steps])

  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(updateRect)
    }
    handleUpdate()
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate)
    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate)
    }
  }, [updateRect])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1)
        } else {
          onDismiss()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep((prev) => Math.max(0, prev - 1))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, steps.length, onDismiss])

  const step = steps[currentStep]
  const isFinalStep = currentStep === steps.length - 1

  // Mode accent colors
  const accentBorderColor =
    mode === 'hard' ? '#a78bfa' : mode === 'medium' ? '#38bdf8' : '#fbbf24'
  const accentBadgeClass =
    mode === 'hard'
      ? 'border-violet-500/30 bg-violet-500/20 text-violet-300'
      : mode === 'medium'
      ? 'border-sky-500/30 bg-sky-500/20 text-sky-300'
      : 'border-amber-500/30 bg-amber-500/20 text-amber-300'
  const accentButtonClass =
    mode === 'hard'
      ? 'bg-violet-500 hover:bg-violet-400 text-slate-950'
      : mode === 'medium'
      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
  const activeDotClass =
    mode === 'hard' ? 'bg-violet-400' : mode === 'medium' ? 'bg-sky-400' : 'bg-amber-400'

  // Compute card positioning relative to targetRect
  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 60,
  }

  let arrowDirection: 'up' | 'down' = 'down'
  let arrowOffsetLeft = '50%'

  if (targetRect) {
    const cardWidth = Math.min(window.innerWidth - 32, 420)
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2

    // Decide if card sits above or below target
    const isNearBottom = targetCenterY > window.innerHeight * 0.45

    // Clamp horizontal position
    const cardLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetCenterX - cardWidth / 2))
    arrowOffsetLeft = `${Math.max(20, Math.min(cardWidth - 20, targetCenterX - cardLeft))}px`

    if (isNearBottom) {
      arrowDirection = 'down'
      cardStyle = {
        position: 'fixed',
        left: `${cardLeft}px`,
        bottom: `${Math.max(16, window.innerHeight - targetRect.top + 16)}px`,
        width: `${cardWidth}px`,
        zIndex: 60,
      }
    } else {
      arrowDirection = 'up'
      cardStyle = {
        position: 'fixed',
        left: `${cardLeft}px`,
        top: `${Math.max(16, targetRect.bottom + 16)}px`,
        width: `${cardWidth}px`,
        zIndex: 60,
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 select-none">
      {/* Dark tint backdrop with SVG spotlight cutout */}
      <svg className="fixed inset-0 h-full w-full pointer-events-none z-40">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tutorial-spotlight-mask)"
        />
        {/* Animated glowing border around the spotlighted element */}
        {targetRect && (
          <rect
            x={targetRect.left - 6}
            y={targetRect.top - 6}
            width={targetRect.width + 12}
            height={targetRect.height + 12}
            rx="14"
            fill="none"
            stroke={accentBorderColor}
            strokeWidth="3.5"
            strokeDasharray="8 4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Floating Tutorial Speech-Bubble Card */}
      <div
        style={cardStyle}
        className="relative rounded-2xl border-2 bg-neutral-900/95 p-4 sm:p-5 text-neutral-100 shadow-2xl backdrop-blur-md transition-all duration-200"
      >
        {/* Directional Arrow pointing to target */}
        {targetRect && (
          <div
            style={{ left: arrowOffsetLeft }}
            className={`absolute -translate-x-1/2 pointer-events-none ${
              arrowDirection === 'down' ? '-bottom-3.5' : '-top-3.5'
            }`}
          >
            {arrowDirection === 'down' ? (
              <svg width="24" height="14" viewBox="0 0 24 14" style={{ fill: accentBorderColor }} className="drop-shadow-md">
                <polygon points="0,0 24,0 12,14" />
              </svg>
            ) : (
              <svg width="24" height="14" viewBox="0 0 24 14" style={{ fill: accentBorderColor }} className="drop-shadow-md">
                <polygon points="12,0 0,14 24,14" />
              </svg>
            )}
          </div>
        )}

        {/* Card Header: Step counter & Close button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className={`flex h-5 items-center rounded-full px-2 text-[10px] font-black uppercase tracking-wider border ${accentBadgeClass}`}>
              Tutorial · {currentStep + 1} of {steps.length}
            </span>
            <span className="text-[11px] font-semibold text-neutral-400">{step.badge}</span>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer px-1 py-0.5"
            title="Skip tutorial"
          >
            Skip ✕
          </button>
        </div>

        {/* Card Body: Title & Explanation */}
        <div className="py-3">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
            <span>{step.title}</span>
          </h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-200">{step.description}</p>
        </div>

        {/* Card Footer: Step Dots + Navigation Buttons */}
        <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentStep
                    ? `w-5 ${activeDotClass}`
                    : i < currentStep
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-neutral-600 hover:bg-neutral-500'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Stepper Buttons: Next button required to advance */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="rounded-lg border border-white/20 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            )}

            <button
              onClick={() => {
                if (isFinalStep) {
                  onDismiss()
                } else {
                  setCurrentStep((prev) => prev + 1)
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-extrabold shadow-md transition-transform hover:scale-105 cursor-pointer ${accentButtonClass}`}
            >
              <span>{isFinalStep ? "Got It, Let's Play! →" : 'Next →'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
