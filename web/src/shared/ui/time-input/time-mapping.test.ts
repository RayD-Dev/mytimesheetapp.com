import { Time } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { fromTimeValue, toTime } from './time-mapping'

describe('toTime', () => {
  it.each([
    ['07:30', new Time(7, 30)],
    ['00:00', new Time(0, 0)],
    ['12:00', new Time(12, 0)],
  ])('maps %s to a time', (text, time) => {
    expect(toTime(text)).toEqual(time)
  })
  it.each(['', '7:30', '24:00', '12:60', '12:3x', 'noon'])('rejects %j', (text) => {
    expect(toTime(text)).toBeUndefined()
  })
  it('treats null as empty', () => {
    expect(toTime(null)).toBeUndefined()
  })
})

describe('fromTimeValue', () => {
  it.each([
    [7, 30, '07:30'],
    [0, 0, '00:00'],
    [12, 0, '12:00'],
    [19, 5, '19:05'],
  ])('maps %i:%i to %s', (hour, minute, text) => {
    expect(fromTimeValue(new Time(hour, minute))).toBe(text)
  })
  it('maps empty to null', () => {
    expect(fromTimeValue(undefined)).toBeNull()
    expect(fromTimeValue(null)).toBeNull()
  })
  it.each([
    { hour: 'x', minute: 3 },
    { hour: 25, minute: 0 },
    { hour: 7, minute: 60 },
    { hour: 7.5, minute: 0 },
    { hour: -1, minute: 0 },
    '07:30',
  ])('rejects %j', (value) => {
    expect(fromTimeValue(value)).toBeNull()
  })
})
