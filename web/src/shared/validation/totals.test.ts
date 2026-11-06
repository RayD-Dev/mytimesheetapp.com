import { describe, expect, it } from 'vitest'
import cases from '../../../../contract/fixtures/hours-cases.json'
import { formatHours } from '../time/hours'
import { previewTotals, sumMinutes } from './totals'

describe('preview totals (shared fixture cases, FR-10, FR-11)', () => {
  it.each(cases.totals)('$description', ({ dayMinutes, totalMinutes, display }) => {
    expect(sumMinutes(dayMinutes)).toBe(totalMinutes)
    expect(formatHours(sumMinutes(dayMinutes))).toBe(display)
  })

  it('adds each week and then the fortnight from exact minutes', () => {
    const preview = previewTotals([
      [490, 490, 490, 0, 0],
      [510, 0, 0, 0, 0],
    ])
    expect(preview).toEqual({ weekMinutes: [1470, 510], fortnightMinutes: 1980 })
  })

  it('takes the number of weeks from its input', () => {
    expect(previewTotals([[60], [60], [60]]).weekMinutes).toHaveLength(3)
  })
})
