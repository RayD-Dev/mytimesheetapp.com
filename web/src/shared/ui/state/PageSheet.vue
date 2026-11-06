<script setup lang="ts">
import { pageWidthClass, type PageWidth } from './pageWidth'

// The white sheet every page body sits on (screen specs, Layout): full width on phones, bordered and centred on desktop.
const { width = 'wide', busy } = defineProps<{ width?: PageWidth; busy?: boolean }>()
</script>

<template>
  <main :class="['mx-auto md:px-4 md:py-8', pageWidthClass[width]]">
    <article
      class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8"
      :aria-busy="busy"
    >
      <slot />
    </article>
  </main>
</template>
