import { describe, expect, it } from 'vitest'
import { formatDate, formatDayLabel, formatShiftLine, formatWeekday } from './dates'

describe('date formatters', () => {
  it('writes day, month, year', () => {
    expect(formatDate('2026-10-08')).toBe('08/10/2026')
  })

  it.each([
    ['2026-10-05', 'Mon'],
    ['2026-10-08', 'Thu'],
    ['2026-10-16', 'Fri'],
    ['2026-10-17', 'Sat'],
    ['2026-10-18', 'Sun'],
  ])('%s is a %s', (date, weekday) => {
    expect(formatWeekday(date)).toBe(weekday)
  })

  it('labels a day with its weekday', () => {
    expect(formatDayLabel('2026-10-08')).toBe('Thu 08/10/2026')
  })

  it('reads a shift as in the design', () => {
    expect(
      formatShiftLine({ start: '07:30', finish: '20:30', breakMinutes: 30, workedMinutes: 750 }),
    ).toBe('7:30 AM to 8:30 PM, 30 min break, 12h 30m')
  })

  it.each(['2026-13-01', '2026-02-30', '08/10/2026', ''])('rejects %j', (value) => {
    expect(() => formatDate(value)).toThrow(RangeError)
  })
})
