import { parseClock } from '../time/clock'
import { formatDuration } from '../time/hours'

// FR-09 and FR-27 mirror the server for instant feedback; the server's verdict wins.
// "Finish after start" lives only here so overnight shifts (M2) change one place.

export type DayErrorCode =
  | 'START_MISSING'
  | 'FINISH_MISSING'
  | 'FINISH_BEFORE_START'
  | 'BREAK_TOO_LONG'
  | 'FUTURE_DAY'

export type DayField = 'date' | 'start' | 'breakMinutes' | 'finish'
export type DayWarningCode = 'SHORT_SHIFT' | 'LONG_SHIFT'

export interface DayInput {
  date: string
  start: string | null
  breakMinutes: number
  finish: string | null
}

export interface DayError {
  field: DayField
  code: DayErrorCode
  message: string
}

export interface DayResult {
  errors: DayError[]
  /** Zero whenever the day is empty or has an error. */
  workedMinutes: number
  warnings: DayWarningCode[]
}

const ERROR_MESSAGES: Record<DayErrorCode, string> = {
  START_MISSING: 'Add a start time',
  FINISH_MISSING: 'Add a finish time',
  FINISH_BEFORE_START: 'Finish time must be after start time',
  BREAK_TOO_LONG: 'Rest break must be shorter than the shift',
  FUTURE_DAY: "Hours can't be added for future days",
}

// FR-27: warn on 1 hour or less, or more than 12 hours, worked.
const SHORT_SHIFT_MAX_MINUTES = 60
const LONG_SHIFT_MIN_MINUTES = 12 * 60

export function errorMessage(code: DayErrorCode): string {
  return ERROR_MESSAGES[code]
}

export function warningMessage(workedMinutes: number): string {
  return `This shift is ${formatDuration(workedMinutes)}. Is AM/PM correct?`
}

function error(field: DayField, code: DayErrorCode): DayError {
  return { field, code, message: ERROR_MESSAGES[code] }
}

function invalid(errors: DayError[]): DayResult {
  return { errors, workedMinutes: 0, warnings: [] }
}

function shiftWarnings(workedMinutes: number): DayWarningCode[] {
  if (workedMinutes <= SHORT_SHIFT_MAX_MINUTES) return ['SHORT_SHIFT']
  if (workedMinutes > LONG_SHIFT_MIN_MINUTES) return ['LONG_SHIFT']
  return []
}

/** `today` comes from the API, never the device clock. Dates are `YYYY-MM-DD`, so text order is date order. */
export function validateDay(day: DayInput, today: string): DayResult {
  const isEmpty = day.start === null && day.finish === null && day.breakMinutes === 0
  if (isEmpty) return invalid([])

  if (day.date > today) return invalid([error('date', 'FUTURE_DAY')])

  const start = day.start === null ? null : parseClock(day.start)
  const finish = day.finish === null ? null : parseClock(day.finish)
  const missing: DayError[] = []
  if (start === null) missing.push(error('start', 'START_MISSING'))
  if (finish === null) missing.push(error('finish', 'FINISH_MISSING'))
  if (start === null || finish === null) return invalid(missing)

  const shiftMinutes = finish - start
  if (shiftMinutes <= 0) return invalid([error('finish', 'FINISH_BEFORE_START')])
  if (day.breakMinutes >= shiftMinutes) return invalid([error('breakMinutes', 'BREAK_TOO_LONG')])

  const workedMinutes = shiftMinutes - day.breakMinutes
  return { errors: [], workedMinutes, warnings: shiftWarnings(workedMinutes) }
}
