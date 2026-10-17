<script lang="ts">
export const title = 'Approve a timesheet'
export const example = '/approvals/2026-10-05/priya' // a concrete URL for the board and mock bar
export const order = 5
export const states = {
  submitted: "Priya's timesheet, one warning day",
  approving: 'Approve confirmation open',
  rejecting: 'Reject dialog open, reason required',
  approved: 'Just approved: both signatures, next in the queue',
  'first-approval': 'Manager has no signature yet (FR-20)',
  own: "Manager's own timesheet, will be Self-approved (FR-19)",
  rejected: 'Rejected, waiting for the employee (read-only)',
  loading: 'R7-7: loading, slower than 300 ms',
  'load-failed': "R7-7: couldn't load",
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMock } from '@/mock'
import { daysFor, warning, team, manager, period, rejection, approval, type Day } from '@/fixtures'
import { familyOf, type Signature } from '@/signature'
import TopBar from '@/parts/TopBar.vue'
import LoadState from '@/parts/LoadState.vue'
import ReadOnlySheet from '@/parts/ReadOnlySheet.vue'
import SignatureText from '@/parts/SignatureText.vue'
import SignatureSetup from '@/parts/SignatureSetup.vue'

const { state } = useMock(states)
const s = computed(() => String(state.value))
const router = useRouter()
const route = useRoute()
const toast = useToast()

const person = computed(() => team.find((p) => p.id === (s.value === 'own' ? 'sam' : String(route.params.timesheet ?? 'priya')))!)
const days = computed<Day[]>(() => daysFor(person.value.id))
const warnings = computed(() => days.value.filter(warning).length)
const employeeSig = computed<Signature>(() => ({ kind: 'typed', text: person.value.name, style: s.value === 'own' ? manager.signatureStyle : 'aurore' }))

const mySig = ref<Signature | null>(null)
const approved = ref(false)
const confirmApprove = ref(false)
const rejecting = ref(false)
const reason = ref('')
watch(s, (st) => {
  mySig.value = st === 'first-approval' ? null : { kind: 'typed', text: manager.name, style: manager.signatureStyle }
  approved.value = st === 'approved'
  confirmApprove.value = st === 'approving'
  rejecting.value = st === 'rejecting'
  reason.value = ''
}, { immediate: true })

const status = computed(() =>
  s.value === 'rejected' ? { label: 'Rejected', text: 'text-danger', icon: 'i-lucide-undo-2' }
  : approved.value ? { label: person.value.own ? 'Self-approved' : 'Approved', text: 'text-approved', icon: 'i-lucide-circle-check' }
  : { label: 'Submitted', text: 'text-info', icon: 'i-lucide-clock' })
const next = computed(() => team.find((p) => p.status === 'Submitted' && p.id !== person.value.id))
const firstName = computed(() => person.value.name.split(' ')[0])

function approve() {
  confirmApprove.value = false
  approved.value = true
  toast.add({ title: person.value.own ? 'Timesheet self-approved' : 'Timesheet approved', icon: 'i-lucide-circle-check', color: 'success' })
}
function reject() {
  router.push({ path: '/approvals', query: { state: 'after-reject' } })
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="approvals" manager />

    <LoadState v-if="s === 'loading' || s === 'load-failed'" :kind="s === 'loading' ? 'loading' : 'failed'" title="Timesheet" what="this timesheet" />

    <main v-else class="mx-auto max-w-5xl md:px-4 md:py-6">
      <a href="#/approvals" class="mx-4 flex h-11 items-center gap-1 text-accent md:mx-0">
        <UIcon name="i-lucide-arrow-left" class="size-4" /> Approvals
      </a>
      <article class="bg-sheet px-4 pt-4 pb-10 md:mt-2 md:border md:border-rule md:px-8 md:pt-6">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 class="text-2xl font-semibold">{{ person.name }} Timesheet</h1>
          <p :class="['flex items-center gap-1.5 font-semibold', status.text]"><UIcon :name="status.icon" class="size-5" /> {{ status.label }}</p>
        </div>
        <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt class="text-ink-muted">Pay period</dt>
          <dd class="font-mono tabular-nums">{{ period.label }}</dd>
          <dt class="text-ink-muted">Submitted</dt>
          <dd class="font-mono tabular-nums">{{ person.submittedAt }}</dd>
        </dl>

        <p v-if="person.own && !approved" class="mt-6 flex gap-2">
          <UIcon name="i-lucide-info" class="mt-0.5 size-5 shrink-0 text-info" />
          <span>This is your own timesheet. When you approve it, it's marked <b>Self-approved</b> on screen and in the PDF.</span>
        </p>
        <p v-if="warnings && !approved && s !== 'rejected'" class="mt-6 flex gap-2 text-caution">
          <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-5 shrink-0" />
          <span>{{ warnings }} day{{ warnings > 1 ? 's have' : ' has' }} a warning. Check {{ warnings > 1 ? 'them' : 'it' }} before you approve.</span>
        </p>
        <section v-if="s === 'rejected'" class="mt-6 rounded-sm border border-danger/40 bg-danger/5 p-4">
          <h2 class="flex items-center gap-2 font-semibold text-danger"><UIcon name="i-lucide-undo-2" class="size-5" /> You rejected this timesheet</h2>
          <p class="mt-1 font-mono text-sm text-ink-muted tabular-nums">{{ rejection.at }}</p>
          <blockquote class="mt-2">{{ rejection.reason }}</blockquote>
          <p class="mt-2 text-sm">It comes back here when {{ firstName }} submits it again.</p>
        </section>

        <ReadOnlySheet :days="days" />

        <!-- Signatures, as at the bottom of the paper sheet -->
        <section class="mt-12 border-t border-ink pt-4">
          <h2 class="text-xl font-semibold">Signatures</h2>
          <div class="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <p class="text-sm text-ink-muted">Employee</p>
              <SignatureText :text="employeeSig.kind === 'typed' ? employeeSig.text : ''" :family="employeeSig.kind === 'typed' ? familyOf(employeeSig.style) : undefined" class="mt-2" />
              <p class="mt-1">{{ person.name }}</p>
              <p class="text-sm text-ink-muted">Confirmed <span class="font-mono tabular-nums">{{ person.submittedAt }}</span></p>
            </div>
            <div>
              <p class="text-sm text-ink-muted">{{ person.own ? 'Approver (self-approved)' : 'Approver' }}</p>
              <template v-if="approved">
                <SignatureText v-if="mySig?.kind === 'typed'" :text="mySig.text" :family="familyOf(mySig.style)" class="mt-2" />
                <img v-else-if="mySig" :src="mySig.url" alt="Your signature" class="mt-2 h-14 w-full max-w-sm border-b border-ink object-contain object-left" />
                <p class="mt-1">{{ manager.name }}</p>
                <p class="text-sm text-ink-muted">Approved <span class="font-mono tabular-nums">{{ approval.at }}</span></p>
              </template>
              <template v-else-if="s === 'rejected'">
                <p class="mt-2 border-b border-rule pb-1 text-ink-muted">Not approved</p>
              </template>
              <template v-else-if="mySig">
                <p class="mt-2 h-11 max-w-sm border-b border-dashed border-control-border" aria-hidden="true" />
                <p class="mt-1 text-sm text-ink-muted">Your signature and the date and time are added when you approve.</p>
              </template>
              <template v-else>
                <p class="mt-2 text-sm">You need a signature before your first approval. It's saved to your profile.</p>
                <SignatureSetup :name="manager.name" class="mt-4" @done="(sig) => (mySig = sig)" />
              </template>
            </div>
          </div>
        </section>

        <div v-if="!approved && s !== 'rejected'" class="mt-10 flex flex-col gap-3 md:flex-row-reverse md:items-start md:justify-between">
          <div class="flex flex-col gap-2 md:items-end">
            <UButton color="success" size="xl" class="h-11 w-full justify-center md:w-auto md:px-8" :disabled="!mySig" @click="confirmApprove = true">Approve</UButton>
            <p v-if="!mySig" class="text-sm text-ink-muted">Set up your signature to approve.</p>
          </div>
          <UButton color="error" variant="outline" size="xl" class="h-11 justify-center" @click="rejecting = true">Reject</UButton>
        </div>

        <div v-if="approved" class="mt-10 flex flex-col gap-3 border-t border-rule pt-6 md:flex-row md:items-center md:justify-between">
          <p class="text-ink-muted">Approved timesheets can't be changed.</p>
          <UButton v-if="next" size="xl" class="h-11 justify-center" trailing-icon="i-lucide-arrow-right" :to="{ path: `/approvals/2026-10-05/${next.id}`, query: { state: next.own ? 'own' : 'submitted' } }">
            Next to approve: {{ next.name }}
          </UButton>
        </div>
      </article>
    </main>

    <UModal v-model:open="confirmApprove" :title="person.own ? 'Approve your own timesheet?' : `Approve ${firstName}'s timesheet?`">
      <template #body>
        <p>Your signature and today's date and time are added. Approved timesheets can't be changed.</p>
        <SignatureText v-if="mySig?.kind === 'typed'" :text="mySig.text" :family="familyOf(mySig.style)" class="mt-4" />
        <p v-if="person.own" class="mt-3 text-ink-muted">It's marked Self-approved on screen and in the PDF.</p>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="confirmApprove = false">Cancel</UButton>
          <UButton color="success" size="xl" class="h-11 justify-center" @click="approve">Approve</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="rejecting" :title="`Reject ${firstName}'s timesheet?`">
      <template #body>
        <UFormField label="Reason" :description="`${firstName} sees this at the top of the timesheet, so say what to fix.`" required>
          <UTextarea v-model="reason" :rows="4" autoresize class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center" @click="rejecting = false">Cancel</UButton>
          <UButton color="error" size="xl" class="h-11 justify-center" :disabled="!reason.trim()" @click="reject">Reject timesheet</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
