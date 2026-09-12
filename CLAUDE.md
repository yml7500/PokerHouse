# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) then bundle (`vite build`)
- `npm test` — run all tests (`vitest run`)
- `npx vitest run <path>` — run a single test file; `npx vitest run -t "<name>"` to filter by test name
- `npm run lint` — run `oxlint`
- `npm run preview` — preview a production build

## Architecture

PokerHouse is a client-only, single-player Texas Hold'em trainer (human vs. 4 AI personalities) with five distinct modes:
1. **Beginner (`easy`)**: Poker basics, descriptive archetype names ("The Rock", "The Caller", etc.), interactive step-by-step tutorial, showdown card reveal.
2. **Proficient (`medium`)**: Pot odds & expected value coaching, realistic human bot names, randomized playstyles.
3. **Advanced (`hard`)**: Kelly Criterion ($f^* = p - q/b$) half-Kelly bet sizing, bankroll survival principles.
4. **Characterize Players (`characterize`)**: Deduce opponent playstyles over multiple hands without card reveals at showdown, persistent identities across hands, and circular table-spotlighted deduction quiz.
5. **Free Play · Unsupervised (`unsupervised`)**: Unsupervised continuous poker against 4 bots with zero coach, zero quizzes, and immediate "Next Hand" action.

All modes run on a single shared poker engine with 100 BB starting stacks ($2,000 stack, $10/$20 blinds), modular Bill Chen preflop range filtering (`ENABLE_HUMAN_RANGE_FILTERING`), and postflop $20 (1 BB) minimum open bets. No backend, no auth, no persistence beyond in-memory React state.

Tailwind is v4 via the `@tailwindcss/vite` plugin (`vite.config.ts`), not the classic `tailwind.config.js` + PostCSS pipeline — `src/index.css` just does `@import "tailwindcss";`.

`pokersolver` (hand evaluation) has no published types; the ambient module declaration lives in `src/types/pokersolver.d.ts`. Internal `Card` objects serialize directly to its string format (`"Ah"`, `"Td"`, `"2s"`) via `cardToString` in `src/engine/deck.ts` — no other translation layer.

`src/types/index.ts` is the single source of truth for shared types (`Card`, `PlayerState`, `GameState`, `DecisionSnapshot`, etc.) — check here first when tracing data flow between modules.

### Engine layer (`src/engine/`)

A strict pure-function core, isolated from React, with each piece independently unit-tested under `src/engine/__tests__/`. Dependency order:

`deck.ts` → `handEvaluator.ts` (wraps `pokersolver`) → `equity.ts` (Monte Carlo win-probability estimator built on the evaluator) → `potOdds.ts` / `kelly.ts` (pure math, both tested against the spec's own worked examples) → `personalities.ts` (static AI trait table) → `ai.ts` (per-personality decision function combining equity, pot odds, a Kelly multiplier, and randomness) → `betting.ts` (legal-action / betting-round-over helpers) → `gameEngine.ts` (the actual reducer — `createInitialState`, `gameReducer` handling `START_HAND` / `APPLY_ACTION` / `ADVANCE_STREET` / `NEXT_HAND`) → `education.ts` (turns a `DecisionSnapshot` into mode-specific explanation text).

Two conventions to preserve when touching this layer:

- **Pot accounting**: the `pot` argument passed to `potOdds.ts`'s `requiredEquity` (and to the Kelly net-odds calculation) must already include the opponent's current-street bet — never add it a second time. See the worked example in `potOdds.ts`'s own tests.
- **Single mode field, one engine**: `GameMode` (`'easy' | 'medium' | 'hard' | 'unsupervised' | 'characterize'`) is threaded through `gameEngine` / `ai` / `education` as plain data. All modes run the exact same betting/dealing/showdown core — only AI sizing, education overlays, and post-hand flows vary. Don't fork the engine per mode.

### UI layer (`src/state/`, `src/components/`)

`src/state/GameContext.tsx` exports `GameProvider` + `useGame()`. It wraps `useReducer(gameReducer, ...)` and runs two driver `useEffect`s against the pure engine above: one fires an AI's decision (`estimateEquity` → `requiredEquity` → `decideAIAction` → dispatch `APPLY_ACTION`) after a short delay when it's an AI's turn; the other dispatches `ADVANCE_STREET` after a short delay once `isBettingRoundOver` is true. **Both effects must depend on the whole `state` object, not a subset of its fields** — an earlier bug had the street-advance effect depending on only `[state.isBettingRoundOver, state.isHandOver]`, which stayed unchanged across every street of an all-in runout (nobody left to act, so the flag stays `true` street after street), so React never re-fired it past the first `ADVANCE_STREET` and the board froze before the river. Fixed by depending on `[state]`, matching the AI-turn effect.

`src/components/` holds one component per concern (`PlayingCard`, `Seat`, `CommunityCards`, `PotDisplay`, `PokerTable`, `ActionControls` + `BetSlider`, `EducationPanel`, `HandResultBanner`, `TopBar`, `GameScreen`, `HomeScreen`, `ModeCard`, `ClockwiseProfiler`, `InteractiveTutorial`). The one wiring rule worth knowing before touching `ActionControls.tsx`: it computes equity/pot-odds/Kelly via `useMemo` and builds the `DecisionSnapshot` itself, at the moment a button is clicked, then passes it as `APPLY_ACTION`'s `snapshot` field — only for the human (`playerIndex: 0`). AI actions must never attach a `snapshot`, since `state.lastDecisionSnapshot` is what `EducationPanel` renders and it should only ever reflect the human's own last decision.

Mode display names shown to the user are **Beginner / Proficient / Advanced / Characterize Players / Free Play · Unsupervised**; the internal `GameMode` type values are `'easy' | 'medium' | 'hard' | 'characterize' | 'unsupervised'`.

For what's built vs. not, known rough edges, and next steps, see `CURRENTPLAN.md` at the repo root.
