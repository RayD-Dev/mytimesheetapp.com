import { describe, expect, it } from 'vitest'
import cases from '../../../../contract/fixtures/hours-cases.json'
import { formatClock, parseClock } from './clock'

describe('12-hour clock (FR-11)', () => {
  it.each(cases.clock)('$description', ({ time, display }) => {
    expect(formatClock(time)).toBe(display)
  })

  it('reads HH:mm as minutes since midnight', () => {
    expect(parseClock('00:00')).toBe(0)
    expect(parseClock('07:30')).toBe(450)
    expect(parseClock('23:59')).toBe(1439)
  })

  it.each(['', '7:30', '24:00', '12:60', '12:5', 'ab:cd', '07:30:00'])('rejects %j', (value) => {
    expect(parseClock(value)).toBeNull()
    expect(() => formatClock(value)).toThrow(RangeError)
  })
})
