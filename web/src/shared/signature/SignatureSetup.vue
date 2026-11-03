<script setup lang="ts">
// FR-20 signature set-up: type a name and pick a style, or draw it. Emits one value holding
// image, kind, text and style together (C-12); the pages call the API.
import SignaturePad from 'signature_pad'
import { nextTick, ref, watch } from 'vue'
import { renderTypedPng, toSignatureImage } from './image'
import SignatureText from './SignatureText.vue'
import { defaultStyle, maxTextLength, signatureStyles, type SignatureStyle, type SignatureValue } from './types'

const props = defineProps<{ name: string; actionLabel?: string; cancellable?: boolean; initialStyle?: SignatureStyle }>()
const emit = defineEmits<{ done: [signature: SignatureValue]; cancel: []; invalid: [] }>()

const mode = ref<'type' | 'draw'>('type')
const text = ref(props.name)
const style = ref<SignatureStyle>(props.initialStyle ?? defaultStyle)
const typeError = ref('')
const drawError = ref('')

const nameInput = ref<{ inputRef: HTMLInputElement | null }>()
const canvas = ref<HTMLCanvasElement>()
const drawn = ref(false)
let pad: SignaturePad | undefined

// A new blank canvas, and a new pad on it, every time the person switches to "Draw it".
watch(canvas, (element, _previous, onCleanup) => {
  if (!element) return
  drawn.value = false
  const ratio = window.devicePixelRatio || 1
  element.width = element.clientWidth * ratio
  element.height = element.clientHeight * ratio
  element.getContext('2d')?.scale(ratio, ratio)
  // Equal min and max width gives the fixed 2.5 px stroke.
  const newPad = new SignaturePad(element, { minWidth: 2.5, maxWidth: 2.5, dotSize: 2.5, penColor: '#000' })
  newPad.addEventListener('beginStroke', () => { drawError.value = '' })
  newPad.addEventListener('endStroke', () => { drawn.value = !newPad.isEmpty() })
  pad = newPad
  onCleanup(() => { newPad.off(); pad = undefined })
})

function clear() {
  pad?.clear()
  drawn.value = false
}

async function fail(focus: () => void) {
  emit('invalid')
  await nextTick()
  focus()
}

async function useTyped() {
  const name = text.value.trim()
  if (!name) {
    typeError.value = 'Type your name as you sign it.'
    return fail(() => nameInput.value?.inputRef?.focus())
  }
  const family = signatureStyles.find((s) => s.style === style.value)?.family ?? ''
  const image = await renderTypedPng(name, family)
  if (!image) {
    typeError.value = 'Your signature could not be made. Try again.'
    return fail(() => nameInput.value?.inputRef?.focus())
  }
  emit('done', { kind: 'typed', image, text: name, style: style.value })
}

function useDrawn() {
  if (!pad || pad.isEmpty()) {
    drawError.value = 'Draw your signature in the box.'
    return fail(() => canvas.value?.focus())
  }
  // The pad is third-party code: check what it gives back before it leaves this component.
  const image = toSignatureImage(pad.toDataURL('image/png'))
  if (!image) {
    drawError.value = 'Your drawing is too large to save. Clear it and draw again.'
    return fail(() => canvas.value?.focus())
  }
  emit('done', { kind: 'drawn', image })
}

const use = () => (mode.value === 'type' ? useTyped() : useDrawn())
</script>

<template>
  <div>
    <UFieldGroup
      role="group"
      aria-label="How to make your signature"
    >
      <UButton
        color="neutral"
        :variant="mode === 'type' ? 'solid' : 'outline'"
        :aria-pressed="mode === 'type'"
        class="h-11 md:h-9"
        @click="mode = 'type'"
      >
        Type it
      </UButton>
      <UButton
        color="neutral"
        :variant="mode === 'draw' ? 'solid' : 'outline'"
        :aria-pressed="mode === 'draw'"
        class="h-11 md:h-9"
        @click="mode = 'draw'"
      >
        Draw it
      </UButton>
    </UFieldGroup>

    <div
      v-if="mode === 'type'"
      class="mt-4"
    >
      <UFormField
        label="Your name as you sign it"
        :error="typeError"
      >
        <UInput
          ref="nameInput"
          v-model="text"
          :maxlength="maxTextLength"
          size="xl"
          class="w-full max-w-sm"
          :ui="{ base: 'h-11 md:h-9' }"
          @update:model-value="typeError = ''"
        />
      </UFormField>
      <fieldset class="mt-5 max-w-sm min-w-0">
        <legend class="text-sm font-medium">
          Choose a style
        </legend>
        <div class="mt-2 grid grid-cols-1 gap-2">
          <label
            v-for="option in signatureStyles"
            :key="option.style"
            :class="['flex min-h-14 min-w-0 cursor-pointer items-center gap-3 rounded-sm border px-3 py-1', style === option.style ? 'border-ink bg-paper' : 'border-rule hover:border-control-border']"
          >
            <input
              v-model="style"
              type="radio"
              name="signature-style"
              :value="option.style"
              class="size-6 shrink-0 accent-accent"
              :aria-label="option.label"
            >
            <SignatureText
              :text="text"
              :family="option.family"
              class="min-w-0 flex-1"
            />
          </label>
        </div>
      </fieldset>
    </div>

    <div
      v-else
      class="mt-4"
    >
      <p class="text-sm text-ink-muted">
        Sign with your finger or mouse.
      </p>
      <div class="relative mt-2">
        <canvas
          ref="canvas"
          :class="['block h-40 w-full touch-none border bg-sheet', drawError ? 'border-danger' : 'border-control-border']"
          aria-label="Signature drawing area"
          :aria-invalid="drawError ? 'true' : undefined"
          tabindex="-1"
        />
        <span class="pointer-events-none absolute right-3 bottom-8 left-3 border-b border-rule" />
      </div>
      <p
        v-if="drawError"
        class="mt-1 flex items-start gap-2 text-sm text-danger"
      >
        <UIcon
          name="i-lucide-circle-alert"
          class="mt-0.5 size-4 shrink-0"
        /> {{ drawError }}
      </p>
      <UButton
        color="neutral"
        variant="link"
        class="-ml-2.5 h-11"
        :disabled="!drawn"
        @click="clear"
      >
        Clear drawing
      </UButton>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <UButton
        color="neutral"
        variant="outline"
        size="xl"
        class="h-11 justify-center md:h-9"
        @click="use"
      >
        {{ actionLabel ?? 'Use this signature' }}
      </UButton>
      <UButton
        v-if="cancellable"
        color="neutral"
        variant="ghost"
        size="xl"
        class="h-11 justify-center md:h-9"
        @click="emit('cancel')"
      >
        Cancel
      </UButton>
    </div>
  </div>
</template>
