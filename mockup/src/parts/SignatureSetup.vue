<script setup lang="ts">
// FR-20 signature set-up: type your name and pick one of three styles, or draw it.
// Reused by the submit review, first approval and Profile.
import { nextTick, ref, watch } from 'vue'
import SignatureText from '@/parts/SignatureText.vue'
import { signatureStyles, type Signature, type StyleKey } from '@/signature'

const props = defineProps<{ name: string; actionLabel?: string; cancellable?: boolean; initialStyle?: StyleKey; showError?: boolean }>()
const emit = defineEmits<{ done: [sig: Signature]; cancel: []; invalid: [] }>()

const mode = ref<'type' | 'draw'>('type')
const text = ref(props.showError ? '' : props.name)
const typeErr = ref(props.showError ? 'Type your name as you sign it.' : '')
const drawErr = ref('')
const style = ref<StyleKey>(props.initialStyle ?? signatureStyles[0].key)
const canvas = ref<HTMLCanvasElement>()
const drawn = ref(false)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false

watch(mode, async (m) => {
  if (m !== 'draw') return
  await nextTick()
  const c = canvas.value!, r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
  c.width = r.width * dpr; c.height = r.height * dpr
  ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = getComputedStyle(c).color
  drawn.value = false
})
const at = (e: PointerEvent) => { const r = canvas.value!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const }
function down(e: PointerEvent) { drawing = true; canvas.value!.setPointerCapture(e.pointerId); ctx!.beginPath(); ctx!.moveTo(...at(e)) }
function move(e: PointerEvent) { if (!drawing) return; ctx!.lineTo(...at(e)); ctx!.stroke(); drawn.value = true; drawErr.value = '' }
function clear() { ctx!.clearRect(0, 0, canvas.value!.width, canvas.value!.height); drawn.value = false }

function use() {
  typeErr.value = mode.value === 'type' && !text.value.trim() ? 'Type your name as you sign it.' : ''
  drawErr.value = mode.value === 'draw' && !drawn.value ? 'Draw your signature in the box.' : ''
  if (typeErr.value || drawErr.value) {
    emit('invalid')
    nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    return
  }
  if (mode.value === 'type') emit('done', { kind: 'typed', text: text.value.trim(), style: style.value })
  else emit('done', { kind: 'drawn', url: canvas.value!.toDataURL('image/png') })
}
</script>

<template>
  <div>
    <UFieldGroup aria-label="How to make your signature">
      <UButton color="neutral" :variant="mode === 'type' ? 'solid' : 'outline'" class="h-11 md:h-9" @click="mode = 'type'">Type it</UButton>
      <UButton color="neutral" :variant="mode === 'draw' ? 'solid' : 'outline'" class="h-11 md:h-9" @click="mode = 'draw'">Draw it</UButton>
    </UFieldGroup>

    <div v-if="mode === 'type'" class="mt-4">
      <UFormField label="Your name as you sign it" :error="typeErr">
        <UInput v-model="text" @update:model-value="typeErr = ''" size="xl" class="w-full max-w-sm" :ui="{ base: 'h-11 md:h-9' }" />
      </UFormField>
      <fieldset class="mt-5 max-w-sm min-w-0">
        <legend class="text-sm font-medium">Choose a style</legend>
        <div class="mt-2 grid grid-cols-1 gap-2">
          <label
            v-for="st in signatureStyles"
            :key="st.key"
            :class="['flex min-h-14 min-w-0 cursor-pointer items-center gap-3 rounded-sm border px-3 py-1', style === st.key ? 'border-ink bg-paper' : 'border-rule hover:border-control-border']"
          >
            <input v-model="style" type="radio" name="signature-style" :value="st.key" class="size-6 shrink-0 accent-accent" :aria-label="st.label" />
            <SignatureText :text="text" :family="st.family" :line="false" class="min-w-0 flex-1" />
          </label>
        </div>
      </fieldset>
    </div>

    <div v-else class="mt-4">
      <p class="text-sm text-ink-muted">Sign with your finger or mouse.</p>
      <div class="relative mt-2">
        <canvas
          ref="canvas"
          :class="['block h-40 w-full touch-none border bg-sheet text-ink', drawErr ? 'border-danger' : 'border-control-border']"
          aria-label="Signature drawing area"
          :aria-invalid="drawErr ? 'true' : undefined"
          tabindex="-1"
          @pointerdown="down" @pointermove="move" @pointerup="drawing = false" @pointerleave="drawing = false"
        />
        <span class="pointer-events-none absolute right-3 bottom-8 left-3 border-b border-rule" />
      </div>
      <p v-if="drawErr" class="mt-1 flex items-start gap-2 text-sm text-danger"><UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" /> {{ drawErr }}</p>
      <UButton color="neutral" variant="link" class="-ml-2.5 h-11" :disabled="!drawn" @click="clear">Clear drawing</UButton>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <UButton color="neutral" variant="outline" size="xl" class="h-11 justify-center md:h-9" @click="use">{{ actionLabel ?? 'Use this signature' }}</UButton>
      <UButton v-if="cancellable" color="neutral" variant="ghost" size="xl" class="h-11 justify-center md:h-9" @click="emit('cancel')">Cancel</UButton>
    </div>
  </div>
</template>
