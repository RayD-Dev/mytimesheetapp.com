<script lang="ts">
// R7-3 and R7-4: any URL the app doesn't know (a catch-all route in the real app), and an employee opening a
// manager's page. Both keep the top bar, so the way back is where it always is.
export const title = 'Not found, no access'
export const order = 7
export const states = {
  'not-found': 'R7-3: a mistyped or old link',
  'no-access': 'R7-4: an employee opens Approvals or Admin',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useMock } from '@/mock'
import { me } from '@/fixtures'
import TopBar from '@/parts/TopBar.vue'

const { state } = useMock(states)
const s = computed(() => String(state.value))
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar />

    <main class="mx-auto max-w-3xl md:px-4 md:py-8">
      <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
        <template v-if="s === 'no-access'">
          <h1 class="flex items-center gap-2 text-2xl font-semibold"><UIcon name="i-lucide-lock" class="size-6 shrink-0 text-ink-muted" /> This page is for managers</h1>
          <p class="mt-4 max-w-prose">You're signed in as <span class="font-semibold">{{ me.name }}</span>, and Approvals is only for managers.</p>
          <p class="mt-2 max-w-prose text-ink-muted">If you think you should have access, ask your manager.</p>
        </template>
        <template v-else>
          <h1 class="text-2xl font-semibold">Page not found</h1>
          <p class="mt-4 max-w-prose text-ink-muted">The link may be old or mistyped. Your timesheets are all still there.</p>
        </template>
        <UButton size="xl" class="mt-8 h-11 justify-center md:h-9" to="/timesheet">Go to My timesheet</UButton>
      </article>
    </main>
  </div>
</template>
