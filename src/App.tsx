import { useState } from 'react'
import type { GameMode } from './types'
import { HomeScreen } from './components/HomeScreen'
import { BeginnerIntroScreen } from './components/BeginnerIntroScreen'
import { ProficientIntroScreen } from './components/ProficientIntroScreen'
import { AdvancedIntroScreen } from './components/AdvancedIntroScreen'
import { CharacterizeIntroScreen } from './components/CharacterizeIntroScreen'
import { GameScreen } from './components/GameScreen'

function App() {
  const [mode, setMode] = useState<GameMode | null>(null)
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null)

  const handleStartMode = (selectedMode: GameMode) => {
    if (selectedMode === 'unsupervised') {
      setMode('unsupervised')
      setPendingMode(null)
      return
    }
    setPendingMode(selectedMode)
  }

  if (pendingMode === 'easy') {
    return (
      <BeginnerIntroScreen
        onStart={() => {
          setMode('easy')
          setPendingMode(null)
        }}
        onBack={() => setPendingMode(null)}
      />
    )
  }

  if (pendingMode === 'medium') {
    return (
      <ProficientIntroScreen
        onStart={() => {
          setMode('medium')
          setPendingMode(null)
        }}
        onBack={() => setPendingMode(null)}
      />
    )
  }

  if (pendingMode === 'hard') {
    return (
      <AdvancedIntroScreen
        onStart={() => {
          setMode('hard')
          setPendingMode(null)
        }}
        onBack={() => setPendingMode(null)}
      />
    )
  }

  if (pendingMode === 'characterize') {
    return (
      <CharacterizeIntroScreen
        onStart={() => {
          setMode('characterize')
          setPendingMode(null)
        }}
        onBack={() => setPendingMode(null)}
      />
    )
  }

  if (!mode) return <HomeScreen onStart={handleStartMode} />

  return <GameScreen key={mode} mode={mode} onQuit={() => setMode(null)} />
}

export default App
