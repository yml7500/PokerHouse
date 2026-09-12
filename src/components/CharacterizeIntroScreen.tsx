import { STYLE_DESCRIPTIONS } from '../engine/personalities'
import type { PokerStyleId } from '../types'

interface CharacterizeIntroScreenProps {
  onStart: () => void
  onBack: () => void
}

const STYLES: PokerStyleId[] = [
  'tight-aggressive',
  'loose-aggressive',
  'tight-passive',
  'loose-passive',
]

export function CharacterizeIntroScreen({ onStart, onBack }: CharacterizeIntroScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="mx-auto w-full max-w-4xl flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Practice Challenge · Hands-Off
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Characterize Players · Opponent Profiling
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col justify-center py-8 gap-6">
        {/* Mission Card */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2.5 text-amber-300 font-bold text-base sm:text-lg">
            <span>🕵️</span>
            <h2>The Challenge: Deduce Hidden Opponent Playstyles</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-200 leading-relaxed">
            In this mode, you are completely hands-off in a normal poker game with <strong className="text-white">no coach, no equity percentages, and no hints</strong>. Even folded players&apos; cards stay face-down at showdown. Your goal is to observe your 4 opponents, recognize their betting lines, and categorize each bot into one of the 4 classic poker archetypes.
          </p>
        </div>

        {/* The 4 Core Playstyles */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            The 4 Classic Poker Archetypes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STYLES.map((styleId) => {
              const meta = STYLE_DESCRIPTIONS[styleId]
              return (
                <div
                  key={styleId}
                  className={`flex flex-col justify-between rounded-2xl border ${meta.borderColor} bg-black/40 p-5 shadow-lg`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-base">{meta.title}</span>
                      <span className={`text-[10px] font-extrabold uppercase rounded px-2 py-0.5 border ${meta.badgeColor}`}>
                        {meta.tag}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-neutral-400 mt-0.5">{meta.subtitle}</div>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-300">{meta.hint}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Rules of the Challenge</span>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-300">1. Hands-Off Play</span>
              <p className="text-neutral-400">
                Play standard Texas Hold&apos;em with no coach guidance. Folded cards stay hidden at showdown.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-300">2. Clockwise Quiz</span>
              <p className="text-neutral-400">
                After each hand, a pop-up spotlights each bot in clockwise order (Seats 1 → 4). Choose their style.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-amber-300">3. Crack & Reshuffle</span>
              <p className="text-neutral-400">
                Score all 4 correct to beat the challenge! Styles will reshuffle across the seats while keeping stacks intact.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-amber-950/50 transition-transform hover:scale-105 cursor-pointer"
          >
            <span>I Understand, Start Challenge →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
