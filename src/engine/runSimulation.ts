#!/usr/bin/env node
/// <reference types="node" />
import { simulateHands, formatSimulationReport, exportSimulationJson } from './simulator'

function parseArgs() {
  const args = process.argv.slice(2)
  let numHands = 10000
  let equityMode: 'fast' | 'monteCarlo' = 'fast'
  let tableSize = 5
  let equityIterations = 30
  let isJson = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      console.log(`
PokerHouse Engine Simulator
Simulate [N]k+ hands at high throughput for bot calibration and testing.

Usage:
  npx jiti ./src/engine/runSimulation.ts [options]
  npm run simulate -- [options]

Options:
  -n, --hands <number>        Number of hands to simulate (default: 10000)
  -m, --mode <fast|monteCarlo> Equity evaluation mode (default: fast)
  -s, --seats <number>        Number of seats/players at the table (2-9, default: 5)
  -i, --iter <number>         Monte Carlo iterations when mode is monteCarlo (default: 30)
  --json                      Output raw JSON results instead of ASCII table
  -h, --help                  Show this help message

Examples:
  npm run simulate -- -n 10000
  npm run simulate -- --hands 50000
  npm run simulate -- --hands 5000 --mode monteCarlo --iter 25
      `)
      process.exit(0)
    } else if (arg === '--hands' || arg === '-n') {
      numHands = parseInt(args[++i], 10) || numHands
    } else if (arg.startsWith('--hands=')) {
      numHands = parseInt(arg.split('=')[1], 10) || numHands
    } else if (arg === '--mode' || arg === '-m') {
      const mode = args[++i]
      if (mode === 'monteCarlo' || mode === 'fast') equityMode = mode
    } else if (arg.startsWith('--mode=')) {
      const mode = arg.split('=')[1]
      if (mode === 'monteCarlo' || mode === 'fast') equityMode = mode
    } else if (arg === '--seats' || arg === '-s') {
      tableSize = parseInt(args[++i], 10) || tableSize
    } else if (arg.startsWith('--seats=')) {
      tableSize = parseInt(arg.split('=')[1], 10) || tableSize
    } else if (arg === '--iter' || arg === '-i') {
      equityIterations = parseInt(args[++i], 10) || equityIterations
    } else if (arg.startsWith('--iter=')) {
      equityIterations = parseInt(arg.split('=')[1], 10) || equityIterations
    } else if (arg === '--json') {
      isJson = true
    } else if (!arg.startsWith('-') && !isNaN(parseInt(arg, 10))) {
      numHands = parseInt(arg, 10)
    }
  }

  // Also support HANDS env variable (e.g. HANDS=25000 npm run simulate)
  if (process.env.HANDS) {
    const envHands = parseInt(process.env.HANDS, 10)
    if (!isNaN(envHands) && envHands > 0) {
      numHands = envHands
    }
  }

  return { numHands, equityMode, tableSize, equityIterations, isJson }
}

async function main() {
  const { numHands, equityMode, tableSize, equityIterations, isJson } = parseArgs()

  if (!isJson) {
    console.log(`\nStarting simulation of ${numHands.toLocaleString()} hands (${equityMode} mode, ${tableSize} seats)...`)
  }

  const result = simulateHands({
    numHands,
    tableSize,
    equityMode,
    equityIterations,
    progressInterval: Math.max(1000, Math.floor(numHands / 10)),
    onProgress: (prog) => {
      if (!isJson) {
        const pct = Math.round((prog.handsCompleted / prog.totalHands) * 100)
        process.stdout.write(`\r  Progress: ${prog.handsCompleted.toLocaleString()} / ${prog.totalHands.toLocaleString()} hands (${pct}%) — ${prog.handsPerSecond.toLocaleString()} hands/sec`)
      }
    },
  })

  if (!isJson) {
    process.stdout.write('\r' + ' '.repeat(80) + '\r') // Clear progress line
    console.log(formatSimulationReport(result))
  } else {
    console.log(exportSimulationJson(result))
  }
}

main().catch((err) => {
  console.error('Simulation error:', err)
  process.exit(1)
})
