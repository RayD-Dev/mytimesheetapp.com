<script lang="ts">
export const title = 'Admin'
export const order = 6
export const states = {
  'pdf-some': 'PDF: 1 approved, 4 not approved yet',
  'pdf-all': 'PDF: every timesheet approved',
  'pdf-failed': "PDF couldn't be made",
  setup: 'First run: pay schedule not set (FR-04, FR-06)',
  'add-employee': 'Add employee form open',
  'add-employee-error': 'Add employee: name missing, email already used',
  'employee-added': 'Employee added: temporary password shown once',
  deactivate: 'Deactivate confirmation open (FR-25)',
  'reset-password': 'Password reset: new temporary password shown once',
  'business-name': 'R7-8: changing the business name',
  logo: 'R8: a logo uploaded',
  'logo-too-big': "R8: the chosen file is too big, so it isn't used",
  loading: 'R7-7: loading, slower than 300 ms',
  'load-failed': "R7-7: couldn't load",
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import type { CalendarDate, DateValue } from '@internationalized/date'
import { useMock } from '@/mock'
import { team, employees, fortnights, paySchedule, tempPassword, business, logos } from '@/fixtures'
import TopBar from '@/parts/TopBar.vue'
import LoadState from '@/parts/LoadState.vue'
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
const nameErr = ref('')
const emailErr = ref('')
const pdfFailed = ref(false)
function firstInvalid() { nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()) }
function addEmployee() {
  nameErr.value = newName.value.trim() ? '' : 'Enter their full name.'
  const mail = newEmail.value.trim().toLowerCase()
  emailErr.value = !/.+@.+[.].+/.test(mail) ? 'Enter an email address, like name@example.com.'
    : mail === 'lee.wong@example.com' ? 'Lee Wong already uses this email.' : ''
  if (nameErr.value || emailErr.value) {
    toast.add({ title: 'Employee not added', description: 'Fix the highlighted fields.', icon: 'i-lucide-circle-alert', color: 'error' })
    firstInvalid()
    return
  }
  added.value = true
}
watch(s, (st) => {
  adding.value = st === 'add-employee' || st === 'employee-added' || st === 'add-employee-error'
  added.value = st === 'employee-added'
  newName.value = st === 'employee-added' ? 'Morgan Blake' : ''
  newEmail.value = st === 'employee-added' ? 'morgan.b@example.com' : st === 'add-employee-error' ? 'lee.wong@example.com' : ''
  nameErr.value = st === 'add-employee-error' ? 'Enter their full name.' : ''
  emailErr.value = st === 'add-employee-error' ? 'Lee Wong already uses this email.' : ''
  if (st === 'add-employee-error') toast.add({ title: 'Employee not added', description: 'Fix the highlighted fields.', icon: 'i-lucide-circle-alert', color: 'error' })
  pdfFailed.value = st === 'pdf-failed'
  if (st === 'pdf-failed') toast.add({ title: 'PDF not downloaded', description: "The PDF couldn't be made. Try again in a moment.", icon: 'i-lucide-circle-alert', color: 'error' })
  deactivating.value = st === 'deactivate'
  resetting.value = st === 'reset-password' ? 'done' : null
}, { immediate: true })
const firstName = (n: string) => n.split(' ')[0]

// Business name (R7-8): shown on the sign-in page; not set on first run
const businessName = ref('')
const nameDraft = ref('')
const editingName = ref(false)
// Logo (R8): optional; PNG or JPG up to 1 MB (SVG left out, since it can carry scripts)
const logo = ref('')
const logoError = ref('')
const nameError = ref('')
const tooBig = (msg: string) => {
  logoError.value = msg
  toast.add({ title: 'Logo not saved', description: msg, icon: 'i-lucide-circle-alert', color: 'error' })
}
const logoInput = ref<HTMLInputElement>()
function pickLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 1024 * 1024) { tooBig(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Logos can be up to 1 MB.`); return }
  logoError.value = ''
  logo.value = URL.createObjectURL(file)
  toast.add({ title: 'Logo saved', icon: 'i-lucide-circle-check', color: 'success' })
}
watch(s, (st) => {
  logo.value = st === 'logo' ? logos.badge : ''
  logoError.value = ''
  if (st === 'logo-too-big') tooBig('That file is 3.2 MB. Logos can be up to 1 MB.')
  businessName.value = st === 'setup' ? '' : business.name
  editingName.value = st === 'business-name'
  nameDraft.value = businessName.value
}, { immediate: true })
function saveName() {
  nameError.value = nameDraft.value.trim() ? '' : 'Enter the business name.'
  if (nameError.value) {
    toast.add({ title: 'Business name not saved', description: 'Fix the highlighted field.', icon: 'i-lucide-circle-alert', color: 'error' })
    firstInvalid()
    return
  }
  businessName.value = nameDraft.value.trim()
  editingName.value = false
  toast.add({ title: 'Business name saved', icon: 'i-lucide-circle-check', color: 'success' })
}
const copy = async (text: string) => { await navigator.clipboard?.writeText(text); toast.add({ title: 'Copied', icon: 'i-lucide-copy-check', color: 'neutral' }) }
const actions = (e: (typeof employees)[number]) => [[
  { label: 'Reset password', icon: 'i-lucide-key-round', onSelect: () => { target.value = e; resetting.value = 'confirm' } },
  { label: 'Deactivate', icon: 'i-lucide-user-x', color: 'error' as const, onSelect: () => { target.value = e; deactivating.value = true } },
]]
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="admin" manager />

    <LoadState v-if="s === 'loading' || s === 'load-failed'" :kind="s === 'loading' ? 'loading' : 'failed'" title="Admin" what="the admin page" />

    <main v-else class="mx-auto max-w-5xl md:px-4 md:py-8">
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
            <section v-if="pdfFailed" class="mt-3 max-w-xl rounded-sm border border-danger/40 bg-danger/5 p-3" role="alert">
              <p class="flex items-start gap-2 text-sm"><UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0 text-danger" /> The PDF couldn't be made. Try again in a moment.</p>
            </section>
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

        <!-- Business name (R7-8) and optional logo (R8): set once, shown on the sign-in page -->
        <section class="order-5 mt-12 border-t border-ink pt-4">
          <h2 class="text-xl font-semibold">Business name and logo</h2>
          <p class="mt-1 max-w-prose text-ink-muted">Shown above the sign-in box, so staff know they're in the right place.</p>
          <h3 class="mt-6 font-semibold">Name</h3>
          <form v-if="editingName || !businessName" class="mt-4 flex max-w-xl flex-col gap-3 md:flex-row md:items-end" @submit.prevent="saveName">
            <UFormField label="Business name" class="flex-1" :error="nameError">
              <UInput v-model="nameDraft" size="xl" class="w-full" maxlength="80" :ui="{ base: 'h-11 md:h-9' }" />
            </UFormField>
            <div class="flex flex-col-reverse gap-3 md:flex-row">
              <UButton v-if="businessName" color="neutral" variant="outline" size="xl" class="h-11 justify-center md:h-9" @click="editingName = false">Cancel</UButton>
              <UButton type="submit" size="xl" class="h-11 justify-center md:h-9" >Save business name</UButton>
            </div>
          </form>
          <template v-else>
            <p class="mt-4 text-lg font-semibold">{{ businessName }}</p>
            <UButton color="neutral" variant="outline" size="xl" class="mt-4 h-11 justify-center md:h-9" @click="nameDraft = businessName; editingName = true">Change business name</UButton>
          </template>
          <p v-if="!businessName && !editingName" class="mt-2 text-sm text-ink-muted">Until you set it, the sign-in page just says "Timesheets".</p>

          <h3 class="mt-8 font-semibold">Logo <span class="font-normal text-ink-muted">(optional)</span></h3>
          <input ref="logoInput" type="file" accept="image/png,image/jpeg" class="sr-only" tabindex="-1" aria-hidden="true" @change="pickLogo" />
          <template v-if="logo">
            <img :src="logo" alt="Your logo" class="mt-3 h-16 max-w-60 border border-rule bg-sheet object-contain object-left p-1" />
            <div class="mt-4 flex flex-col gap-3 md:flex-row">
              <UButton color="neutral" variant="outline" size="xl" icon="i-lucide-upload" class="h-11 justify-center md:h-9" @click="logoInput?.click()">Replace logo</UButton>
              <UButton color="neutral" variant="ghost" size="xl" class="h-11 justify-center md:h-9" @click="logo = ''">Remove logo</UButton>
            </div>
          </template>
          <template v-else>
            <p class="mt-1 max-w-prose text-ink-muted">Without one, the sign-in page shows the name on its own.</p>
            <UButton variant="outline" size="xl" icon="i-lucide-upload" class="mt-4 h-11 justify-center md:h-9" :color="logoError ? 'error' : 'neutral'" :highlight="!!logoError" :aria-invalid="logoError ? 'true' : undefined" @click="logoInput?.click()">Upload logo</UButton>
          </template>
          <p class="mt-2 text-sm text-ink-muted">PNG or JPG, up to 1 MB. A logo on a white or clear background works best.</p>
          <p v-if="logoError" class="mt-2 flex items-start gap-2 text-sm text-danger" role="alert"><UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" /> {{ logoError }}</p>
        </section>
      </article>
    </main>

    <!-- Add employee: form, then the temporary password, shown once -->
    <UModal v-model:open="adding" :title="added ? `${newName} added` : 'Add employee'">
      <template #body>
        <template v-if="!added">
          <div class="space-y-4">
            <UFormField label="Full name" required :error="nameErr">
              <UInput v-model="newName" size="xl" class="w-full" autocomplete="off" :ui="{ base: 'h-11 md:h-9' }" />
            </UFormField>
            <UFormField label="Email" description="For password reset emails." required :error="emailErr">
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
            <UButton size="xl" class="h-11 justify-center" @click="addEmployee">Add employee</UButton>
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
