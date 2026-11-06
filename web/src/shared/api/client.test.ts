import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import {
  clearTimesheet,
  getMe,
  getTimesheet,
  keepAlive,
  putSignature,
  saveDay,
  submitTimesheet,
} from './generated/api'
import { bodySchemas, onUnauthorised, request, RequestContractError, ResponseContractError } from './client'

// No generated operation answers 204 any more, so the no-schema path is exercised through request.
const postWithoutSchema = () => request('/api/v1/example', { method: 'POST' })

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
    expect(await postWithoutSchema()).toMatchObject({ status: 204 })
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

const signature = { kind: 'typed', image: 'iVBORw0KGgo=', text: 'Sam Lee', style: 2 } as const
const savedSignature = { ...signature, savedAt: '2026-11-04T01:00:00Z' }
const timesheet = {
  fortnightStart: '2026-11-02',
  periodStart: '2026-11-02',
  periodEnd: '2026-11-15',
  status: 'Submitted',
  version: 3,
  rejectionReason: null,
  deletionDate: null,
  days: [day],
  totals,
}
const submitBody = { version: 2, declaration: true as const, warningDayTicks: ['2026-11-04'] }

describe('request bodies', () => {
  it('rejects a body that breaks its schema before anything is sent', async () => {
    await expect(saveDay('2026-11-02', '2026-11-04', { ...saveDayBody, start: '9am' })).rejects.toBeInstanceOf(
      RequestContractError,
    )
    await expect(
      submitTimesheet('2026-11-02', { version: 1, declaration: false as true, warningDayTicks: [] }),
    ).rejects.toBeInstanceOf(RequestContractError)
    await expect(putSignature({ kind: 'typed', image: 'x' } as never)).rejects.toBeInstanceOf(RequestContractError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a valid saveDay body as JSON', async () => {
    fetchMock.mockResolvedValue(json(200, saveDayResult))
    await saveDay('2026-11-02', '2026-11-04', saveDayBody)
    expect(sentInit().body).toBe(JSON.stringify(saveDayBody))
  })

  it('sends a valid putSignature body as JSON', async () => {
    fetchMock.mockResolvedValue(json(200, savedSignature))
    await putSignature(signature)
    expect(sentInit().body).toBe(JSON.stringify(signature))
  })

  it('sends a valid submitTimesheet body as JSON', async () => {
    fetchMock.mockResolvedValue(json(200, timesheet))
    await submitTimesheet('2026-11-02', submitBody)
    expect(sentInit().body).toBe(JSON.stringify(submitBody))
  })

  it('sends the parsed body, so fields the schema drops never go out', async () => {
    fetchMock.mockResolvedValue(json(200, saveDayResult))
    await saveDay('2026-11-02', '2026-11-04', { ...saveDayBody, extra: 'secret' } as never)
    expect(sentInit().body).toBe(JSON.stringify(saveDayBody))
  })

  it('has a schema for every operation in the contract that takes a body', () => {
    const spec = parse(readFileSync(resolve(import.meta.dirname, '../../../../contract/openapi.yaml'), 'utf8'))
    const missing: string[] = []
    for (const [path, item] of Object.entries<Record<string, { requestBody?: unknown; tags?: string[] }>>(spec.paths)) {
      for (const [method, operation] of Object.entries(item)) {
        if (typeof operation !== 'object' || operation.requestBody === undefined) continue
        if (operation.tags?.includes('navigation')) continue // a browser form, not a fetch call
        const sample = path.replace(/\{[^}]+\}/g, 'x')
        const registered = bodySchemas.some((entry) => entry.method === method.toUpperCase() && entry.path.test(sample))
        if (!registered) missing.push(`${method.toUpperCase()} ${path}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('keeps body text out of the error', async () => {
    const error = await saveDay('2026-11-02', '2026-11-04', { ...saveDayBody, start: 'SECRET-TEXT' }).catch(
      (caught: unknown) => caught,
    )
    expect(error).toBeInstanceOf(RequestContractError)
    expect(JSON.stringify([(error as Error).message, (error as Error).cause])).not.toContain('SECRET-TEXT')
    expect((error as Error).cause).toEqual(['start: invalid_format'])
  })
})

describe('request url', () => {
  it.each([
    ['a dot-dot segment in the path', () => clearTimesheet('../signature', { version: 1 })],
    ['a dot-dot date', () => saveDay('2026-11-02', '..', saveDayBody)],
    ['a query and hash inside a segment', () => getTimesheet('2026-11-02?x=1#')],
    ['an encoded dot-dot', () => getTimesheet('%2e%2e')],
    ['another origin', () => request('https://evil.example/api', { method: 'POST' })],
    ['a path outside /api/', () => request('/other', { method: 'GET' })],
  ])('refuses %s before anything is sent', async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(RequestContractError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a clear whose version is not a non-negative integer', async () => {
    await expect(clearTimesheet('2026-11-02', { version: -1 })).rejects.toBeInstanceOf(RequestContractError)
    await expect(request('/api/v1/me/timesheets/2026-11-02?version=1.5', { method: 'DELETE' })).rejects.toBeInstanceOf(
      RequestContractError,
    )
    await expect(request('/api/v1/me/timesheets/2026-11-02', { method: 'DELETE' })).rejects.toBeInstanceOf(
      RequestContractError,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps cookies same-origin and redirects off, whatever the caller asks', async () => {
    fetchMock.mockResolvedValue(json(200, me))
    await getMe({ credentials: 'include', redirect: 'follow' })
    expect(sentInit()).toMatchObject({ credentials: 'same-origin', redirect: 'error' })
  })
})

describe('success status', () => {
  it('requires 200 when there is a schema', async () => {
    fetchMock.mockResolvedValue(json(201, me))
    await expect(getMe()).rejects.toMatchObject({ name: 'ResponseContractError', status: 201 })
  })

  it('requires 204 and an empty body when there is no schema', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}))
    await expect(postWithoutSchema()).rejects.toMatchObject({ name: 'ResponseContractError', status: 200 })
    const withBody = new Response('{}', { status: 200 })
    Object.defineProperty(withBody, 'status', { value: 204 })
    fetchMock.mockResolvedValueOnce(withBody)
    await expect(postWithoutSchema()).rejects.toMatchObject({ name: 'ResponseContractError', status: 204 })
  })
})

describe('errors', () => {
  it('keeps body text out of the response error', async () => {
    fetchMock.mockResolvedValue(json(200, { ...me, name: 42, today: 'SECRET-TEXT' }))
    const error = await getMe().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ResponseContractError)
    expect(JSON.stringify([(error as Error).message, (error as Error).cause])).not.toContain('SECRET-TEXT')
  })

  it('sends the raw cookie value when it cannot be decoded', async () => {
    document.cookie = 'XSRF-TOKEN=%E0%A4%A'
    fetchMock.mockResolvedValue(json(200, expiry))
    await keepAlive()
    expect(sentHeader('X-XSRF-TOKEN')).toBe('%E0%A4%A')
  })

  it('passes the abort signal to fetch and lets the abort error through', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementation((_url, init) =>
      Promise.reject(init?.signal?.aborted ? new DOMException('Aborted', 'AbortError') : new Error('not aborted')),
    )
    controller.abort()
    await expect(getMe({ signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(sentInit().signal).toBe(controller.signal)
  })
})

describe('unauthorised listeners', () => {
  it('a failing listener neither breaks the request nor skips the others', async () => {
    const reportError = vi.fn()
    vi.stubGlobal('reportError', reportError)
    const failure = new Error('listener failed')
    const second = vi.fn()
    const stopFirst = onUnauthorised(() => {
      throw failure
    })
    const stopSecond = onUnauthorised(second)
    fetchMock.mockResolvedValue(json(401, { code: 'UNAUTHORIZED', message: 'Signed out' }))
    const res = await getMe()
    stopFirst()
    stopSecond()
    expect(res.status).toBe(401)
    expect(second).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledWith(failure)
  })
})
