<script setup lang="ts">
import PageSheet from './PageSheet.vue'

// FE design 7.2: says what didn't load; Try again asks the page to run its load again.
defineProps<{ title: string; what: string; width?: 'max-w-5xl' | 'max-w-3xl' }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <PageSheet :width="width">
    <h1 class="text-2xl font-semibold">
      {{ title }}
    </h1>
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
        class="mt-6 h-11 justify-center md:h-9"
        @click="$emit('retry')"
      >
        Try again
      </UButton>
    </section>
  </PageSheet>
</template>
