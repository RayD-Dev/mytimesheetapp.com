<script setup lang="ts">
import PageSheet from './PageSheet.vue'
import PageTitle from './PageTitle.vue'
import type { PageWidth } from './pageWidth'

// FE design 7.2: says what didn't load; Try again asks the page to run its load again.
defineProps<{ title: string; what: string; width?: PageWidth }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <PageSheet :width="width">
    <PageTitle>{{ title }}</PageTitle>
    <section
      class="mt-10 border-t border-rule pt-8 pb-6"
      role="alert"
    >
      <h2 class="flex items-center gap-2 text-xl font-semibold">
        <UIcon
          name="i-lucide-cloud-off"
          class="size-6 shrink-0 text-danger"
          aria-hidden="true"
        />
        Couldn't load {{ what }}
      </h2>
      <p class="mt-2 max-w-prose text-ink-muted">
        Check your internet connection, then try again.
      </p>
      <UButton
        size="xl"
        icon="i-lucide-rotate-cw"
        class="mt-6"
        @click="$emit('retry')"
      >
        Try again
      </UButton>
    </section>
  </PageSheet>
</template>
