// FR-10: totals preview while typing, until the server's figures replace them.
// The number of weeks comes from the caller (the API's period), not from a fixed fortnight.

export interface PreviewTotals {
  weekMinutes: number[]
  fortnightMinutes: number
}

export function sumMinutes(minutes: readonly number[]): number {
  return minutes.reduce((total, value) => total + value, 0)
}

/** Each inner list holds one week's days, in order. */
export function previewTotals(weeks: readonly (readonly number[])[]): PreviewTotals {
  const weekMinutes = weeks.map(sumMinutes)
  return { weekMinutes, fortnightMinutes: sumMinutes(weekMinutes) }
}
