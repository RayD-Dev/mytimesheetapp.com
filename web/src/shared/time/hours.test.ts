import { describe, expect, it } from 'vitest'
import cases from '../../../../contract/fixtures/hours-cases.json'
import { TOTALS_NOTE, formatDecimalHours, formatDuration, formatHours } from './hours'

describe('hours formatting (shared fixture cases, FR-11)', () => {
  it.each(cases.formatting)('$description', ({ minutes, duration, decimal, display }) => {
    expect(formatDuration(minutes)).toBe(duration)
    expect(formatDecimalHours(minutes)).toBe(decimal)
    expect(formatHours(minutes)).toBe(display)
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('refuses %s minutes', (minutes) => {
    expect(() => formatHours(minutes)).toThrow(RangeError)
  })

  it('states the totals note from the screen spec', () => {
    expect(TOTALS_NOTE).toBe(
      'Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.',
    )
  })
})
