// The only place requests are sent; orval's generated functions call `request` as their mutator.
//
// Error bodies are checked against the whole ApiError union, not against the one error type the
// contract lists for that status. Callers narrow on `data.code` only and never trust the HTTP
// status to pick the error type.
import { ZodError, type ZodType } from 'zod'
import { ApiError, ClearTimesheetParams, PutSignatureBody, SaveDayBody, SubmitTimesheetBody } from './generated/zod'

// Names from the contract's cookieAuth and csrfHeader schemes (ticket BE-09).
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CLEAR_TIMESHEET_PATH = /^\/api\/v1\/me\/timesheets\/[^/]+$/

/** Orval adds the success response's schema as `schema`. */
export type RequestInitWithSchema = RequestInit & { schema?: ZodType }

/** Only issue paths and codes are kept as the cause, never text from the body. */
const describeFailure = (error: unknown): string[] => {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.code}`)
  }
  return [error instanceof SyntaxError ? 'not valid JSON' : 'unexpected status or body']
}

/** A response that the contract does not allow. `status` lets callers treat a bad 5xx as a 5xx. */
export class ResponseContractError extends Error {
  readonly status: number
  constructor(status: number, issues: string[]) {
    super(`The ${status} response does not match the API contract`, { cause: issues })
    this.name = 'ResponseContractError'
    this.status = status
  }
}

/** A request the contract does not allow: a bad body, a body with no registered schema, or a bad URL. */
export class RequestContractError extends Error {
  constructor(issues: string[]) {
    super('The request does not match the API contract', { cause: issues })
    this.name = 'RequestContractError'
  }
}

// Orval does not validate request bodies for the fetch client, so each body-carrying
// operation is listed here with its generated schema. An unlisted body is refused.
export const bodySchemas: readonly { method: string; path: RegExp; schema: ZodType }[] = [
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

const notifyUnauthorised = (): void => {
  for (const listener of unauthorisedListeners) {
    try {
      listener()
    } catch (error) {
      reportError(error)
    }
  }
}

const readCsrfToken = (): string | undefined => {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`))
  if (entry === undefined) return undefined
  const raw = entry.slice(CSRF_COOKIE.length + 1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// Generated functions paste path values into the URL, so a value like `..` or `x?y#` could
// point at another endpoint. The URL must survive normalisation unchanged.
const resolveApiUrl = (url: string): URL => {
  let resolved: URL
  try {
    resolved = new URL(url, location.origin)
  } catch {
    throw new RequestContractError(['url: not a valid URL'])
  }
  const unchanged = resolved.pathname + resolved.search === url
  if (resolved.origin !== location.origin || !resolved.pathname.startsWith('/api/') || !unchanged) {
    throw new RequestContractError(['url: not a plain same-origin /api/ path'])
  }
  return resolved
}

const checkClearVersion = (resolved: URL): void => {
  const raw = resolved.searchParams.get('version')
  const version = raw !== null && /^\d+$/.test(raw) ? Number(raw) : raw
  try {
    ClearTimesheetParams.parse({ version })
  } catch (error) {
    throw new RequestContractError(describeFailure(error))
  }
}

/** Returns the body to send: the parsed result, so nothing the schema drops goes out. */
const checkRequestBody = (method: string, resolved: URL, body: RequestInit['body']): string | undefined => {
  if (body === undefined || body === null) return undefined
  const entry = bodySchemas.find((candidate) => candidate.method === method && candidate.path.test(resolved.pathname))
  if (entry === undefined || typeof body !== 'string') {
    throw new RequestContractError([`no request schema is registered for ${method} ${resolved.pathname}`])
  }
  try {
    return JSON.stringify(entry.schema.parse(JSON.parse(body)))
  } catch (error) {
    throw new RequestContractError(describeFailure(error))
  }
}

const readBody = async (res: Response, successSchema: ZodType | undefined): Promise<unknown> => {
  const text = await res.text()
  try {
    if (!res.ok) return ApiError.parse(JSON.parse(text))
    if (successSchema === undefined) {
      if (res.status !== 204 || text !== '') throw new Error('expected 204 with no body')
      return undefined
    }
    if (res.status !== 200) throw new Error('expected 200')
    return successSchema.parse(JSON.parse(text))
  } catch (error) {
    throw new ResponseContractError(res.status, describeFailure(error))
  }
}

export const request = async <T>(url: string, { schema, ...init }: RequestInitWithSchema): Promise<T> => {
  const method = (init.method ?? 'GET').toUpperCase()
  const resolved = resolveApiUrl(url)
  if (method === 'DELETE' && CLEAR_TIMESHEET_PATH.test(resolved.pathname)) checkClearVersion(resolved)
  const body = checkRequestBody(method, resolved, init.body)

  const headers = new Headers(init.headers)
  if (!SAFE_METHODS.has(method)) {
    // With no cookie the write goes out bare and the server answers 403 CSRF_TOKEN_INVALID.
    const token = readCsrfToken()
    if (token !== undefined) headers.set(CSRF_HEADER, token)
  }

  const res = await fetch(url, {
    ...init,
    ...(body === undefined ? {} : { body }),
    method,
    headers,
    // Last, so callers cannot override them: the session cookie never leaves this origin.
    credentials: 'same-origin',
    redirect: 'error',
  })
  if (res.status === 401) notifyUnauthorised()

  const data = await readBody(res, schema)
  // Orval fixes the return type per operation; the checks above are what make it true.
  return { data, status: res.status, headers: res.headers } as T
}
