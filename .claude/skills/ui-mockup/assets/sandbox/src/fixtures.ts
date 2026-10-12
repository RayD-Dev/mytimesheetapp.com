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

export const team: { name: string; status: Status; minutes: number; warnings: number }[] = [
  { name: 'Priya Ramaswamy-Kingsley', status: 'Submitted', minutes: 1875, warnings: 1 },
  { name: 'Tom Ng', status: 'Submitted', minutes: 2280, warnings: 0 },
  { name: 'Alexandra Featherstonehaugh', status: 'Approved', minutes: 4590, warnings: 0 },
  { name: 'Sam Okafor', status: 'Self-approved', minutes: 3600, warnings: 0 },
  { name: 'Lee Wong', status: 'Rejected', minutes: 960, warnings: 2 },
]
