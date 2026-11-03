// The API sends 24-hour `HH:mm`; people see a 12-hour clock with AM/PM (FR-11).

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

/** Minutes since midnight, or null when the text is not a valid `HH:mm`. */
export function parseClock(value: string): number | null {
  const match = CLOCK_PATTERN.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** `13:05` becomes `1:05 PM`. */
export function formatClock(value: string): string {
  const minutes = parseClock(value)
  if (minutes === null) throw new RangeError(`Not an HH:mm time: ${JSON.stringify(value)}`)
  const hour24 = Math.floor(minutes / 60)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const suffix = hour24 < 12 ? 'AM' : 'PM'
  return `${hour12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`
}
