import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcPoints(
  predHome: number | null,
  predAway: number | null,
  resultHome: number | null,
  resultAway: number | null
): number | null {
  if (resultHome === null || resultAway === null) return null
  if (predHome === null || predAway === null) return 0
  if (predHome === resultHome && predAway === resultAway) return 2
  const predSign = Math.sign(predHome - predAway)
  const resultSign = Math.sign(resultHome - resultAway)
  if (predSign === resultSign) return 1
  return 0
}

export function getResultLabel(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

export function formatLastUpdate(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
