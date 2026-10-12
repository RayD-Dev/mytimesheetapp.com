<script lang="ts">
export const title = 'Admin'
export const order = 6
export const states = {
  'pdf-some': 'PDF: 1 approved, 4 not approved yet',
  'pdf-all': 'PDF: every timesheet approved',
  setup: 'First run: pay schedule not set (FR-04, FR-06)',
  'add-employee': 'Add employee form open',
  'employee-added': 'Employee added: temporary password shown once',
  deactivate: 'Deactivate confirmation open (FR-25)',
  'reset-password': 'Password reset: new temporary password shown once',
}
</script>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import type { CalendarDate, DateValue } from '@internationalized/date'
import { useMock } from '@/mock'
import { team, employees, fortnights, paySchedule, tempPassword } from '@/fixtures'
import TopBar from '@/parts/TopBar.vue'
import StatusHeading from '@/parts/StatusHeading.vue'

const { state } = useMock(states)
const s = computed(() => String(state.value))
const toast = useToast()

// Fortnight PDF (FR-22, FR-23)
const fortnight = ref(fortnights[0].value)
const people = computed(() => team.map((p) => (s.value === 'pdf-all' && p.status !== 'Approved' ? { ...p, status: p.own ? 'Self-approved' as const : 'Approved' as const } : p)))
const approvedCount = computed(() => people.value.filter((p) => p.status === 'Approved' || p.status === 'Self-approved').length)
const notApproved = computed(() => people.value.filter((p) => p.status !== 'Approved' && p.status !== 'Self-approved'))
const pdfGroups = computed(() => [
  { kind: 'todo' as const, title: 'Waiting for your approval', rows: notApproved.value.filter((p) => p.status === 'Submitted') },
  { kind: 'back' as const, title: 'Rejected, waiting for the employee', rows: notApproved.value.filter((p) => p.status === 'Rejected') },
].filter((g) => g.rows.length))
const scheduleSet = computed(() => s.value !== 'setup')

// Pay schedule (FR-04, FR-05): Mondays only
const start = shallowRef<CalendarDate>()
const pickOpen = ref(false)
const notMonday = (d: DateValue) => d.toDate('UTC').getUTCDay() !== 1
const ddmmyyyy = (d: CalendarDate) => `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`

// Employees (FR-24, FR-25)
const list = computed(() => (s.value === 'setup' ? employees.filter((e) => e.manager) : employees))
const adding = ref(false)
const added = ref(false)
const newName = ref('')
const newEmail = ref('')
const target = ref(employees.find((e) => e.id === 'lee')!)
const deactivating = ref(false)
const resetting = ref<'confirm' | 'done' | null>(null)
watch(s, (st) => {
  adding.value = st === 'add-employee' || st === 'employee-added'
  added.value = st === 'employee-added'
  newName.value = st === 'employee-added' ? 'Morgan Blake' : ''
  newEmail.value = st === 'employee-added' ? 'morgan.b@example.com' : ''
  deactivating.value = st === 'deactivate'
  resetting.value = st === 'reset-password' ? 'done' : null
}, { immediate: true })
const firstName = (n: string) => n.split(' ')[0]
const copy = async (text: string) => { await navigator.clipboard?.writeText(text); toast.add({ title: 'Copied', icon: 'i-lucide-copy-check', color: 'neutral' }) }
const actions = (e: (typeof employees)[number]) => [[
  { label: 'Reset password', icon: 'i-lucide-key-round', onSelect: () => { target.value = e; resetting.value = 'confirm' } },
  { label: 'Deactivate', icon: 'i-lucide-user-x', color: 'error' as const, onSelect: () => { target.value = e; deactivating.value = true } },
]]
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="admin" manager />

    <main class="mx-auto max-w-5xl md:px-4 md:py-8">
      <article class="flex flex-col bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
        <h1 class="text-2xl font-semibold">Admin</h1>

        <!-- Fortnight PDF: the fortnightly job, so it comes first -->
        <section class="order-2 mt-10 border-t border-ink pt-4">
          <h2 class="text-xl font-semibold">Fortnight PDF for the accountant</h2>
          <p v-if="!scheduleSet" class="mt-2 text-ink-muted">Available once the pay schedule is set.</p>
          <template v-else>
            <p class="mt-1 max-w-prose text-ink-muted">One A4 page per approved timesheet, signed by the employee and you.</p>
            <UFormField label="Fortnight" class="mt-4 max-w-sm">
              <USelect v-model="fortnight" :items="fortnights" size="xl" class="w-full tabular-nums" :ui="{ base: 'h-11 md:h-9' }" />
            </UFormField>

            <div v-if="notApproved.length" class="mt-6 max-w-xl">
              <p class="flex items-center gap-2 font-semibold text-caution">
                <UIcon name="i-lucide-triangle-alert" class="size-5 shrink-0" /> {{ notApproved.length }} not approved yet, so not in the PDF
              </p>
              <section v-for="g in pdfGroups" :key="g.kind" class="mt-4">
                <StatusHeading small :kind="g.kind" :title="g.title" :count="g.rows.length" />
                <ul class="mt-1">
                  <li v-for="p in g.rows" :key="p.id" class="flex flex-wrap items-center justify-between gap-x-4 border-b border-rule">
                    <span :class="g.kind === 'todo' && 'font-semibold'">{{ p.name }}<span v-if="p.own" class="font-normal text-ink-muted"> (you)</span></span>
                    <a
                      v-if="g.kind === 'todo'"
                      :href="`#/approvals/2026-10-05/${p.id}?state=${p.own ? 'own' : 'submitted'}`"
                      class="flex h-11 items-center gap-1 text-accent underline underline-offset-4"
                    >Review <UIcon name="i-lucide-arrow-right" class="size-4" /></a>
                    <span v-else class="flex h-11 items-center text-ink-muted">Waiting for {{ firstName(p.name) }}</span>
                  </li>
                </ul>
              </section>
              <p class="mt-3 text-sm text-ink-muted">People with no hours this fortnight aren't listed.</p>
            </div>
            <p v-else class="mt-6 flex items-center gap-2 text-approved">
              <UIcon name="i-lucide-circle-check" class="size-5 shrink-0" /> All {{ approvedCount }} timesheets for this fortnight are approved.
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <UButton size="xl" icon="i-lucide-download" class="h-11 justify-center" :disabled="!approvedCount">Download PDF</UButton>
              <span class="text-ink-muted">{{ approvedCount }} approved timesheet{{ approvedCount === 1 ? '' : 's' }}</span>
            </div>
          </template>
        </section>

        <!-- Employees (FR-24) -->
        <section class="order-3 mt-12 border-t border-ink pt-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Employees</h2>
            <UButton color="neutral" variant="outline" size="xl" icon="i-lucide-user-plus" class="h-11 md:h-9" @click="adding = true; added = false">Add employee</UButton>
          </div>
          <ul class="mt-4 border-t border-ink">
            <li v-for="e in list" :key="e.id" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-rule py-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_11rem_14rem]">
              <span :class="['min-w-0', !e.active && 'text-ink-muted']">
                <span class="font-semibold">{{ e.name }}</span>
                <span v-if="e.manager" class="text-ink-muted"> (you, manager)</span>
                <span class="block truncate text-sm text-ink-muted md:hidden">{{ e.email }}</span>
              </span>
              <span class="hidden truncate text-ink-muted md:block">{{ e.email }}</span>
              <span :class="['hidden md:block', e.active ? '' : 'text-ink-muted']">{{ e.active ? 'Active' : 'Deactivated' }} <span v-if="!e.active" class="font-mono tabular-nums">{{ e.deactivatedOn }}</span></span>
              <span class="flex justify-end">
                <template v-if="e.active && !e.manager">
                  <span class="hidden gap-1 whitespace-nowrap md:flex">
                    <UButton color="neutral" variant="ghost" class="h-9" @click="target = e; resetting = 'confirm'">Reset password</UButton>
                    <UButton color="error" variant="ghost" class="h-9" @click="target = e; deactivating = true">Deactivate</UButton>
                  </span>
                  <UDropdownMenu :items="actions(e)" :content="{ align: 'end' }" class="md:hidden">
                    <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis" class="size-11 justify-center" :aria-label="`Actions for ${e.name}`" />
                  </UDropdownMenu>
                </template>
                <span v-else-if="!e.active" class="text-sm text-ink-muted md:hidden">Deactivated <span class="font-mono tabular-nums">{{ e.deactivatedOn }}</span></span>
              </span>
            </li>
          </ul>
          <p class="mt-3 max-w-prose text-sm text-ink-muted">Deactivated people can't sign in. Their timesheets are kept.</p>
        </section>

        <!-- Pay schedule (FR-04, FR-05): first on first run, last once it's set -->
        <section :class="['mt-12 border-t border-ink pt-4', scheduleSet ? 'order-4' : 'order-1 mt-6']">
          <h2 class="text-xl font-semibold">Pay schedule</h2>
          <template v-if="scheduleSet">
            <p class="mt-2">Fortnights start every second Monday, counting from <span class="font-mono tabular-nums">{{ paySchedule.start }}</span>.</p>
            <p class="mt-2 flex items-center gap-2 text-sm text-ink-muted"><UIcon name="i-lucide-lock" class="size-4 shrink-0" /> This can't be changed now that timesheets exist.</p>
          </template>
          <template v-else>
            <p class="mt-2 flex gap-2 text-caution"><UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-5 shrink-0" /> Staff can't enter hours until you set this.</p>
            <p class="mt-2 max-w-prose text-ink-muted">Choose the Monday your first fortnight starts. Fortnights then repeat every 14 days, the same for everyone. Once anyone enters hours, it can't be changed.</p>
            <UFormField label="First fortnight starts" class="mt-4">
              <UPopover v-model:open="pickOpen">
                <UButton color="neutral" variant="outline" size="xl" icon="i-lucide-calendar" class="h-11 md:h-9" :class="start && 'font-mono tabular-nums'">{{ start ? `Monday ${ddmmyyyy(start)}` : 'Choose a Monday' }}</UButton>
                <template #content>
                  <UCalendar v-model="start" size="xl" :week-starts-on="1" :is-date-disabled="notMonday" class="p-2" @update:model-value="pickOpen = false" />
                </template>
              </UPopover>
            </UFormField>
            <UButton size="xl" class="mt-4 h-11 justify-center" :disabled="!start">Save pay schedule</UButton>
          </template>
        </section>
      </article>
    </main>

    <!-- Add employee: form, then the temporary password, shown once -->
    <UModal v-model:open="adding" :title="added ? `${newName} added` : 'Add employee'">
      <template #body>
        <template v-if="!added">
          <div class="space-y-4">
            <UFormField label="Full name" required>
              <UInput v-model="newName" size="xl" class="w-full" autocomplete="off" :ui="{ base: 'h-11 md:h-9' }" />
            </UFormField>
            <UFormField label="Email" description="For password reset emails." required>
              <UInput v-model="newEmail" type="email" size="xl" class="w-full" autocomplete="off" :ui="{ base: 'h-11 md:h-9' }" />
            </UFormField>
          </div>
          <p class="mt-4 text-sm text-ink-muted">You'll get a temporary password to give them. They choose their own when they first sign in.</p>
        </template>
        <template v-else>
          <p>Give {{ firstName(newName) }} this temporary password. They'll choose their own when they first sign in.</p>
          <div class="mt-4 flex items-center gap-3">
            <code class="rounded-sm border border-rule bg-paper px-3 py-2 font-mono text-lg tabular-nums">{{ tempPassword }}</code>
            <UButton color="neutral" variant="outline" icon="i-lucide-copy" class="h-11 md:h-9" @click="copy(tempPassword)">Copy</UButton>
          </div>
          <p class="mt-3 text-sm text-ink-muted">You won't see this password again. If it's lost, reset it from the employee list.</p>
        </template>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <template v-if="!added">
            <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="adding = false">Cancel</UButton>
            <UButton size="xl" class="h-11 justify-center" :disabled="!newName.trim() || !newEmail.includes('@')" @click="added = true">Add employee</UButton>
          </template>
          <UButton v-else size="xl" class="h-11 justify-center" @click="adding = false">Done</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="deactivating" :title="`Deactivate ${target.name}?`">
      <template #body>
        <p>{{ firstName(target.name) }} won't be able to sign in. Their timesheets are kept, including any waiting for approval.</p>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="deactivating = false">Cancel</UButton>
          <UButton color="error" size="xl" class="h-11 justify-center" @click="deactivating = false">Deactivate</UButton>
        </div>
      </template>
    </UModal>

    <UModal :open="!!resetting" :title="resetting === 'done' ? `New temporary password for ${firstName(target.name)}` : `Reset ${firstName(target.name)}'s password?`" @update:open="(o) => !o && (resetting = null)">
      <template #body>
        <p v-if="resetting === 'confirm'">Their current password stops working. You'll get a temporary password to give them, and they'll choose a new one when they sign in.</p>
        <template v-else>
          <div class="flex items-center gap-3">
            <code class="rounded-sm border border-rule bg-paper px-3 py-2 font-mono text-lg tabular-nums">{{ tempPassword }}</code>
            <UButton color="neutral" variant="outline" icon="i-lucide-copy" class="h-11 md:h-9" @click="copy(tempPassword)">Copy</UButton>
          </div>
          <p class="mt-3 text-sm text-ink-muted">You won't see this password again.</p>
        </template>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <template v-if="resetting === 'confirm'">
            <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="resetting = null">Cancel</UButton>
            <UButton size="xl" class="h-11 justify-center" @click="resetting = 'done'">Reset password</UButton>
          </template>
          <UButton v-else size="xl" class="h-11 justify-center" @click="resetting = null">Done</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
