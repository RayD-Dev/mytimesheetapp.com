// Fake data for the mock-up. Realistic extremes on purpose: a long name, a warning day, big totals.
// Times are minutes after midnight; brk is the rest break in minutes. Dates are DD/MM/YYYY (DESIGN.md §2).

export type Day = { weekday: string; date: string; start?: number; brk?: number; finish?: number; future?: boolean }
export type Status = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Self-approved'

export const me = { name: 'Priya Ramaswamy-Kingsley', manager: false }
export const period = { label: '05/10/2026 to 16/10/2026', expires: '30/10/2026', today: '15/10/2026' }

const dates = [
  ['Mon', '05/10/2026'], ['Tue', '06/10/2026'], ['Wed', '07/10/2026'], ['Thu', '08/10/2026'], ['Fri', '09/10/2026'],
  ['Mon', '12/10/2026'], ['Tue', '13/10/2026'], ['Wed', '14/10/2026'], ['Thu', '15/10/2026'], ['Fri', '16/10/2026'],
]
const shift = (start: number, brk: number, finish: number) => ({ start, brk, finish })

/** Days for each mock state. Index 9 (Fri 16/10/2026) is after "today" (Thu 15/10/2026), so it's never fillable. */
export function fortnight(state: string): Day[] {
  const entries: Record<number, ReturnType<typeof shift>> =
    state === 'empty' ? {}
    : state === 'full' ? Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i, shift(450, 30, 990)])) // 9 × 8h 30m = 76h 30m
    : { 0: shift(450, 30, 990), 1: shift(480, 45, 1020), 3: shift(450, 0, 510) /* 1h 00m → AM/PM warning */, 5: shift(540, 30, 1050) }
  return dates.map(([weekday, date], i) => ({ weekday, date, ...entries[i], future: i === 9 }))
}

export const worked = (d: Day) => (d.start != null && d.finish != null ? d.finish - d.start - (d.brk ?? 0) : 0)
export const warning = (d: Day) => { const w = worked(d); return d.start != null && (w <= 60 || w > 720) }

export const submitted = { at: '16/10/2026 at 4:05 PM' }
export const approval = { by: 'Sam Okafor', at: '19/10/2026 at 9:12 AM' }
export const rejection = { by: 'Sam Okafor', at: '19/10/2026 at 8:40 AM', reason:'Thursday 08/10/2026 shows 7:30 AM to 8:30 AM. Did you mean 8:30 PM?' }

export const manager = { name: 'Sam Okafor', signatureStyle: 'muellerhoff' as const }

// Approvals for 05/10/2026 to 16/10/2026. "own" is the manager's own timesheet (FR-19).
export const team: { id: string; name: string; status: Status; minutes: number; warnings: number; submittedAt?: string; own?: boolean }[] = [
  { id: 'priya', name: 'Priya Ramaswamy-Kingsley', status: 'Submitted', minutes: 1545, warnings: 1, submittedAt: '16/10/2026 at 4:05 PM' },
  { id: 'tom', name: 'Tom Ng', status: 'Submitted', minutes: 2250, warnings: 0, submittedAt: '16/10/2026 at 5:12 PM' },
  { id: 'sam', name: 'Sam Okafor', status: 'Submitted', minutes: 4590, warnings: 0, submittedAt: '16/10/2026 at 6:30 PM', own: true },
  { id: 'alexandra', name: 'Alexandra Featherstonehaugh', status: 'Approved', minutes: 4590, warnings: 0, submittedAt: '15/10/2026 at 3:48 PM' },
  { id: 'lee', name: 'Lee Wong', status: 'Rejected', minutes: 960, warnings: 2, submittedAt: '15/10/2026 at 9:02 AM' },
]

export const fortnights = [
  { value: '2026-10-05', label: '05/10/2026 to 16/10/2026 (current)' },
  { value: '2026-09-21', label: '21/09/2026 to 02/10/2026 (previous)' },
  { value: '2026-09-07', label: '07/09/2026 to 18/09/2026' },
]

/** Each person's days, consistent with their totals above */
export function daysFor(id: string): Day[] {
  if (id === 'priya') return fortnight('draft')
  if (id === 'sam' || id === 'alexandra') return fortnight('full') // 76h 30m
  const base = fortnight('empty')
  const set = (i: number, start: number, brk: number, finish: number) => Object.assign(base[i], { start, brk, finish })
  if (id === 'tom') [0, 1, 2, 3, 4].forEach((i) => set(i, 420, 30, 900)) // 5 × 7h 30m = 37h 30m
  if (id === 'lee') { set(0, 420, 0, 450); set(1, 420, 0, 450); set(5, 480, 30, 960); set(6, 480, 30, 960) } // two 0h 30m warnings + 2 × 7h 30m = 16h
  return base
}

// Admin (FR-04, FR-24, FR-25). Emails are for Keycloak's password-reset emails.
export const paySchedule = { start: '12/01/2026', startWeekday: 'Monday' }
export const employees: { id: string; name: string; email: string; active: boolean; manager?: boolean; deactivatedOn?: string }[] = [
  { id: 'alexandra', name: 'Alexandra Featherstonehaugh', email: 'alexandra.f@example.com', active: true },
  { id: 'lee', name: 'Lee Wong', email: 'lee.wong@example.com', active: true },
  { id: 'priya', name: 'Priya Ramaswamy-Kingsley', email: 'priya.rk@example.com', active: true },
  { id: 'sam', name: 'Sam Okafor', email: 'sam@example.com', active: true, manager: true },
  { id: 'tom', name: 'Tom Ng', email: 'tom.ng@example.com', active: true },
  { id: 'jordan', name: 'Jordan Ellis', email: 'jordan.e@example.com', active: false, deactivatedOn: '01/09/2026' },
]
// R7-8: set by the manager on Admin, shown on the sign-in page. Unset on first run, when "Timesheets" shows alone.
export const business = { name: 'Harbour Street Bakery', long: 'The Original Harbour Street Bakery & Wholesale Catering Company' }
// R8: optional logo, uploaded on Admin. Mock images only; the real app stores the uploaded PNG or JPG.
const svg = (w: number, h: number, body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`
export const logos = {
  badge: svg(120, 120, '<circle cx="60" cy="60" r="56" fill="#7A3E12"/><circle cx="60" cy="60" r="46" fill="none" stroke="#F6E7C8" stroke-width="3"/><path d="M60 28c-8 10-8 22 0 32 8-10 8-22 0-32zM44 42c-2 12 4 22 16 26-1-12-7-22-16-26zM76 42c2 12-4 22-16 26 1-12 7-22 16-26z" fill="#F6E7C8"/><text x="60" y="94" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#F6E7C8">HSB</text>'),
  wide: svg(760, 80, '<rect width="760" height="80" fill="#0E5A6E"/><text x="24" y="54" font-family="Georgia,serif" font-size="40" fill="#fff">THE ORIGINAL HARBOUR STREET</text>'),
}
export const tempPassword = 'maple-river-4271' // mock only: shown once, changed at first sign-in
