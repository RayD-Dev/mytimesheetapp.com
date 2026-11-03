import { Time } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { fromTimeValue, toTime } from './time-mapping'

describe('toTime', () => {
  it('maps 07:30 to 7:30', () => {
    expect(toTime('07:30')).toEqual(new Time(7, 30))
  })
  it('maps midnight and noon', () => {
    expect(toTime('00:00')).toEqual(new Time(0, 0))
    expect(toTime('12:00')).toEqual(new Time(12, 0))
  })
  it.each(['', '7:30', '24:00', '12:60', '12:3x', 'noon'])('rejects %j', (text) => {
    expect(toTime(text)).toBeUndefined()
  })
  it('treats null as empty', () => {
    expect(toTime(null)).toBeUndefined()
  })
})

describe('fromTimeValue', () => {
  it('maps back to HH:mm with leading zeros', () => {
    expect(fromTimeValue(new Time(7, 30))).toBe('07:30')
    expect(fromTimeValue(new Time(0, 0))).toBe('00:00')
    expect(fromTimeValue(new Time(12, 0))).toBe('12:00')
    expect(fromTimeValue(new Time(19, 5))).toBe('19:05')
  })
  it('maps empty to null', () => {
    expect(fromTimeValue(undefined)).toBeNull()
    expect(fromTimeValue(null)).toBeNull()
  })
  it('rejects values that are not a time of day', () => {
    expect(fromTimeValue({ hour: 'x', minute: 3 })).toBeNull()
    expect(fromTimeValue({ hour: 25, minute: 0 })).toBeNull()
    expect(fromTimeValue('07:30')).toBeNull()
  })
})
