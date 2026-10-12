// FR-11 display rules (mock version). The real app gets tested formatters shared with the PDF.
/** Minutes after midnight → "7:30 AM" */
export const time = (m: number) =>
  `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'AM' : 'PM'}`

/** Worked minutes → "8h 10m (8.17)"; decimals rounded half-up in integer arithmetic */
export const hours = (m: number) => {
  const hundredths = Math.floor((m * 100 + 30) / 60)
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m (${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')})`
}

/** Worked minutes → "1h 00m" (no decimal, as in the FR-27 warning text) */
export const hm = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`

/** "7:30 AM" or "7:30am" → minutes, or null */
export const parseTime = (s: string) => {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m?\.?$/i)
  if (!m) return null
  const h = (+m[1] % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0)
  return h * 60 + +m[2]
}
