import type { GameMode } from '../types'
import { ModeCard } from './ModeCard'

export function HomeScreen({ onStart }: { onStart: (mode: GameMode) => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 py-8 sm:py-12 text-neutral-100">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">PokerHouse</h1>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Row 1: The 3 Teaching-Based Modes */}
        <div className="flex flex-col gap-2.5">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Guided Learning Modes
            </span>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <ModeCard
              mode="easy"
              title="Beginner"
              subtitle="Poker Basics"
              description="Play full hands against 4 AI opponents and get plain-language feedback on your decisions."
              onSelect={onStart}
            />
            <ModeCard
              mode="medium"
              title="Proficient"
              subtitle="Pot Odds"
              description="See the exact pot odds math behind every call and learn to compare it against your hand equity."
              onSelect={onStart}
            />
            <ModeCard
              mode="hard"
              title="Advanced"
              subtitle="Kelly Criterion"
              description="Manage a persistent bankroll using Kelly-criterion sizing guidance layered on top of the poker math."
              onSelect={onStart}
            />
          </div>
        </div>

        {/* Row 2: Hands-Off & Practice Modes */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Hands-Off & Practice Modes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Play / Unsupervised */}
            <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-black/40 to-black/40 p-5 sm:p-6 shadow-xl hover:border-emerald-400/50 transition-all">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Pure Poker
                  </span>
                  <span className="rounded-md bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                    No Coach · No Quiz
                  </span>
                </div>
                <div className="mt-1 text-lg sm:text-xl font-bold text-white">
                  Free Play · Unsupervised
                </div>
                <p className="mt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Play standard Texas Hold&apos;em against 4 bots with no coach, no guides, and no post-hand quiz. Just pure, unsupervised poker at your own pace.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onStart('unsupervised')}
                  className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/40 transition-transform hover:scale-105 cursor-pointer"
                >
                  Play Free Play →
                </button>
              </div>
            </div>

            {/* Characterize Players Mode */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-black/40 to-black/40 p-5 sm:p-6 shadow-xl hover:border-amber-400/50 transition-all">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Profiling Challenge
                  </span>
                  <span className="rounded-md bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                    No Coach
                  </span>
                </div>
                <div className="mt-1 text-lg sm:text-xl font-bold text-white">
                  Characterize Players
                </div>
                <p className="mt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Observe your 4 opponents and deduce whether each is Tight-Aggressive, Loose-Aggressive, Tight-Passive, or Loose-Passive. Identify all 4 styles to win!
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onStart('characterize')}
                  className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/40 transition-transform hover:scale-105 cursor-pointer"
                >
                  Play Challenge →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

