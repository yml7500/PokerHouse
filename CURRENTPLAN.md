# PokerHouse — Comprehensive Handoff & Architecture Plan

**Status: Production Ready & Fully Playable End-to-End MVP.**
- **Test Suite**: **67 / 67 tests passing** across 10 test suites via Vitest (`npm test`).
- **Production Build**: Clean compilation with `tsc -b && vite build` (zero errors, `dist/` bundle created).
- **Linter**: Clean with zero errors via `oxlint`.
- **Dev Server**: Running live on `http://localhost:5173/` (`npm run dev`).

---

## 1. Executive Summary & Core Gameplay Systems

### A. 100 BB Deep-Stack Structure
- **Starting Stacks**: All 5 players (1 human, 4 bots) start with **$2,000** in chips.
- **Blinds**: Fixed at **$10 Small Blind / $20 Big Blind** (100 BB starting stack depth).
- **Table Chip Invariant**: Strictly conserved at **$10,000** total chips across all betting rounds, runouts, folds, and showdown payouts.
- **Postflop Minimum Bet ($20 / 1 BB)**: On the flop, turn, and river, when opening betting (`currentBet === 0`), the minimum legal bet is **$20 (1 BB)** instead of inheriting preflop's $40 raise amount. Synchronized via render-phase prop adjustments in `ActionControls.tsx`.

### B. Human-Realistic AI Range Filtering (Bill Chen Formula)
- **Modular Preflop Rating in [`src/engine/handRating.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/handRating.ts)**:
  - Starting hands are evaluated on a 0–20 scale using the classic Bill Chen formula (high-card score, pair multiplier, suited bonus, and gap penalties).
  - Gated by a master toggle: `export const ENABLE_HUMAN_RANGE_FILTERING = true`. Setting this to `false` instantly restores pure raw Monte Carlo win-rate equity behavior.
  - **Preflop Sanity Gate**: Unplayable offsuit trash ($7\text{-}2\text{o}$, $8\text{-}3\text{o}$, $9\text{-}2\text{o}$, score $< 4.0$) is folded by all bots when facing an open or raise.
  - Free checks from the Big Blind with zero cost (`callAmt = 0`) are preserved per standard poker rules.
- **Postflop Pure-Air Protection in [`src/engine/ai.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/ai.ts)**:
  - **No Value Betting on Air**: Bots will not fire value bets without at least One Pair, a legitimate draw (Straight/Flush draw), or $>38\%$ equity. Pure air can only be bet as a deliberate bluff.
  - **No Calling Bets with Air**: When facing a bet, bots holding un-paired pure air without a draw automatically fold, eliminating unrealistic human calls with 8-high or Jack-high nothing.

### C. Sharpened AI Personality Archetypes
Located in [`src/engine/ai.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/ai.ts) and [`src/engine/personalities.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/personalities.ts):
- **Tight-Aggressive (TAG / The Shark)**:
  - `minEdge: 0.13`, `foldMargin: 0.04`, `chance: 0.35`, `bluffChance: 0.05`.
  - Attacking style: bets and raises assertively on solid holdings and mathematical edges.
- **Loose-Aggressive (LAG / The Aggressor)**:
  - `minEdge: 0.08`, `foldMargin: 0.01`, `chance: 0.32`, `bluffChance: 0.08`.
  - Dynamic aggression: seizes betting and raising leads even on marginal advantages, contesting pots with wider equity.
- **Tight-Passive (The Rock)**:
  - `minEdge: 0.20`, `foldMargin: 0.08`, `chance: 0.22`, `bluffChance: 0.02`.
  - Cautious and disciplined: only enters with premium holdings; checks and calls until a massive advantage is secured.
- **Loose-Passive (The Caller / Calling Station)**:
  - `minEdge: 0.18`, `foldMargin: -0.08`, `chance: 0.18`, `bluffChance: 0.02`.
  - Wide range: calls down frequently with speculative hands and pairs, rarely initiating raises.

### D. Characterize Players Mode & Circular Opponent Profiling
- **Pure Uncertainty**: Realistic human bot names (Marcus, Elena, Chloe, Darius, etc.) with scrambled hidden playstyles across the 4 seats.
- **Hidden Cards Rule**: Folded players' cards remain hidden at showdown; only active showdown contenders reveal cards.
- **Sequential Clockwise Profiling ([`ClockwiseProfiler.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/ClockwiseProfiler.tsx))**:
  - **Table Spotlighting**: The active opponent being profiled is highlighted on the oval felt with an animated golden ring and table badge.
  - **Manual Progression**: Selecting a playstyle card highlights the choice with a checkmark and golden border without auto-advancing, allowing the player to review their hypothesis before continuing.
  - **Swapped Button Hierarchy**:
    - **"Keep Read & Next Opponent →"**: Prominent primary button (`bg-amber-500 font-black`) placed on the right for standard forward progression.
    - **"Confirm All 4 Reads & View Results →"**: Rendered as a subdued secondary outline button on the left during steps 0–2, activating as the primary action on the final opponent (step 3).
  - **Strict Persona Persistence**: Bot playstyles NEVER reshuffle between hands until the user correctly deduces all 4 archetypes simultaneously (4/4 perfect score).
  - **Celebration & Reshuffle**: Upon 4/4 perfection, displays the celebratory screen and re-randomizes styles across seats while strictly preserving existing chip stacks.
  - **Clean Intro Screen**: The top header "Start Challenge" button has been removed, leaving the single primary "I Understand, Start Challenge →" CTA at the bottom.

### E. Free Play · Unsupervised Mode
- **Zero Supervision**: No coach panel, no equity displays, no equation popups, and no tutorial interruptions.
- **Pure Continuous Poker**: Centered table layout. At the end of each hand, the showdown winner is displayed and a single "Next Hand →" button immediately deals the next hand.
- **Realistic Opponents**: 4 bots with realistic human names (Marcus, Elena, etc.) and randomized playstyle assignments (TAG, LAG, Rock, Caller).
- **Authentic Rules**: 100 BB starting stacks ($2,000), $10/$20 blinds, rotating pucks, postflop $20 min open bet, and folded cards remain face-down at showdown.
- **Direct Entry**: Launches immediately from the Home Screen with zero barrier to entry.

### F. Teaching Modes & Real-Time Educational Features
- **Beginner Mode (Card Strength & Basics)**: Fixed archetype names ("The Rock", "The Caller", etc.) for easy learning; video game-style interactive tutorial; showdown cards revealed for all players.
- **Proficient Mode (Pot Odds & Expected Value)**: Focuses on $RequiredEquity = Call / (Pot + Call)$, comparing raw win probability against pot odds for $+EV$ vs $-EV$ play.
- **Advanced Mode (Kelly Criterion & Bankroll Management)**: Focuses on $f^* = p - q/b$ with half-Kelly bet sizing recommendations and bankroll survival principles.
- **In-Game Deliberation**: Win equity is hidden during decision making to prevent artificial crutches; coach provides concise guiding questions.
- **Positive Reinforcement**: Displays `✓ Correct Decision` badge with affirmative feedback when folding in $-EV$ spots or taking mathematically optimal lines.
- **True Horizontal Fraction Bars**: Kelly equations formatted with true horizontal division bars (no ASCII slashes).

### G. Clean Visual Hierarchy & Single-CTA UX
- **Distraction-Free Intro Screens**: Removed duplicate/redundant "Start Hand →" and "Start Challenge →" buttons from the header bars of [`ProficientIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/ProficientIntroScreen.tsx), [`AdvancedIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/AdvancedIntroScreen.tsx), and [`CharacterizeIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/CharacterizeIntroScreen.tsx). Players now have a single, prominent CTA at the bottom after reviewing the rules.
- **Clean Home Screen Header**: Removed the auxiliary subtitle ("Learn poker by actually playing it.") in [`HomeScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/HomeScreen.tsx), presenting a crisp and modern **PokerHouse** brand banner.
- **Two-Tier Mode Selection**:
  - **Row 1 (Guided Learning)**: Beginner (`easy`), Proficient (`medium`), and Advanced (`hard`).
  - **Row 2 (Hands-Off & Practice)**: Free Play · Unsupervised (`unsupervised`) and Characterize Players (`characterize`).

---

## 2. Directory & Component Breakdown

### Engine Layer (`src/engine/`)
| File | Purpose | Test Suite |
|------|---------|------------|
| [`gameEngine.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/gameEngine.ts) | Core reducer managing state transitions: `START_HAND`, `NEXT_HAND`, `APPLY_ACTION`, `ADVANCE_STREET`, `RESHUFFLE_BOT_PERSONALITIES`. Enforces blinds, payouts, 100 BB stacks, and postflop $20 min bets. | [`gameEngine.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/gameEngine.test.ts) (9 tests) |
| [`handRating.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/handRating.ts) | Bill Chen Formula scoring, preflop range filtering, and `ENABLE_HUMAN_RANGE_FILTERING` feature flag. | [`handRating.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/handRating.test.ts) (5 tests) |
| [`ai.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/ai.ts) | AI decision tree: preflop Chen check, postflop made-hand/draw check, bluffing logic, Kelly sizing, and aggression levers. | [`ai.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/ai.test.ts) (7 tests) |
| [`personalities.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/personalities.ts) | Archetype definitions, metadata, badges, hints, and `PERSONALITY_TO_STYLE` mappings. | Covered in characterize tests |
| [`betting.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/betting.ts) | Legal action calculations, call amounts, chip commitment, and round completion checks. | Shared across engine tests |
| [`deck.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/deck.ts) | Standard 52-card deck generator, Fisher-Yates shuffle, and card drawing. | [`deck.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/deck.test.ts) (3 tests) |
| [`handEvaluator.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/handEvaluator.ts) | Wrapper around `pokersolver` for hand ranking, description generation, and winner determination. | [`handEvaluator.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/handEvaluator.test.ts) (4 tests) |
| [`equity.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/equity.ts) | Monte Carlo equity estimator (~300 runouts) and flush/straight draw detection. | [`equity.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/equity.test.ts) (6 tests) |
| [`potOdds.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/potOdds.ts) | Mathematical calculation of required equity based on pot odds ($Call / (Pot + Call)$). | [`potOdds.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/potOdds.test.ts) (3 tests) |
| [`kelly.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/kelly.ts) | Kelly Criterion implementation: $f^* = (b \cdot p - q) / b$, preserving negative edge for coaching. | [`kelly.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/kelly.test.ts) (8 tests) |
| [`education.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/education.ts) | Post-action evaluation and dynamic feedback generation for Beginner, Proficient, and Advanced modes. | [`education.test.ts`](file:///Users/yumingliu/Projects/PokerHouse/src/engine/__tests__/education.test.ts) (14 tests) |

### UI Layer (`src/components/`, `src/state/`)
| Component | Responsibility |
|-----------|----------------|
| [`GameScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/GameScreen.tsx) | Master game orchestrator: manages mode transitions, intro screens, interactive tutorial, table display, coach panel, and Characterize profiling flow. |
| [`PokerTable.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/PokerTable.tsx) | Oval poker table rendering 5 seats clockwise, community cards, pot chip display, and active spotlighting. |
| [`Seat.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/Seat.tsx) | Individual seat rendering: player name, chips, hole cards (with hidden-card support), D/SB/BB pucks, and "Thinking…" animation. |
| [`ActionControls.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/ActionControls.tsx) | Betting action bar (Fold, Check, Call, Bet/Raise, All-in, Slider) with postflop $20 min bet synchronization. |
| [`BetSlider.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/BetSlider.tsx) | Chip wagering range input and direct numeric input. |
| [`ClockwiseProfiler.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/ClockwiseProfiler.tsx) | Characterize Players post-hand deduction quiz with manual step advancement, swapped button hierarchy, and 4/4 victory screen. |
| [`EducationPanel.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/EducationPanel.tsx) | RHS Coach panel for teaching modes: live deliberation hints, decision evaluation badges, and mathematical breakdowns. |
| [`InteractiveTutorial.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/InteractiveTutorial.tsx) | Video game-style paused tutorial engine with dark overlay cutout, target bounding rings, and step-by-step pointers. |
| [`BeginnerIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/BeginnerIntroScreen.tsx) | Pre-game briefing for Beginner mode. |
| [`ProficientIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/ProficientIntroScreen.tsx) | Pre-game briefing for Proficient mode (Pot Odds & Required Equity). |
| [`AdvancedIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/AdvancedIntroScreen.tsx) | Pre-game briefing for Advanced mode (Kelly Criterion). |
| [`CharacterizeIntroScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/CharacterizeIntroScreen.tsx) | Pre-game briefing for Characterize Players mode. |
| [`HandResultBanner.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/HandResultBanner.tsx) | Hand completion banner with showdown display pause and "Profile Opponents" / "Next Hand" buttons. |
| [`HomeScreen.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/components/HomeScreen.tsx) | Mode selection portal. |
| [`GameContext.tsx`](file:///Users/yumingliu/Projects/PokerHouse/src/state/GameContext.tsx) | Global React context holding engine state, automated bot turn pacing (2.1s), and street advance timer. |

---

## 3. Session Artifacts Index

All planning documents, technical designs, and walkthroughs created during this project lifecycle are stored in the artifact directory (`.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/`):

1. **[`walkthrough.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/walkthrough.md)**: Master progress walkthrough detailing all 17 completed functional areas and test outcomes.
2. **[`update_currentplan_handoff_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/update_currentplan_handoff_plan.md)**: Plan for updating CURRENTPLAN.md with full session deliverables.
3. **[`min_bet_and_characterize_profiler_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/min_bet_and_characterize_profiler_plan.md)**: Plan for postflop $20 min open bet fix and manual Characterize deduction flow with swapped buttons.
4. **[`tune_aggressive_profiles_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/tune_aggressive_profiles_plan.md)**: Tuning TAG/LAG aggression thresholds (`minEdge` and `foldMargin`).
5. **[`tighten_loose_ai_and_2000_stack_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/tighten_loose_ai_and_2000_stack_plan.md)**: $2,000 100 BB starting stacks and Bill Chen Formula preflop range filtering.
6. **[`make_passive_players_less_passive_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/make_passive_players_less_passive_plan.md)**: Adjusting Rock and Caller aggression levers to prevent extreme under-betting.
7. **[`bot_playstyles_architecture.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/bot_playstyles_architecture.md)**: Comprehensive architectural breakdown of all 4 AI personalities, mathematical models, and edge equations.
8. **[`characterize_mode_refinement_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/characterize_mode_refinement_plan.md)**: Persona persistence across hands, multi-hand hypothesis tracking, and stack-preserving victory reshuffle.
9. **[`characterize_players_mode_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/characterize_players_mode_plan.md)**: Initial architecture for Characterize Players mode, circular quiz, and hidden showdown cards.
10. **[`correct_decision_reinforcement_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/correct_decision_reinforcement_plan.md)**: `✓ Correct Decision` badge and coach praise for disciplined -EV folds.
11. **[`bot_thinking_time_2_1s_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/bot_thinking_time_2_1s_plan.md)**: 2.1-second bot thinking delay with "Thinking…" UI state.
12. **[`hidden_equity_and_live_coach_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/hidden_equity_and_live_coach_plan.md)**: Hiding live win probability during active turns and rendering concise coach guiding questions.
13. **[`proficient_and_advanced_tutorials_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/proficient_and_advanced_tutorials_plan.md)**: Briefing screens for Proficient and Advanced modes.
14. **[`video_game_tutorial_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/video_game_tutorial_plan.md)**: Interactive video game-style tutorial cutout engine with step-by-step "Next →" progression.
15. **[`beginner_intro_and_action_overlay_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/beginner_intro_and_action_overlay_plan.md)**: Beginner introduction screen and action button tooltips.
16. **[`beginner_guide_and_thinking_time_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/beginner_guide_and_thinking_time_plan.md)**: Top guide banner and timing refinements.
17. **[`kelly_criterion_coaching_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/kelly_criterion_coaching_plan.md)**: Horizontal fraction formatting and negative edge handling in Kelly calculations.
18. **[`clockwise_poker_and_bot_polish_plan.md`](file:///Users/yumingliu/.gemini/antigravity-cli/brain/5ba5b1b9-8d28-47ab-bce8-ead022be7907/clockwise_poker_and_bot_polish_plan.md)**: Clockwise seat layout, rotating dealer and blind pucks, and realistic bot names.

---

## 4. Operational Commands & Verification

### Running the Application
```bash
# Start Vite development server
npm run dev
# Server accessible at: http://localhost:5173/
```

### Running Automated Tests
```bash
# Execute full Vitest test suite (67 tests across 10 test files)
npm test
```

### Production Build & Linting
```bash
# Type check and build production bundle
npm run build

# Run Oxlint
npm run lint
```

---

## 5. Scope Boundaries (Hackathon Allowances)
The following are intentionally out of scope for this offline educational MVP:
1. Multi-way uneven side pots (main pot handles all all-in payouts with proportional awards).
2. Blind level escalation (fixed $10/$20 blinds for pure cash game structure).
3. Remote multiplayer or persistent database storage (all state resides cleanly in memory per session).
