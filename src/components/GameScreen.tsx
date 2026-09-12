import { useState, useRef, useEffect } from 'react'
import { GameProvider, useGame } from '../state/GameContext'
import type { GameMode, PokerStyleId } from '../types'
import { TopBar } from './TopBar'
import { GameGuideBanner } from './GameGuideBanner'
import { PokerTable } from './PokerTable'
import { ActionControls } from './ActionControls'
import { EducationPanel } from './EducationPanel'
import { HandResultBanner } from './HandResultBanner'
import { InteractiveTutorial } from './InteractiveTutorial'
import { ClockwiseProfiler } from './ClockwiseProfiler'
import { CharacterizeIntroScreen } from './CharacterizeIntroScreen'

function GameScreenInner({ onQuit }: { onQuit: () => void }) {
  const { state, dispatch } = useGame()
  const [showTutorial, setShowTutorial] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [spotlightSeatIndex, setSpotlightSeatIndex] = useState<number | undefined>(undefined)
  const [isProfilingStarted, setIsProfilingStarted] = useState(false)
  const [guesses, setGuesses] = useState<Record<number, PokerStyleId>>({})
  const hasAutoShownTutorialRef = useRef(false)

  const isHumanTurn = state.actingIndex === 0 && !state.isHandOver && !state.isBettingRoundOver
  const isCharacterize = state.mode === 'characterize'
  const isUnsupervised = state.mode === 'unsupervised'

  useEffect(() => {
    if (isHumanTurn && !hasAutoShownTutorialRef.current && !isCharacterize && !isUnsupervised) {
      hasAutoShownTutorialRef.current = true
      setShowTutorial(true)
    }
  }, [isHumanTurn, isCharacterize, isUnsupervised])

  return (
    <div className="relative flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <TopBar
        state={state}
        onQuit={onQuit}
        onOpenTutorial={isCharacterize ? () => setShowHelpModal(true) : undefined}
      />

      {isUnsupervised ? (
        /* Unsupervised Mode: Centered hands-off table with no coach and no post-hand challenge */
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-6">
          <PokerTable state={state} />

          {state.isHandOver ? (
            <HandResultBanner state={state} onNextHand={() => dispatch({ type: 'NEXT_HAND' })} />
          ) : (
            <ActionControls state={state} dispatch={dispatch} />
          )}
        </div>
      ) : isCharacterize ? (
        /* Characterize Mode: Centered hands-off table with no coach */
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-6">
          <GameGuideBanner state={state} />
          <PokerTable state={state} spotlightSeatIndex={spotlightSeatIndex} />

          {state.isHandOver ? (
            !isProfilingStarted ? (
              /* Phase 1: Showdown on display — player reviews the showdown before profiling */
              <HandResultBanner
                state={state}
                buttonLabel="Profile Opponents (4 Bots) →"
                subtitle="Showdown complete! Review the hands above, then profile your opponents clockwise."
                onNextHand={() => setIsProfilingStarted(true)}
              />
            ) : (
              /* Phase 2: Sequential clockwise profiling flow directly below table */
              <ClockwiseProfiler
                players={state.players}
                handNumber={state.handNumber}
                guesses={guesses}
                onUpdateGuesses={setGuesses}
                onNextHand={() => {
                  setIsProfilingStarted(false)
                  dispatch({ type: 'NEXT_HAND' })
                }}
                onReshuffleAndNextHand={() => {
                  setIsProfilingStarted(false)
                  dispatch({ type: 'RESHUFFLE_BOT_PERSONALITIES' })
                  dispatch({ type: 'NEXT_HAND' })
                }}
                onSpotlightSeat={setSpotlightSeatIndex}
              />
            )
          ) : (
            <ActionControls state={state} dispatch={dispatch} />
          )}
        </div>
      ) : (
        /* Teaching Modes: 2-column layout with RHS Coach */
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <GameGuideBanner state={state} />
            <PokerTable state={state} />

            {state.isHandOver ? (
              <HandResultBanner state={state} onNextHand={() => dispatch({ type: 'NEXT_HAND' })} />
            ) : (
              <ActionControls
                state={state}
                dispatch={dispatch}
                onOpenGuide={() => setShowTutorial(true)}
              />
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Coach</h2>
            <EducationPanel mode={state.mode} state={state} snapshot={state.lastDecisionSnapshot} />
          </aside>
        </div>
      )}

      {showTutorial && isHumanTurn && !isCharacterize && !isUnsupervised && (
        <InteractiveTutorial
          mode={state.mode}
          state={state}
          onDismiss={() => setShowTutorial(false)}
        />
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90">
          <CharacterizeIntroScreen
            onStart={() => setShowHelpModal(false)}
            onBack={() => setShowHelpModal(false)}
          />
        </div>
      )}
    </div>
  )
}

export function GameScreen({ mode, onQuit }: { mode: GameMode; onQuit: () => void }) {
  return (
    <GameProvider mode={mode}>
      <GameScreenInner onQuit={onQuit} />
    </GameProvider>
  )
}
