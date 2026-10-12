<script setup lang="ts">
// slop-ignore-file all -- review board chrome, not part of the design under review
// Every screen × state (× variant) at phone size (1:1) and desktop size (scaled to half).
// Filter: ?screen=<key>, e.g. approvals or approvals-fortnight-timesheet
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { screens } from './mock'

const route = useRoute()
const list = computed(() => screens.filter((s) => !route.query.screen || s.key === route.query.screen))
const variantKeys = (s: (typeof screens)[number]) => (Object.keys(s.variants).length ? Object.keys(s.variants) : [''])
const src = (href: string, state: string, v: string) => {
  const q = new URLSearchParams({ frame: '', state, ...(v && { v }) })
  return `#${href}?${q}`
}
</script>

<template>
  <main class="min-h-screen bg-paper p-4 text-ink">
    <header class="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h1 class="text-xl font-semibold">Review board</h1>
      <RouterLink :to="{ query: {} }" class="underline">All screens</RouterLink>
      <RouterLink v-for="s in screens" :key="s.key" :to="{ query: { screen: s.key } }" class="underline">{{ s.title }}</RouterLink>
    </header>
    <p v-if="!screens.length" class="text-ink-muted">No pages yet. Add .vue files to src/pages, in folders that match the URL.</p>

    <section v-for="s in list" :key="s.key" class="mb-10">
      <h2 class="mb-3 border-b border-rule pb-1 text-lg font-semibold">{{ s.title }}</h2>
      <div v-for="(label, state) in s.states" :key="state" class="mb-6">
        <h3 class="mb-2 text-sm"><b>{{ state }}</b> <span class="text-ink-muted">{{ label }}</span></h3>
        <div class="flex flex-wrap items-start gap-4">
          <template v-for="v in variantKeys(s)" :key="v">
            <figure class="max-w-full">
              <figcaption class="mb-1 text-xs text-ink-muted">
                <a :href="src(s.href, String(state), v).replace('frame=&', '')" target="_blank" class="underline">Phone{{ v ? ` · v=${v}` : '' }}</a>
              </figcaption>
              <iframe :src="src(s.href, String(state), v)" width="375" height="812" loading="lazy" class="max-w-full border border-rule bg-sheet" />
            </figure>
            <figure class="hidden lg:block">
              <figcaption class="mb-1 text-xs text-ink-muted">
                <a :href="src(s.href, String(state), v).replace('frame=&', '')" target="_blank" class="underline">Desktop{{ v ? ` · v=${v}` : '' }}</a>
              </figcaption>
              <div class="h-[400px] w-[640px] overflow-hidden border border-rule bg-sheet">
                <iframe :src="src(s.href, String(state), v)" width="1280" height="800" loading="lazy" class="origin-top-left scale-50" />
              </div>
            </figure>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>
