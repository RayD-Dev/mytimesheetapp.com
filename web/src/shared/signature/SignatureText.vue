<script setup lang="ts">
// A typed signature on one line; the text shrinks (32px down to 20px) until it fits.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import './fonts.css'
import { fitFontSize, maxFontSize } from './fit'
import { measureText } from './image'

const props = defineProps<{ text: string; family: string }>()

const line = ref<HTMLElement>()
const available = ref(0)
let observer: ResizeObserver | undefined

const refit = () => { available.value = line.value?.clientWidth ?? 0 }
onMounted(() => {
  refit()
  observer = new ResizeObserver(refit)
  if (line.value) observer.observe(line.value)
  // The script fonts load late and change the text width.
  void document.fonts.ready.then(refit)
})
onBeforeUnmount(() => observer?.disconnect())

const fontSize = computed(() =>
  available.value === 0 ? maxFontSize : fitFontSize((size) => measureText(props.text, props.family, size), available.value),
)
</script>

<template>
  <div
    ref="line"
    class="min-w-0"
  >
    <span
      class="block h-10 truncate whitespace-nowrap leading-10"
      :style="{ fontFamily: family, fontSize: `${fontSize}px` }"
    >{{ text }}</span>
  </div>
</template>
