import { Time } from '@internationalized/date'

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/

/** The API's 24-hour HH:mm to the field's value; undefined when empty or malformed. */
export function toTime(hhmm: string | null): Time | undefined {
  const match = hhmm === null ? null : HH_MM.exec(hhmm)
  if (!match) return undefined
  return new Time(Number(match[1]), Number(match[2]))
}

function isInRange(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max
}

/** The field's value to HH:mm. The value comes from a third-party component, so it is checked here. */
export function fromTimeValue(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null
  const { hour, minute } = value as { hour?: unknown; minute?: unknown }
  if (!isInRange(hour, 23) || !isInRange(minute, 59)) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
