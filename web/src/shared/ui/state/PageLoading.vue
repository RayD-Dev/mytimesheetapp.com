<script setup lang="ts">
import PageSheet from './PageSheet.vue'
import PageTitle from './PageTitle.vue'
import type { PageWidth } from './pageWidth'
import { useAfterDelay } from './useAfterDelay'

// FE design 7.2: title and ruled placeholder lines, only if loading takes longer than about 300 ms.
defineProps<{ title: string; what: string; width?: PageWidth }>()
const LOADING_DELAY_MS = 300
const visible = useAfterDelay(LOADING_DELAY_MS)
</script>

<template>
  <PageSheet
    v-if="visible"
    :width="width"
    busy
  >
    <PageTitle>{{ title }}</PageTitle>
    <div
      class="mt-6"
      role="status"
    >
      <span class="sr-only">Loading {{ what }}…</span>
      <USkeleton class="h-5 w-56 rounded-sm" />
      <ul class="mt-10 border-t border-ink">
        <li
          v-for="n in 5"
          :key="n"
          class="flex items-center justify-between gap-6 border-b border-rule py-4"
        >
          <USkeleton class="h-4 w-36 rounded-sm" />
          <USkeleton class="h-4 w-20 rounded-sm" />
        </li>
      </ul>
    </div>
  </PageSheet>
</template>
