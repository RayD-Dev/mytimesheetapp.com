import { formatClock } from './clock'
import { formatDuration } from './hours'

// Dates are `YYYY-MM-DD` in the business's time zone and are shown as entered, never converted
// (FE design section 9). The weekday is worked out in UTC from the text, so the device's zone
// cannot shift a day.

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface DateParts {
  year: number
  month: number
  day: number
}

function parseIsoDate(value: string): DateParts {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${JSON.stringify(value)}`)
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  // A date that rolls over (30 February) does not exist.
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  if (check.getUTCMonth() !== parts.month - 1 || check.getUTCDate() !== parts.day) {
    throw new RangeError(`Not a real date: ${value}`)
  }
  return parts
}

/** `2026-10-08` becomes `08/10/2026`. */
export function formatDate(value: string): string {
  const { year, month, day } = parseIsoDate(value)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

/** `Thu` */
export function formatWeekday(value: string): string {
  const { year, month, day } = parseIsoDate(value)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  if (weekday === undefined) throw new RangeError(`No weekday for ${value}`)
  return weekday
}

/** `Thu 08/10/2026` */
export function formatDayLabel(value: string): string {
  return `${formatWeekday(value)} ${formatDate(value)}`
}

interface Shift {
  start: string
  finish: string
  breakMinutes: number
  workedMinutes: number
}

/** `7:30 AM to 8:30 PM, 30 min break, 12h 30m` */
export function formatShiftLine({ start, finish, breakMinutes, workedMinutes }: Shift): string {
  return `${formatClock(start)} to ${formatClock(finish)}, ${breakMinutes} min break, ${formatDuration(workedMinutes)}`
}
