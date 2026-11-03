<script setup lang="ts">
import { PageSheet } from '@/shared/ui/state'
</script>

<template>
  <PageSheet width="max-w-3xl">
    <h1 class="text-2xl font-semibold">
      Page not found
    </h1>
    <p class="mt-4 max-w-prose text-ink-muted">
      The link may be old or mistyped. Your timesheets are all still there.
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
