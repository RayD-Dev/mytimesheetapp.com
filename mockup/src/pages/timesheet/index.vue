<script lang="ts">
export const title = 'My timesheet'
export const order = 1
export const states = {
  draft: 'Draft, 4 days, one AM/PM warning',
  empty: 'No hours yet',
  rejected: "Rejected with the manager's reason, editable",
  submitted: 'Submitted, waiting for approval (read-only)',
  approved: 'Approved (read-only)',
  full: 'Every day filled, 76h 30m',
  'no-schedule': 'Pay schedule not set up yet (FR-06)',
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMock } from '@/mock'
import { fortnight, worked, warning, me, period, rejection, submitted, approval, type Day } from '@/fixtures'
import { hours, hm, time } from '@/fmt'
import TimeField from '@/parts/TimeField.vue'
import TopBar from '@/parts/TopBar.vue'

const { state } = useMock(states)
const route = useRoute()
const toast = useToast()
const justSubmitted = computed(() => 'toast' in route.query && state.value === 'submitted')
onMounted(() => {
  if (justSubmitted.value) toast.add({ title: 'Timesheet submitted', description: 'Your manager will review it.', icon: 'i-lucide-circle-check', color: 'success' })
})
const days = ref<Day[]>([])
const opened = ref(new Set<number>()) // phone: empty days the user chose to fill in
const which = ref<'previous' | 'current'>('current')
const saving = ref(false)
const confirmClear = ref(false)
watch(state, () => { days.value = fortnight(String(state.value)); opened.value = new Set() }, { immediate: true })

const s = computed(() => String(state.value))
const editable = computed(() => ['draft', 'empty', 'rejected', 'full'].includes(s.value))
const weeks = computed(() => [days.value.slice(0, 5), days.value.slice(5)])
const has = (d: Day) => d.start != null || d.finish != null || d.brk != null
const valid = (d: Day) => d.start != null && d.finish != null && d.finish > d.start && (d.brk ?? 0) < d.finish - d.start
const total = (list: Day[]) => list.filter(valid).reduce((sum, d) => sum + worked(d), 0)
const anyHours = computed(() => days.value.some(valid))
const anything = computed(() => days.value.some(has))
const problem = (d: Day) =>
  d.start != null && d.finish == null ? 'Add a finish time'
  : d.finish != null && d.start == null ? 'Add a start time'
  : d.start != null && d.finish != null && d.finish <= d.start ? 'Finish time must be after start time'
  : d.start != null && d.finish != null && !valid(d) ? 'Rest break must be shorter than the shift'
  : null
const shiftText = (d: Day) => `${time(d.start!)} to ${time(d.finish!)}, ${d.brk ?? 0} min break`
const periodLabel = computed(() => (which.value === 'current' ? period.label : '21/09/2026 to 02/10/2026'))
const status = computed(() => ({
  draft: { label: 'Draft', text: 'text-ink', icon: 'i-lucide-pencil-line' },
  full: { label: 'Draft', text: 'text-ink', icon: 'i-lucide-pencil-line' },
  rejected: { label: 'Rejected', text: 'text-danger', icon: 'i-lucide-undo-2' },
  submitted: { label: 'Submitted', text: 'text-info', icon: 'i-lucide-clock' },
  approved: { label: 'Approved', text: 'text-approved', icon: 'i-lucide-circle-check' },
} as const)[s.value as 'draft'])

function touch() { saving.value = true; setTimeout(() => (saving.value = false), 700) }
function set(d: Day, f: 'start' | 'finish' | 'brk', value: number | undefined) { d[f] = value; touch() }
function clearAll() {
  days.value = days.value.map(({ weekday, date, future }) => ({ weekday, date, future }))
  opened.value = new Set()
  confirmClear.value = false
  touch()
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="timesheet" />

    <main class="mx-auto max-w-5xl md:px-4 md:py-8">
      <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
        <!-- Document header, as on the paper sheet -->
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 class="text-2xl font-semibold">{{ me.name }} Timesheet</h1>
          <div class="flex items-center gap-3">
            <p v-if="editable && anything" class="flex items-center gap-1 text-sm text-ink-muted" role="status">
              <template v-if="saving">Saving…</template>
              <template v-else><UIcon name="i-lucide-check" class="size-4" /> Saved</template>
            </p>
            <p v-if="status && (s !== 'draft' || anything)" :class="['flex items-center gap-1.5 font-semibold', status.text, justSubmitted && 'status-settle']"><UIcon :name="status.icon" class="size-5" /> {{ status.label }}</p>
          </div>
        </div>

        <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <template v-if="s !== 'no-schedule'">
            <dt class="text-ink-muted">Pay period</dt>
            <dd class="font-mono tabular-nums">{{ periodLabel }}</dd>
          </template>
          <template v-if="s === 'submitted' || s === 'approved'">
            <dt class="text-ink-muted">Submitted</dt>
            <dd class="font-mono tabular-nums">{{ submitted.at }}</dd>
          </template>
          <template v-if="s === 'approved'">
            <dt class="text-ink-muted">Approved</dt>
            <dd>{{ approval.by }}, <span class="font-mono tabular-nums">{{ approval.at }}</span></dd>
          </template>
        </dl>

        <div v-if="s !== 'no-schedule'" class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <UFieldGroup aria-label="Fortnight">
            <UButton color="neutral" :variant="which === 'previous' ? 'solid' : 'outline'" class="h-11 md:h-9" @click="which = 'previous'">Previous fortnight</UButton>
            <UButton color="neutral" :variant="which === 'current' ? 'solid' : 'outline'" class="h-11 md:h-9" @click="which = 'current'">Current fortnight</UButton>
          </UFieldGroup>
          <p v-if="(s === 'draft' || s === 'full') && anything" class="text-sm text-ink-muted">
            Kept until <span class="font-mono tabular-nums">{{ period.expires }}</span> if not submitted
          </p>
        </div>

        <!-- Rejected: the manager's reason comes first -->
        <section v-if="s === 'rejected'" class="mt-6 rounded-sm border border-danger/40 bg-danger/5 p-4">
          <h2 class="flex items-center gap-2 font-semibold text-danger">
            <UIcon name="i-lucide-undo-2" class="size-5" /> Rejected by {{ rejection.by }}
          </h2>
          <p class="mt-1 text-sm text-ink-muted font-mono tabular-nums">{{ rejection.at }}</p>
          <blockquote class="mt-2">{{ rejection.reason }}</blockquote>
          <p class="mt-2 text-sm">Correct the hours below, then submit again.</p>
        </section>

        <p v-if="s === 'submitted'" class="mt-6 text-ink-muted">
          Waiting for approval. Submitted timesheets can't be changed; if something's wrong, ask your manager to reject it.
        </p>

        <!-- FR-06: nothing to fill in until the pay schedule exists -->
        <section v-if="s === 'no-schedule'" class="mt-10 border-t border-rule pt-8 pb-6">
          <h2 class="text-xl font-semibold">Your manager hasn't set up the pay schedule yet</h2>
          <p class="mt-2 text-ink-muted">You'll be able to enter your hours once it's set up.</p>
        </section>

        <template v-else>
          <section v-for="(week, w) in weeks" :key="w" class="mt-10">
            <h2 class="text-xl font-semibold">Week {{ w + 1 }}</h2>

            <!-- Desktop: the paper sheet's table -->
            <table class="mt-3 hidden w-full table-fixed border-collapse md:table">
              <colgroup><col class="w-48" /><col class="w-52" /><col class="w-32" /><col class="w-52" /><col /></colgroup>
              <thead>
                <tr class="border-b border-ink text-left text-sm text-ink-muted">
                  <th class="w-44 py-2 font-normal">Date</th>
                  <th class="py-2 font-normal">Start time</th>
                  <th class="py-2 font-normal">Rest break (mins)</th>
                  <th class="py-2 font-normal">Finish time</th>
                  <th class="py-2 text-right font-normal">Total hours</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(d, j) in week" :key="d.date">
                  <tr :class="[warning(d) && 'bg-caution-bg', !(warning(d) || problem(d)) && 'border-b border-rule']">
                    <td class="py-2 pl-1 whitespace-nowrap">
                      <span class="inline-block w-10 font-semibold">{{ d.weekday }}</span>
                      <span class="font-mono tabular-nums">{{ d.date }}</span>
                      <span v-if="d.date === period.today" class="ml-2 text-sm text-ink-muted">Today</span>
                    </td>
                    <template v-if="d.future">
                      <td colspan="4" class="py-2 text-sm text-ink-muted">Hours can't be added for future days</td>
                    </template>
                    <template v-else-if="editable">
                      <td class="py-2"><TimeField :model-value="d.start" :label="`${d.weekday} ${d.date} start time`" @update:model-value="(m) => set(d, 'start', m)" /></td>
                      <td class="py-2">
                        <UInput
                          :model-value="d.brk ?? ''" type="number" inputmode="numeric" min="0" size="xl" class="w-20"
                          :aria-label="`${d.weekday} ${d.date} rest break in minutes`" :ui="{ base: 'h-11 text-right font-mono tabular-nums md:h-9' }"
                          @update:model-value="(x) => set(d, 'brk', x === '' ? undefined : Number(x))"
                        />
                      </td>
                      <td class="py-2"><TimeField :model-value="d.finish" default-pm :label="`${d.weekday} ${d.date} finish time`" @update:model-value="(m) => set(d, 'finish', m)" /></td>
                    </template>
                    <template v-else>
                      <td class="py-2 font-mono tabular-nums">{{ d.start != null ? time(d.start) : '' }}</td>
                      <td class="py-2 font-mono tabular-nums">{{ d.start != null ? d.brk ?? 0 : '' }}</td>
                      <td class="py-2 font-mono tabular-nums">{{ d.finish != null ? time(d.finish) : '' }}</td>
                    </template>
                    <td v-if="!d.future" class="py-2 pr-1 text-right font-mono whitespace-nowrap tabular-nums">{{ valid(d) ? hours(worked(d)) : '' }}</td>
                  </tr>
                  <tr v-if="warning(d) || problem(d)" :class="['border-b border-rule', warning(d) && 'bg-caution-bg']">
                    <td colspan="5" class="pb-2 pl-1">
                      <p v-if="problem(d)" class="flex items-center gap-2 text-sm text-danger"><UIcon name="i-lucide-circle-alert" class="size-4" /> {{ problem(d) }}</p>
                      <p v-else class="flex items-center gap-2 text-sm text-caution"><UIcon name="i-lucide-triangle-alert" class="size-4" /> This shift is {{ hm(worked(d)) }}. Is AM/PM correct?</p>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="pt-3 text-right text-ink-muted">Week {{ w + 1 }} total</td>
                  <td class="pt-3 pr-1 text-right"><span class="border-t border-ink pt-1 font-mono font-medium whitespace-nowrap tabular-nums">{{ hours(total(week)) }}</span></td>
                </tr>
              </tfoot>
            </table>

            <!-- Phone: one ruled block per day -->
            <ol class="mt-3 border-t border-ink md:hidden">
              <li v-for="(d, j) in week" :key="d.date" :class="['-mx-4 border-b border-rule px-4 py-3', warning(d) && 'bg-caution-bg']">
                <div class="flex items-baseline justify-between gap-3">
                  <p>
                    <span class="font-semibold">{{ d.weekday }}</span>
                    <span class="ml-2 font-mono tabular-nums">{{ d.date }}</span>
                    <span v-if="d.date === period.today" class="ml-2 text-sm text-ink-muted">Today</span>
                  </p>
                  <p class="font-mono tabular-nums">{{ valid(d) ? hours(worked(d)) : '' }}</p>
                </div>
                <p v-if="d.future" class="mt-1 text-sm text-ink-muted">Hours can't be added for future days</p>
                <template v-else-if="editable">
                  <UButton v-if="!has(d) && !opened.has(w * 5 + j)" variant="link" class="-ml-2.5 mt-1 h-11" @click="opened.add(w * 5 + j)">Add hours</UButton>
                  <dl v-else class="mt-2 grid grid-cols-[9rem_1fr] items-center gap-y-2">
                    <dt>Start time</dt>
                    <dd><TimeField :model-value="d.start" :label="`${d.weekday} ${d.date} start time`" @update:model-value="(m) => set(d, 'start', m)" /></dd>
                    <dt>Rest break (mins)</dt>
                    <dd>
                      <UInput
                        :model-value="d.brk ?? ''" type="number" inputmode="numeric" min="0" size="xl" class="w-20"
                        :aria-label="`${d.weekday} ${d.date} rest break in minutes`" :ui="{ base: 'h-11 text-right font-mono tabular-nums md:h-9' }"
                        @update:model-value="(x) => set(d, 'brk', x === '' ? undefined : Number(x))"
                      />
                    </dd>
                    <dt>Finish time</dt>
                    <dd><TimeField :model-value="d.finish" default-pm :label="`${d.weekday} ${d.date} finish time`" @update:model-value="(m) => set(d, 'finish', m)" /></dd>
                  </dl>
                </template>
                <p v-else-if="valid(d)" class="mt-1 font-mono text-sm tabular-nums">{{ shiftText(d) }}</p>
                <p v-if="problem(d)" class="mt-2 flex items-center gap-2 text-sm text-danger"><UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" /> {{ problem(d) }}</p>
                <p v-else-if="warning(d)" class="mt-2 flex items-center gap-2 text-sm text-caution"><UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" /> This shift is {{ hm(worked(d)) }}. Is AM/PM correct?</p>
              </li>
              <li class="flex items-baseline justify-between gap-3 pt-3">
                <span class="text-ink-muted">Week {{ w + 1 }} total</span>
                <span class="border-t border-ink pt-1 font-mono font-medium tabular-nums">{{ hours(total(week)) }}</span>
              </li>
            </ol>
          </section>

          <!-- Fortnight total: the screen's one confident element, double-ruled like a ledger total -->
          <section class="mt-12 border-t border-ink pt-4">
            <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 class="text-xl font-semibold">Fortnight total</h2>
              <p class="border-b-4 border-double border-ink font-mono text-[2rem] leading-tight font-medium tabular-nums">{{ hours(total(days)) }}</p>
            </div>
            <p class="mt-4 max-w-prose text-sm text-ink-muted">Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.</p>
          </section>

          <div v-if="editable" class="mt-10 flex flex-col-reverse gap-3 md:flex-row md:items-start md:justify-between">
            <UButton color="neutral" variant="ghost" size="xl" class="h-11 justify-center" :disabled="!anything" @click="confirmClear = true">Clear</UButton>
            <div class="flex flex-col gap-2 md:items-end">
              <UButton size="xl" class="h-11 w-full justify-center md:w-auto md:px-8" :disabled="!anyHours" :to="{ path: '/timesheet/review', query: { state: days.some(warning) ? 'ready' : 'no-warnings' } }">Submit</UButton>
              <p v-if="!anyHours" class="text-sm text-ink-muted">Add hours to at least one day to submit.</p>
            </div>
          </div>
        </template>
      </article>
    </main>

    <UModal v-model:open="confirmClear" title="Clear this timesheet?">
      <template #body>
        <p>All hours for <span class="font-mono tabular-nums">{{ period.label }}</span> will be removed. This can't be undone.</p>
        <p v-if="s === 'rejected'" class="mt-2 text-ink-muted">A cleared rejected timesheet is deleted after 3 months unless you enter hours again.</p>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="confirmClear = false">Keep hours</UButton>
          <UButton color="error" size="xl" class="h-11 justify-center" @click="clearAll">Clear timesheet</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* The one considered moment (ui-motion §4): the status settles after submitting */
@media (prefers-reduced-motion: no-preference) {
  @keyframes status-settle { from { transform: scale(1.04); opacity: 0.4; } to { transform: scale(1); opacity: 1; } }
  .status-settle { animation: status-settle 240ms var(--ease-out-strong); transform-origin: right center; }
}
</style>
