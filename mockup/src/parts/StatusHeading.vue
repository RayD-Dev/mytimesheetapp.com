<script setup lang="ts">
// Section heading for a group of timesheets by status (decided R6): a tinted band with the status
// icon in its colour and the count on the right. Colour is never the only signal.
const props = defineProps<{ kind: 'todo' | 'done' | 'back'; title: string; count: number; small?: boolean }>()
const look = {
  todo: { icon: 'i-lucide-clock', text: 'text-info', band: 'bg-info/10' },
  done: { icon: 'i-lucide-circle-check', text: 'text-approved', band: 'bg-approved/10' },
  back: { icon: 'i-lucide-undo-2', text: 'text-danger', band: 'bg-danger/10' },
}[props.kind]
</script>

<template>
  <component :is="small ? 'h3' : 'h2'" :class="['flex items-center gap-2 rounded-sm px-3 py-2 font-semibold', small ? 'text-base' : 'text-xl', look.band]">
    <UIcon :name="look.icon" :class="['shrink-0', small ? 'size-5' : 'size-6', look.text]" />
    {{ title }}
    <span class="ml-auto font-mono text-base font-medium tabular-nums">{{ count }}</span>
  </component>
</template>
