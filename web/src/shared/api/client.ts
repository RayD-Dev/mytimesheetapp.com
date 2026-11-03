import type { ZodType } from 'zod'
import { ApiError, PutSignatureBody, SaveDayBody, SubmitTimesheetBody } from './generated/zod'

// Names from the contract's cookieAuth and csrfHeader schemes (ticket BE-09).
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Orval adds the success response's schema as `schema`. */
export type RequestInitWithSchema = RequestInit & { schema?: ZodType }

/** A response that the contract does not allow. `status` lets callers treat a bad 5xx as a 5xx. */
export class ResponseContractError extends Error {
  readonly status: number
  constructor(status: number, cause: unknown) {
    super(`The ${status} response does not match the API contract`, { cause })
    this.name = 'ResponseContractError'
    this.status = status
  }
}

// Orval does not validate request bodies for the fetch client, so each body-carrying
// operation is listed here with its generated schema. An unlisted body is refused.
const bodySchemas: { method: string; path: RegExp; schema: ZodType }[] = [
  { method: 'PUT', path: /^\/api\/v1\/me\/signature$/, schema: PutSignatureBody },
  { method: 'PUT', path: /^\/api\/v1\/me\/timesheets\/[^/]+\/days\/[^/]+$/, schema: SaveDayBody },
  { method: 'POST', path: /^\/api\/v1\/me\/timesheets\/[^/]+\/submit$/, schema: SubmitTimesheetBody },
]

const unauthorisedListeners = new Set<() => void>()

/** Task 6 listens here to open the session-ended dialog. Returns the unsubscribe function. */
export const onUnauthorised = (listener: () => void): (() => void) => {
  unauthorisedListeners.add(listener)
  return () => unauthorisedListeners.delete(listener)
}

const readCsrfToken = (): string | undefined => {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`))
  return entry === undefined ? undefined : decodeURIComponent(entry.slice(CSRF_COOKIE.length + 1))
}

const checkRequestBody = (method: string, url: string, body: RequestInit['body']): void => {
  if (body === undefined || body === null) return
  const entry = bodySchemas.find((candidate) => candidate.method === method && candidate.path.test(url))
  if (entry === undefined || typeof body !== 'string') {
    throw new Error(`No request schema is registered for ${method} ${url}`)
  }
  entry.schema.parse(JSON.parse(body))
}

const readBody = async (res: Response, successSchema: ZodType | undefined): Promise<unknown> => {
  const text = await res.text()
  try {
    if (!res.ok) return ApiError.parse(JSON.parse(text))
    return successSchema === undefined ? undefined : successSchema.parse(JSON.parse(text))
  } catch (cause) {
    throw new ResponseContractError(res.status, cause)
  }
}

/** The only place requests are sent. It is the generated client's mutator. */
export const request = async <T>(url: string, { schema, ...init }: RequestInitWithSchema): Promise<T> => {
  const method = (init.method ?? 'GET').toUpperCase()
  checkRequestBody(method, url, init.body)

  const headers = new Headers(init.headers)
  if (!SAFE_METHODS.has(method)) {
    // With no cookie the write goes out bare and the server answers 403 CSRF_TOKEN_INVALID.
    const token = readCsrfToken()
    if (token !== undefined) headers.set(CSRF_HEADER, token)
  }

  const res = await fetch(url, { ...init, method, headers })
  if (res.status === 401) unauthorisedListeners.forEach((listener) => listener())

  const data = await readBody(res, schema)
  // Orval fixes the return type per operation; the checks above are what make it true.
  return { data, status: res.status, headers: res.headers } as T
}
