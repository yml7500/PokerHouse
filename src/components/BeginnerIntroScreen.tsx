interface BeginnerIntroScreenProps {
  onStart: () => void
  onBack: () => void
}

export function BeginnerIntroScreen({ onStart, onBack }: BeginnerIntroScreenProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 sm:p-10">
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Beginner Level Orientation
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Texas Hold’em Fundamentals</h1>
          </div>
          <button
            onClick={onBack}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            ← Back to Modes
          </button>
        </div>

        {/* Section 1: The Core Objective */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-5 shadow-lg">
          <h2 className="text-base font-bold text-emerald-300 flex items-center gap-2">
            <span>🎯</span> The Objective
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            In Texas Hold’em, your goal is simple: <strong className="text-white">win the chips in the pot</strong>. You
            win either by holding the <strong className="text-white">highest-ranking 5-card poker hand</strong> at
            showdown, or by placing a bet that forces <strong className="text-white">all other players to fold</strong>.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs text-neutral-300">
            <div className="rounded-lg bg-white/5 p-3">
              <span className="font-bold text-neutral-100">2 Hole Cards:</span> Dealt face-down strictly to you. Only
              you can see and use these secret cards.
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <span className="font-bold text-neutral-100">5 Community Cards:</span> Dealt face-up in the center of the
              table. Shared by all players to make the best 5-card hand.
            </div>
          </div>
        </div>

        {/* Section 2: The Blinds & Position */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-5 shadow-lg">
          <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <span>🪙</span> The Blinds & Table Position
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            Poker requires action! Before any cards are dealt, two players must post mandatory starting bets called{' '}
            <strong className="text-white">Blinds</strong>. This guarantees there are always chips to compete for.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                  SB
                </span>
                Small Blind ($10)
              </div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Posted by the player directly clockwise from the dealer button.
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  BB
                </span>
                Big Blind ($20)
              </div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Posted by the player clockwise from the Small Blind. Sets the baseline price to play.
              </p>
            </div>
            <div className="rounded-lg bg-slate-500/10 border border-slate-500/20 p-3">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-slate-100 text-slate-900 text-[9px] font-black flex items-center justify-center">
                  D
                </span>
                Dealer Button (D)
              </div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Action moves clockwise from here. Shifts one seat each hand so blind costs rotate fairly.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Player Actions In-Depth */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-5 shadow-lg">
          <h2 className="text-base font-bold text-indigo-300 flex items-center gap-2">
            <span>🎮</span> Player Actions In-Depth
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            When the action reaches you on your turn, you choose one of these actions:
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <div className="font-bold text-rose-300 text-sm">Fold</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Surrender your cards and step out of the hand. You lose any chips you already committed, but risk{' '}
                <strong className="text-white">$0 more</strong>. Use when your hand is weak.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-600 bg-neutral-800/40 p-3">
              <div className="font-bold text-neutral-200 text-sm">Check</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Pass the action to the next player without betting chips. Only allowed when{' '}
                <strong className="text-white">no one has bet</strong> on the current street.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="font-bold text-emerald-300 text-sm">Call</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Match the highest bet made so far (e.g. $20 Big Blind pre-flop). Keeps you in the hand to see the next
                cards.
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="font-bold text-amber-300 text-sm">Bet / Raise</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Increase the wager amount. Forces all players after you to either match your higher amount or fold. Used
                to build pots with strong hands or bluff.
              </p>
            </div>
            <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-3">
              <div className="font-bold text-fuchsia-300 text-sm">All-in</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Wager your entire remaining stack at once. You can never be forced to fold if you run out of chips—you
                compete for the pot up to your stack size.
              </p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
              <div className="font-bold text-sky-300 text-sm">Bet Slider</div>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Lets you fine-tune exactly how many chips you want to wager when betting or raising, between the minimum
                raise and your full stack.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Hand Flow */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-neutral-300 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">The 4 Streets:</span>
            <span>Pre-Flop (2 hole cards)</span>
            <span className="text-neutral-500">→</span>
            <span>The Flop (3 cards)</span>
            <span className="text-neutral-500">→</span>
            <span>The Turn (4th card)</span>
            <span className="text-neutral-500">→</span>
            <span>The River (5th card)</span>
            <span className="text-neutral-500">→</span>
            <span className="font-semibold text-amber-300">Showdown</span>
          </div>
        </div>

        {/* Start Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            When the action reaches you on the table, an interactive overlay will guide your first decision!
          </div>
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-900/30 transition-all transform hover:scale-105 cursor-pointer"
          >
            Start Hand →
          </button>
        </div>
      </div>
    </div>
  )
}
