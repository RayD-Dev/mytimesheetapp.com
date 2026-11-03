import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearTimesheet, getMe, keepAlive, logout, putSignature, saveDay, submitTimesheet } from './generated/api'
import { onUnauthorised, ResponseContractError } from './client'

const expiry = {
  idleExpiresAt: '2026-11-04T01:30:00Z',
  absoluteExpiresAt: '2026-11-04T09:00:00.000Z',
  serverNow: '2026-11-04T01:00:00Z',
}
const me = {
  ...expiry,
  name: 'Sam Lee',
  roles: ['employee'],
  today: '2026-11-04',
  payScheduleSet: true,
  signatureSet: false,
  currentFortnightStart: '2026-11-02',
  previousFortnightStart: '2026-10-19',
  periodLengthDays: 14,
}
const day = { date: '2026-11-04', start: '09:00', breakMinutes: 30, finish: '17:00', workedMinutes: 450, warnings: [] }
const totals = { weeks: [{ weekStart: '2026-11-02', minutes: 450 }], fortnightMinutes: 450 }
const saveDayResult = { ...expiry, version: 2, day, totals, deletionDate: null }
const saveDayBody = { version: 1, start: '09:00', breakMinutes: 30, finish: '17:00' }

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const fetchMock = vi.fn<typeof fetch>()
const sentInit = (): RequestInit => {
  const call = fetchMock.mock.calls[0]
  if (call === undefined) throw new Error('fetch was not called')
  return call[1] ?? {}
}
const sentHeader = (name: string): string | null => new Headers(sentInit().headers).get(name)

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  document.cookie = 'XSRF-TOKEN=token-123'
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('CSRF header', () => {
  it('is absent on GET', async () => {
    fetchMock.mockResolvedValue(json(200, me))
    await getMe()
    expect(sentHeader('X-XSRF-TOKEN')).toBeNull()
  })

  it('is sent on PUT', async () => {
    fetchMock.mockResolvedValue(json(200, saveDayResult))
    await saveDay('2026-11-02', '2026-11-04', saveDayBody)
    expect(sentInit().method).toBe('PUT')
    expect(sentHeader('X-XSRF-TOKEN')).toBe('token-123')
  })

  it('is sent on POST', async () => {
    fetchMock.mockResolvedValue(json(200, expiry))
    await keepAlive()
    expect(sentInit().method).toBe('POST')
    expect(sentHeader('X-XSRF-TOKEN')).toBe('token-123')
  })

  it('is sent on DELETE', async () => {
    fetchMock.mockResolvedValue(json(200, { version: 3, deletionDate: null }))
    await clearTimesheet('2026-11-02', { version: 2 })
    expect(sentInit().method).toBe('DELETE')
    expect(sentHeader('X-XSRF-TOKEN')).toBe('token-123')
  })

  it('is sent in keepalive mode, which is passed on to fetch', async () => {
    fetchMock.mockResolvedValue(json(200, saveDayResult))
    await saveDay('2026-11-02', '2026-11-04', saveDayBody, { keepalive: true })
    expect(sentInit().keepalive).toBe(true)
    expect(sentHeader('X-XSRF-TOKEN')).toBe('token-123')
    expect(sentHeader('Content-Type')).toBe('application/json')
  })
})

describe('responses', () => {
  it('returns a valid body typed by status, accepting Z date-times with or without fractions', async () => {
    fetchMock.mockResolvedValue(json(200, me))
    const res = await getMe()
    expect(res.status).toBe(200)
    expect(res.data).toMatchObject({ name: 'Sam Lee', idleExpiresAt: '2026-11-04T01:30:00Z' })
  })

  it('throws when a success body breaks its schema', async () => {
    fetchMock.mockResolvedValue(json(200, { ...me, periodLengthDays: 'fourteen' }))
    await expect(getMe()).rejects.toBeInstanceOf(ResponseContractError)
  })

  it('throws when a date-time is not UTC', async () => {
    fetchMock.mockResolvedValue(json(200, { ...me, serverNow: '2026-11-04T11:00:00+10:00' }))
    await expect(getMe()).rejects.toBeInstanceOf(ResponseContractError)
  })

  it('returns a discriminated error body with its status', async () => {
    const conflict = { code: 'VERSION_CONFLICT', message: 'Changed on another device' }
    fetchMock.mockResolvedValue(json(409, conflict))
    const res = await saveDay('2026-11-02', '2026-11-04', saveDayBody)
    expect(res).toMatchObject({ status: 409, data: conflict })
  })

  it('throws, with the status, when an error body has an unknown code', async () => {
    fetchMock.mockResolvedValue(json(500, { code: 'SOMETHING_NEW', message: 'x' }))
    await expect(getMe()).rejects.toMatchObject({ name: 'ResponseContractError', status: 500 })
  })

  it('throws, with the status, when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(getMe()).rejects.toMatchObject({ name: 'ResponseContractError', status: 502 })
  })

  it('accepts 204 with no body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    expect(await logout()).toMatchObject({ status: 204 })
  })
})

describe('unauthorised event', () => {
  it('fires once for a 401 and still returns the typed response', async () => {
    const listener = vi.fn()
    const stop = onUnauthorised(listener)
    fetchMock.mockResolvedValue(json(401, { code: 'UNAUTHORIZED', message: 'Signed out' }))
    const res = await getMe()
    stop()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(401)
  })

  it('does not fire for other statuses or after unsubscribing', async () => {
    const listener = vi.fn()
    const stop = onUnauthorised(listener)
    fetchMock.mockResolvedValueOnce(json(200, me))
    await getMe()
    stop()
    fetchMock.mockResolvedValueOnce(json(401, { code: 'UNAUTHORIZED', message: 'Signed out' }))
    await getMe()
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('request bodies', () => {
  it('rejects a body that breaks its schema before anything is sent', async () => {
    await expect(saveDay('2026-11-02', '2026-11-04', { ...saveDayBody, start: '9am' })).rejects.toThrow()
    await expect(
      submitTimesheet('2026-11-02', { version: 1, declaration: false as true, warningDayTicks: [] }),
    ).rejects.toThrow()
    await expect(putSignature({ kind: 'typed', image: 'x' } as never)).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a valid body as JSON', async () => {
    fetchMock.mockResolvedValue(json(200, saveDayResult))
    await saveDay('2026-11-02', '2026-11-04', saveDayBody)
    expect(sentInit().body).toBe(JSON.stringify(saveDayBody))
  })
})
