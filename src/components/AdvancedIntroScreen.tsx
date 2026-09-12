interface AdvancedIntroScreenProps {
  onStart: () => void
  onBack: () => void
}

export function AdvancedIntroScreen({ onStart, onBack }: AdvancedIntroScreenProps) {
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Difficulty: Advanced</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Advanced · Kelly Criterion & Bankroll Theory</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col justify-center py-8 gap-6">
        {/* Concept Card */}
        <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2.5 text-violet-300 font-bold text-base sm:text-lg">
            <span>📈</span>
            <h2>The Kelly Criterion: Maximizing Long-Term Capital Growth</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-200 leading-relaxed">
            Developed by Bell Labs scientist John L. Kelly Jr., the Kelly Criterion answers the ultimate quantitative gambling question: <strong className="text-white">how much of your bankroll should you wager</strong> on an advantageous bet to maximize the exponential growth of your wealth over time while mathematically eliminating the risk of ruin?
          </p>
        </div>

        {/* Formula & Edge Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formula Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">The Core Equation</span>
              <h3 className="mt-1 font-bold text-white text-base">Optimal Wager Fraction (f*)</h3>

              <div className="my-4 flex items-center justify-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-center">
                <span className="text-base font-bold text-neutral-200">f* = p −</span>
                <div className="inline-flex flex-col items-center">
                  <span className="border-b border-violet-400 px-3 pb-0.5 text-base font-bold text-violet-300">q</span>
                  <span className="pt-0.5 text-base font-bold text-violet-300">b</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-violet-200">p</span>
                  <span>Probability of winning your hand</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-violet-200">q = 1 − p</span>
                  <span>Probability of losing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-violet-200">b = Pot / Bet</span>
                  <span>Net payoff odds offered by the pot</span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 italic">
              f* calculates the exact percentage of your bankroll to commit.
            </div>
          </div>

          {/* Half-Kelly & Risk Management Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Risk Management</span>
              <h3 className="mt-1 font-bold text-white text-base">Edge & Half-Kelly Protection</h3>

              <div className="my-3 space-y-2 text-xs sm:text-sm">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                    <span>▲</span> Positive Edge (f* &gt; 0)
                  </div>
                  <p className="mt-0.5 text-neutral-200 text-xs leading-relaxed">
                    You hold a statistical advantage. Wager chips proportionally to your edge!
                  </p>
                </div>

                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                    <span>▼</span> Negative Edge (f* ≤ 0)
                  </div>
                  <p className="mt-0.5 text-neutral-200 text-xs leading-relaxed">
                    The pot odds do not justify betting. Kelly recommends wagering $0 to protect capital.
                  </p>
                </div>

                <div className="rounded-lg border border-violet-500/30 bg-violet-950/30 p-2.5">
                  <div className="font-bold text-violet-300 flex items-center gap-1.5 text-xs">
                    <span>🛡️</span> Half-Kelly Standard
                  </div>
                  <p className="mt-0.5 text-neutral-200 text-xs leading-relaxed">
                    We recommend 50% of f* (capped at 25% stack). It cuts bankroll swing variance in half while capturing 75% of maximum geometric growth.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-neutral-400">
              During the hand, you make decisions under uncertainty. The RHS Coach guides your bankroll exposure with live questions and net odds!
            </div>
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-4 gap-4">
          <div className="text-xs text-neutral-300 text-center sm:text-left">
            On your first turn, an interactive pointer will walk you through the live bankroll, odds, and sizing controls!
          </div>
          <button
            onClick={onStart}
            className="w-full sm:w-auto rounded-xl bg-violet-500 hover:bg-violet-400 px-6 py-2.5 text-sm font-black text-slate-950 shadow-md transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            Start Hand →
          </button>
        </div>
      </div>
    </div>
  )
}
