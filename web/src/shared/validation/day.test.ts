import { describe, expect, it } from 'vitest'
import cases from '../../../../contract/fixtures/hours-cases.json'
import { errorMessage, validateDay, warningMessage } from './day'

describe('day validation (shared fixture cases, FR-09)', () => {
  it.each(cases.dayValidation)('$description', ({ day, today, errors, workedMinutes }) => {
    const result = validateDay(day, today)
    expect(result.errors.map(({ field, code }) => ({ field, code }))).toEqual(errors)
    expect(result.workedMinutes).toBe(workedMinutes)
  })

  it('gives each failure the wording from the screen spec', () => {
    expect(errorMessage('START_MISSING')).toBe('Add a start time')
    expect(errorMessage('FINISH_MISSING')).toBe('Add a finish time')
    expect(errorMessage('FINISH_BEFORE_START')).toBe('Finish time must be after start time')
    expect(errorMessage('BREAK_TOO_LONG')).toBe('Rest break must be shorter than the shift')
    expect(errorMessage('FUTURE_DAY')).toBe("Hours can't be added for future days")
  })

  it('carries the message on each error', () => {
    const { errors } = validateDay(
      { date: '2026-10-07', start: '07:30', breakMinutes: 0, finish: null },
      '2026-10-15',
    )
    expect(errors).toEqual([
      { field: 'finish', code: 'FINISH_MISSING', message: 'Add a finish time' },
    ])
  })
})

describe('shift warnings (shared fixture cases, FR-27)', () => {
  it.each(cases.warnings)('$description', ({ start, finish, breakMinutes, workedMinutes, warnings, message }) => {
    const result = validateDay(
      { date: '2026-10-08', start, breakMinutes, finish },
      '2026-10-15',
    )
    expect(result.errors).toEqual([])
    expect(result.workedMinutes).toBe(workedMinutes)
    expect(result.warnings).toEqual(warnings)
    expect(result.warnings.length === 0 ? null : warningMessage(workedMinutes)).toBe(message)
  })

  it('never blocks: a warned day has no errors', () => {
    const result = validateDay(
      { date: '2026-10-08', start: '09:00', breakMinutes: 0, finish: '09:45' },
      '2026-10-15',
    )
    expect(result.errors).toEqual([])
  })

  it('shows no warning on a day that has a problem', () => {
    const result = validateDay(
      { date: '2026-10-08', start: '09:00', breakMinutes: 60, finish: '10:00' },
      '2026-10-15',
    )
    expect(result.warnings).toEqual([])
  })
})
