<script setup lang="ts">
// The white sheet every page body sits on (screen specs, Layout): full width on phones, bordered and centred on desktop.
defineProps<{ width?: 'max-w-5xl' | 'max-w-3xl'; busy?: boolean }>()
</script>

<template>
  <main :class="['mx-auto md:px-4 md:py-8', width ?? 'max-w-5xl']">
    <article
      class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8"
      :aria-busy="busy"
    >
      <slot />
    </article>
  </main>
</template>
