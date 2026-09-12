interface ProficientIntroScreenProps {
  onStart: () => void
  onBack: () => void
}

export function ProficientIntroScreen({ onStart, onBack }: ProficientIntroScreenProps) {
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Difficulty: Medium</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Proficient · Pot Odds Masterclass</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col justify-center py-8 gap-6">
        {/* Concept Card */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2.5 text-sky-300 font-bold text-base sm:text-lg">
            <span>📊</span>
            <h2>The Pot Odds Principle: Poker as an Investment</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-200 leading-relaxed">
            In poker, winning players don’t rely on gut feelings. Every time someone bets, they are offering you an investment opportunity. Pot odds compare the <strong className="text-white">price to continue (Call Amount)</strong> against the <strong className="text-sky-300">potential reward (Total Pot)</strong>.
          </p>
        </div>

        {/* Formula & Worked Example Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formula Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">The Mathematical Formula</span>
              <h3 className="mt-1 font-bold text-white text-base">Required Equity</h3>
              
              <div className="my-4 flex items-center justify-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
                <span className="text-sm font-semibold text-neutral-300">Required Equity =</span>
                <div className="inline-flex flex-col items-center">
                  <span className="border-b border-sky-400 px-3 pb-1 text-sm font-bold text-sky-300">Call Amount</span>
                  <span className="pt-1 text-sm font-bold text-sky-300">Total Pot + Call Amount</span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                This equation tells you the <strong className="text-sky-200">exact minimum win rate</strong> your hand needs to break even over time.
              </p>
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 italic">
              Example: $40 Call into $120 Pot → 40 / (120 + 40) = 25%
            </div>
          </div>

          {/* Decision Rule Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Expected Value (+EV)</span>
              <h3 className="mt-1 font-bold text-white text-base">The Golden Decision Rule</h3>

              <div className="my-3 space-y-2 text-xs sm:text-sm">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>✓</span> Positive Expectation (+EV) · CALL
                  </div>
                  <p className="mt-1 text-neutral-200 text-xs leading-relaxed">
                    If your hand’s estimated win probability (Equity) is <strong>greater than or equal</strong> to Required Equity, calling makes money long-term!
                  </p>
                </div>

                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span>✕</span> Negative Expectation (-EV) · FOLD
                  </div>
                  <p className="mt-1 text-neutral-200 text-xs leading-relaxed">
                    If your Equity is <strong>less than</strong> Required Equity, calling loses chips over time. Folding saves your stack for better spots!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-neutral-400">
              During the hand, you make decisions under uncertainty. The RHS Coach will provide live pot odds metrics and guiding questions!
            </div>
          </div>
        </div>

        {/* Bottom CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-4 gap-4">
          <div className="text-xs text-neutral-300 text-center sm:text-left">
            On your first turn, an interactive pointer will guide you through the live Pot Odds calculation bar!
          </div>
          <button
            onClick={onStart}
            className="w-full sm:w-auto rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-2.5 text-sm font-black text-slate-950 shadow-md transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            Start Hand →
          </button>
        </div>
      </div>
    </div>
  )
}
