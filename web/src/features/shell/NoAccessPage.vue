<script setup lang="ts">
import { PageSheet } from '@/shared/ui/state'

// FR-01: shown to a signed-in employee on a manager page. The caller passes the name from the session.
defineProps<{ name: string }>()
</script>

<template>
  <PageSheet width="max-w-3xl">
    <h1 class="flex items-center gap-2 text-2xl font-semibold">
      <UIcon
        name="i-lucide-lock"
        class="size-6 shrink-0 text-ink-muted"
        aria-hidden="true"
      />
      This page is for managers
    </h1>
    <p class="mt-4 max-w-prose">
      You're signed in as <span class="font-semibold">{{ name }}</span>, and Approvals is only for managers.
    </p>
    <p class="mt-2 max-w-prose text-ink-muted">
      If you think you should have access, ask your manager.
    </p>
    <UButton
      size="xl"
      class="mt-8 h-11 justify-center md:h-9"
      to="/timesheet"
    >
      Go to My timesheet
    </UButton>
  </PageSheet>
</template>
