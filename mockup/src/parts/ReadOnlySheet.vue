<script setup lang="ts">
// A timesheet as read by someone who can't change it (manager review, Submitted, Approved):
// the paper sheet's table on desktop, ruled day blocks on phones, warnings on their days (FR-15, FR-27).
import { computed } from 'vue'
import { worked, warning, type Day } from '@/fixtures'
import { hours, hm, time } from '@/fmt'

const props = defineProps<{ days: Day[] }>()
const weeks = computed(() => [props.days.slice(0, 5), props.days.slice(5)])
const filled = (d: Day) => d.start != null && d.finish != null
const total = (list: Day[]) => list.filter(filled).reduce((sum, d) => sum + worked(d), 0)
</script>

<template>
  <div>
    <section v-for="(week, w) in weeks" :key="w" class="mt-10">
      <h2 class="text-xl font-semibold">Week {{ w + 1 }}</h2>

      <table class="mt-3 hidden w-full table-fixed border-collapse md:table">
        <colgroup><col class="w-48" /><col class="w-40" /><col class="w-40" /><col class="w-40" /><col /></colgroup>
        <thead>
          <tr class="border-b border-ink text-left text-sm text-ink-muted">
            <th class="py-2 font-normal">Date</th>
            <th class="py-2 font-normal">Start time</th>
            <th class="py-2 font-normal">Rest break (mins)</th>
            <th class="py-2 font-normal">Finish time</th>
            <th class="py-2 text-right font-normal">Total hours</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="d in week" :key="d.date">
            <tr :class="[warning(d) ? 'bg-caution-bg' : 'border-b border-rule']">
              <td class="py-2 pl-1 whitespace-nowrap"><span class="inline-block w-10 font-semibold">{{ d.weekday }}</span> <span class="font-mono tabular-nums">{{ d.date }}</span></td>
              <td class="py-2 font-mono tabular-nums">{{ filled(d) ? time(d.start!) : '' }}</td>
              <td class="py-2 font-mono tabular-nums">{{ filled(d) ? d.brk ?? 0 : '' }}</td>
              <td class="py-2 font-mono tabular-nums">{{ filled(d) ? time(d.finish!) : '' }}</td>
              <td class="py-2 pr-1 text-right font-mono whitespace-nowrap tabular-nums">{{ filled(d) ? hours(worked(d)) : '' }}</td>
            </tr>
            <tr v-if="warning(d)" class="border-b border-rule bg-caution-bg">
              <td colspan="5" class="pb-2 pl-1">
                <p class="flex items-center gap-2 text-sm text-caution"><UIcon name="i-lucide-triangle-alert" class="size-4" /> This shift is {{ hm(worked(d)) }}. Is AM/PM correct?</p>
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

      <ol class="mt-3 border-t border-ink md:hidden">
        <li v-for="d in week" :key="d.date" :class="['-mx-4 border-b border-rule px-4 py-3', warning(d) && 'bg-caution-bg']">
          <div class="flex items-baseline justify-between gap-3">
            <p><span class="font-semibold">{{ d.weekday }}</span> <span class="ml-2 font-mono tabular-nums">{{ d.date }}</span></p>
            <p class="font-mono whitespace-nowrap tabular-nums">{{ filled(d) ? hours(worked(d)) : '' }}</p>
          </div>
          <p v-if="filled(d)" class="mt-1 font-mono text-sm tabular-nums">{{ time(d.start!) }} to {{ time(d.finish!) }}, {{ d.brk ?? 0 }} min break</p>
          <p v-if="warning(d)" class="mt-2 flex items-center gap-2 text-sm text-caution"><UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" /> This shift is {{ hm(worked(d)) }}. Is AM/PM correct?</p>
        </li>
        <li class="flex items-baseline justify-between gap-3 pt-3">
          <span class="text-ink-muted">Week {{ w + 1 }} total</span>
          <span class="border-t border-ink pt-1 font-mono font-medium whitespace-nowrap tabular-nums">{{ hours(total(week)) }}</span>
        </li>
      </ol>
    </section>

    <section class="mt-12 border-t border-ink pt-4">
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 class="text-xl font-semibold">Fortnight total</h2>
        <p class="border-b-4 border-double border-ink font-mono text-[2rem] leading-tight font-medium tabular-nums">{{ hours(total(days)) }}</p>
      </div>
      <p class="mt-4 max-w-prose text-sm text-ink-muted">Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.</p>
    </section>
  </div>
</template>
