<script setup lang="ts">
// A typed signature on its signature line. Shrinks to fit the line (32px down to 20px), as the
// real app will when it renders the signature to an image of fixed width (FR-20).
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ text: string; family?: string; line?: boolean }>(), { line: true })
const el = ref<HTMLElement>()
const size = ref(32)

async function fit() {
  size.value = 32
  await nextTick()
  while (el.value && size.value > 20 && el.value.scrollWidth > el.value.clientWidth) {
    size.value -= 1
    await nextTick()
  }
}
let ro: ResizeObserver | undefined
onMounted(() => {
  fit()
  document.fonts?.ready.then(fit)
  ro = new ResizeObserver(() => fit())
  if (el.value) ro.observe(el.value)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => [props.text, props.family], fit)
</script>

<template>
  <p ref="el" :class="['max-w-sm overflow-hidden font-signature leading-tight whitespace-nowrap', line && 'border-b border-ink pb-1']" :style="{ fontSize: `${size}px`, fontFamily: family }">{{ text || ' ' }}</p>
</template>
