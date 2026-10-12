<script lang="ts">
export const title = 'Submit review'
export const order = 2
export const states = {
  ready: 'Opened from Submit: one warning day, nothing ticked',
  ticked: 'Everything ticked, Submit timesheet enabled',
  'no-warnings': 'No warning days, so only the declaration',
  'no-signature': 'First submit: signature set-up first (FR-20)',
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMock } from '@/mock'
import { fortnight, worked, warning, me, period, type Day } from '@/fixtures'
import { hours, hm, time } from '@/fmt'
import MyTimesheet from './index.vue'
import SignatureSetup from '@/parts/SignatureSetup.vue'
import SignatureText from '@/parts/SignatureText.vue'
import { familyOf, type Signature } from '@/signature'

const { state } = useMock(states)
const router = useRouter()
const s = computed(() => String(state.value))

const days = ref<Day[]>([])
const checked = ref<Record<string, boolean>>({}) // warning days the employee has confirmed
const confirmed = ref(false)
const signature = ref<Signature | null>(null)
watch(s, (st) => {
  days.value = fortnight('draft').map((d) => (st === 'no-warnings' && warning(d) ? { ...d, finish: 1230 } : d)) // Thu fixed to 8:30 PM
  checked.value = Object.fromEntries(days.value.filter(warning).map((d) => [d.date, st === 'ticked']))
  confirmed.value = st === 'ticked'
  signature.value = st === 'no-signature' ? null : { kind: 'typed', text: me.name, style: 'aurore' }
}, { immediate: true })

const weeks = computed(() => [days.value.slice(0, 5), days.value.slice(5)].map((w) => w.filter((d) => d.start != null && d.finish != null)))
const total = (list: Day[]) => list.reduce((sum, d) => sum + worked(d), 0)
const warningDays = computed(() => days.value.filter(warning))
const missing = computed(() => [
  ...(signature.value ? [] : ['set up your signature']),
  ...warningDays.value.filter((d) => !checked.value[d.date]).map((d) => `confirm ${d.weekday} ${d.date}`),
  ...(confirmed.value ? [] : ['tick the declaration']),
])

// Full-screen step on phones, a dialog on wider screens (DESIGN.md §5)
const mq = window.matchMedia('(max-width: 767px)')
const phone = ref(mq.matches)
const onMq = () => (phone.value = mq.matches)
mq.addEventListener('change', onMq)
onBeforeUnmount(() => mq.removeEventListener('change', onMq))

const back = () => router.push({ path: '/timesheet', query: { state: 'draft' } })
const submit = () => router.push({ path: '/timesheet', query: { state: 'submitted', toast: '1' } })
</script>

<template>
  <div>
    <MyTimesheet aria-hidden="true" />
    <UModal
      :open="true"
      :fullscreen="phone"
      title="Review and submit"
      :description="`Pay period ${period.label}`"
      :ui="{ content: 'sm:max-w-2xl', description: 'font-mono tabular-nums' }"
      @update:open="(o) => !o && back()"
    >
      <template #body>
        <p class="text-ink-muted">Check each day before you submit. You can't change a timesheet once it's submitted.</p>

        <section v-for="(week, w) in weeks" :key="w" class="mt-6">
          <h3 class="border-b border-ink pb-1 font-semibold">Week {{ w + 1 }}</h3>
          <p v-if="!week.length" class="border-b border-rule py-3 text-ink-muted">No hours this week</p>
          <ul>
            <li v-for="d in week" :key="d.date" :class="['border-b border-rule py-3', warning(d) && '-mx-4 bg-caution-bg px-4 sm:-mx-6 sm:px-6']">
              <div class="flex flex-wrap items-baseline justify-between gap-x-4">
                <p><span class="font-semibold">{{ d.weekday }}</span> <span class="ml-1 font-mono tabular-nums">{{ d.date }}</span></p>
                <p class="font-mono whitespace-nowrap tabular-nums">{{ hours(worked(d)) }}</p>
              </div>
              <p class="mt-0.5 font-mono text-sm tabular-nums">{{ time(d.start!) }} to {{ time(d.finish!) }}, {{ d.brk ?? 0 }} min break</p>
              <template v-if="warning(d)">
                <p class="mt-2 flex items-center gap-2 text-sm text-caution"><UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" /> This shift is {{ hm(worked(d)) }}. Is AM/PM correct?</p>
                <UCheckbox
                  v-model="checked[d.date]"
                  class="mt-2"
                  :label="`Yes, ${time(d.start!)} to ${time(d.finish!)} is correct`"
                  :ui="{ base: 'size-6', icon: 'size-5', label: 'text-base' }"
                />
              </template>
            </li>
          </ul>
          <p class="flex items-baseline justify-between gap-3 pt-2">
            <span class="text-ink-muted">Week {{ w + 1 }} total</span>
            <span class="border-t border-ink pt-1 font-mono font-medium whitespace-nowrap tabular-nums">{{ hours(total(week)) }}</span>
          </p>
        </section>

        <section class="mt-8 border-t border-ink pt-3">
          <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 class="text-lg font-semibold">Fortnight total</h3>
            <p class="border-b-4 border-double border-ink font-mono text-2xl font-medium tabular-nums">{{ hours(total(weeks.flat())) }}</p>
          </div>
          <p class="mt-3 text-sm text-ink-muted">Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.</p>
        </section>

        <section class="mt-8">
          <h3 class="font-semibold">{{ signature ? 'Your signature' : 'Set up your signature' }}</h3>
          <template v-if="signature">
            <SignatureText v-if="signature.kind === 'typed'" :text="signature.text" :family="familyOf(signature.style)" class="mt-2" />
            <img v-else :src="signature.url" alt="Your signature" class="mt-2 h-20 max-w-sm border-b border-ink" />
            <p class="mt-1 text-sm text-ink-muted">{{ me.name }}. The date and time are added when you submit.</p>
          </template>
          <template v-else>
            <p class="mt-1 text-sm text-ink-muted">You need a signature before your first submit. It's saved to your profile and added to each timesheet you submit.</p>
            <SignatureSetup :name="me.name" class="mt-4" @done="(sig) => (signature = sig)" />
          </template>
        </section>

        <section class="mt-8 border-t border-rule pt-6">
          <UCheckbox v-model="confirmed" label="I confirm these hours are correct" :ui="{ base: 'size-6', icon: 'size-5', label: 'text-base font-semibold' }" />
          <div class="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:items-start sm:justify-between">
            <div class="flex flex-col gap-2 sm:items-end">
              <UButton size="xl" class="h-11 w-full justify-center sm:w-auto sm:px-8" :disabled="missing.length > 0" @click="submit">Submit timesheet</UButton>
              <p v-if="missing.length" class="text-sm text-ink-muted sm:text-right">To submit, {{ missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}` : missing[0] }}.</p>
            </div>
            <UButton color="neutral" variant="ghost" size="xl" class="h-11 justify-center" @click="back">Back to timesheet</UButton>
          </div>
        </section>
      </template>
    </UModal>
  </div>
</template>
