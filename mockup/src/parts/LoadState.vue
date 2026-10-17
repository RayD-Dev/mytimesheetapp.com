<script setup lang="ts">
// Loading and failed-to-load (R7-7), shared by every page. Replaces the page's <main> while its data loads.
// Loading: the page title, then ruled placeholder lines like an empty sheet. The real app shows it only if
// loading takes longer than about 300 ms, so fast loads don't flash. Failed: says what didn't load, and Try again.
defineProps<{ kind: 'loading' | 'failed'; title: string; what: string; width?: 'max-w-5xl' | 'max-w-3xl' }>()
</script>

<template>
  <main :class="['mx-auto md:px-4 md:py-8', width ?? 'max-w-5xl']">
    <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8" :aria-busy="kind === 'loading'">
      <h1 class="text-2xl font-semibold">{{ title }}</h1>

      <div v-if="kind === 'loading'" class="mt-6" role="status">
        <span class="sr-only">Loading {{ what }}…</span>
        <USkeleton class="h-5 w-56 rounded-sm" />
        <ul class="mt-10 border-t border-ink">
          <li v-for="n in 5" :key="n" class="flex items-center justify-between gap-6 border-b border-rule py-4">
            <USkeleton class="h-4 w-36 rounded-sm" />
            <USkeleton class="h-4 w-20 rounded-sm" />
          </li>
        </ul>
      </div>

      <section v-else class="mt-10 border-t border-rule pt-8 pb-6" role="alert">
        <h2 class="flex items-center gap-2 text-xl font-semibold">
          <UIcon name="i-lucide-cloud-off" class="size-6 shrink-0 text-danger" /> Couldn't load {{ what }}
        </h2>
        <p class="mt-2 max-w-prose text-ink-muted">Check your internet connection, then try again.</p>
        <UButton size="xl" icon="i-lucide-rotate-cw" class="mt-6 h-11 justify-center md:h-9">Try again</UButton>
      </section>
    </article>
  </main>
</template>
