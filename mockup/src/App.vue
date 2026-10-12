<script setup lang="ts">
// slop-ignore-file all -- mock-up chrome, not part of the design under review
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { screens } from './mock'

const route = useRoute()
const open = ref(false)
// No mock bar in screenshots (Playwright sets navigator.webdriver), in board frames, or with ?clean
const bare = computed(() => navigator.webdriver || 'frame' in route.query || 'clean' in route.query)
const current = computed(() => screens.find((s) => route.matched[0]?.path === s.path))
const withQuery = (q: Record<string, string>) => ({ path: route.path, query: { ...route.query, ...q } })
</script>

<template>
  <UApp>
    <RouterView />
    <nav v-if="!bare" class="fixed bottom-3 left-3 z-50 max-w-[calc(100vw-1.5rem)] text-sm">
      <button class="rounded bg-ink px-3 py-2 text-sheet" @click="open = !open">Mock {{ open ? '×' : '☰' }}</button>
      <div v-if="open" class="mt-2 space-y-2 rounded border border-rule bg-sheet p-3 text-ink">
        <p><RouterLink to="/board" class="underline">Review board</RouterLink></p>
        <p class="flex flex-wrap gap-2">
          <RouterLink v-for="s in screens" :key="s.key" :to="s.href" class="underline">{{ s.title }}</RouterLink>
        </p>
        <p v-if="current" class="flex flex-wrap gap-2">
          <span class="text-ink-muted">State</span>
          <RouterLink v-for="(label, key) in current.states" :key="key" :to="withQuery({ state: key })" :title="label" class="underline">{{ key }}</RouterLink>
        </p>
        <p v-if="current && Object.keys(current.variants).length" class="flex flex-wrap gap-2">
          <span class="text-ink-muted">Variant</span>
          <RouterLink v-for="(label, key) in current.variants" :key="key" :to="withQuery({ v: key })" :title="label" class="underline">{{ key }}</RouterLink>
        </p>
      </div>
    </nav>
  </UApp>
</template>
