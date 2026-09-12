export function formatChips(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`
}
