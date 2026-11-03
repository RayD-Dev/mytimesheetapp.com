// FR-11: hours read `8h 10m (8.17)`. The server keeps exact whole minutes; rounding is display only.

export const TOTALS_NOTE =
  'Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.'

function assertWholeMinutes(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new RangeError(`Minutes must be a whole number of at least 0, got ${minutes}`)
  }
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** `8h 10m`: both parts always shown, minutes two-digit, no cap on hours (76h 30m). */
export function formatDuration(minutes: number): string {
  assertWholeMinutes(minutes)
  return `${Math.floor(minutes / 60)}h ${twoDigits(minutes % 60)}m`
}

/** Decimal hours to 2 places, half-up, in integer arithmetic only (same rule as the PDF, BE section 3.3). */
export function formatDecimalHours(minutes: number): string {
  assertWholeMinutes(minutes)
  const hundredths = Math.floor((minutes * 100 + 30) / 60)
  return `${Math.floor(hundredths / 100)}.${twoDigits(hundredths % 100)}`
}

/** `8h 10m (8.17)` */
export function formatHours(minutes: number): string {
  return `${formatDuration(minutes)} (${formatDecimalHours(minutes)})`
}
