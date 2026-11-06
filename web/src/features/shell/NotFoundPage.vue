<script setup lang="ts">
import { PageSheet, PageTitle } from '@/shared/ui/state'
</script>

<template>
  <PageSheet width="narrow">
    <PageTitle>Page not found</PageTitle>
    <p class="mt-4 max-w-prose text-ink-muted">
      The link may be old or mistyped. Your timesheets are all still there.
    </p>
    <UButton
      size="xl"
      class="mt-8"
      to="/timesheet"
    >
      Go to My timesheet
    </UButton>
  </PageSheet>
</template>
