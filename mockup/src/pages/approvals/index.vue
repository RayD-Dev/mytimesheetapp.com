<script lang="ts">
export const title = 'Approvals'
export const order = 4
export const states = {
  waiting: 'Three to approve (one is your own), one approved, one rejected',
  'after-reject': 'Back from rejecting Priya: toast, row moved to Rejected',
  'all-done': 'Everything submitted is approved',
  none: 'Nothing submitted yet this fortnight',
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMock } from '@/mock'
import { team, fortnights } from '@/fixtures'
import { hours } from '@/fmt'
import TopBar from '@/parts/TopBar.vue'
import StatusHeading from '@/parts/StatusHeading.vue'

const { state } = useMock(states)
const s = computed(() => String(state.value))
const toast = useToast()
const fortnight = ref(fortnights[0].value)

const people = computed(() =>
  s.value === 'none' ? []
  : team.map((p) =>
      s.value === 'after-reject' && p.id === 'priya' ? { ...p, status: 'Rejected' as const }
      : s.value === 'all-done' && p.status === 'Submitted' ? { ...p, status: p.own ? 'Self-approved' as const : 'Approved' as const }
      : p))
const groups = computed(() => [
  { key: 'todo', title: 'To approve', rows: people.value.filter((p) => p.status === 'Submitted') },
  { key: 'done', title: 'Approved', rows: people.value.filter((p) => p.status === 'Approved' || p.status === 'Self-approved') },
  { key: 'back', title: 'Rejected, waiting for the employee', rows: people.value.filter((p) => p.status === 'Rejected') },
])
const link = (p: (typeof team)[number]) =>
  `#/approvals/2026-10-05/${p.id}?state=${p.status === 'Submitted' ? (p.own ? 'own' : 'submitted') : p.status === 'Rejected' ? 'rejected' : 'approved'}`
const statusIcon: Record<string, string> = { Submitted: 'i-lucide-clock', Approved: 'i-lucide-circle-check', 'Self-approved': 'i-lucide-circle-check', Rejected: 'i-lucide-undo-2' }
const statusText: Record<string, string> = { Submitted: 'text-info', Approved: 'text-approved', 'Self-approved': 'text-approved', Rejected: 'text-danger' }

onMounted(() => {
  if (s.value === 'after-reject') toast.add({ title: 'Timesheet rejected', description: 'Priya Ramaswamy-Kingsley can now correct it.', icon: 'i-lucide-undo-2', color: 'neutral' })
})
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="approvals" manager />

    <main class="mx-auto max-w-5xl md:px-4 md:py-8">
      <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
        <h1 class="text-2xl font-semibold">Approvals</h1>
        <UFormField label="Fortnight" class="mt-4 max-w-sm">
          <USelect v-model="fortnight" :items="fortnights" size="xl" class="w-full tabular-nums" :ui="{ base: 'h-11 md:h-9' }" />
        </UFormField>

        <section v-if="!people.length" class="mt-10 border-t border-rule pt-8 pb-6">
          <h2 class="text-xl font-semibold">No timesheets submitted for this fortnight yet</h2>
          <p class="mt-2 text-ink-muted">They'll appear here as people submit them.</p>
        </section>

        <template v-else>
          <section v-for="g in groups" :key="g.key" class="mt-10">
            <StatusHeading :kind="g.key" :title="g.title" :count="g.rows.length" />
            <div v-if="g.key === 'todo' && !g.rows.length" class="mt-2 py-4">
              <p>Nothing to approve. Every submitted timesheet for this fortnight is approved.</p>
              <a href="#/admin" class="mt-2 inline-flex h-11 items-center text-accent underline underline-offset-4">Download the fortnight's PDF on the Admin page</a>
            </div>
            <p v-else-if="!g.rows.length" class="mt-2 py-4 text-ink-muted">None</p>

            <ul v-else class="mt-1">
              <li v-for="p in g.rows" :key="p.id" class="border-b border-rule">
                <a :href="link(p)" class="-mx-4 grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 hover:bg-paper md:mx-0 md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_8rem_10rem_1.5rem] md:px-1">
                  <span :class="['min-w-0', g.key === 'todo' && 'font-semibold']">{{ p.name }}<span v-if="p.own" class="font-normal text-ink-muted"> (you)</span></span>
                  <span class="text-right font-mono whitespace-nowrap tabular-nums md:order-4">{{ hours(p.minutes) }}</span>
                  <span v-if="p.status === 'Submitted'" class="col-span-2 text-sm text-ink-muted md:order-2 md:col-span-1 md:text-base">
                    Submitted <span class="font-mono tabular-nums">{{ p.submittedAt }}</span>
                  </span>
                  <span v-else :class="['col-span-2 flex items-center gap-1.5 text-sm md:order-2 md:col-span-1 md:text-base', statusText[p.status]]">
                    <UIcon :name="statusIcon[p.status]" class="size-4 shrink-0" /> {{ p.status }}
                  </span>
                  <span :class="['col-span-2 text-sm md:order-3 md:col-span-1', p.warnings ? 'flex items-center gap-1.5 text-caution' : 'hidden text-ink-muted md:block']">
                    <UIcon v-if="p.warnings" name="i-lucide-triangle-alert" class="size-4 shrink-0" />{{ p.warnings ? `${p.warnings} warning${p.warnings > 1 ? 's' : ''}` : 'No warnings' }}
                  </span>
                  <UIcon name="i-lucide-chevron-right" class="hidden size-5 text-ink-muted md:order-5 md:block" />
                </a>
              </li>
            </ul>
          </section>
        </template>
      </article>
    </main>
  </div>
</template>
