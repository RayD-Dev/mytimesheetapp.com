<script setup lang="ts">
import { computed, useId } from 'vue'
import { fromTimeValue, toTime } from './time-mapping'

const props = defineProps<{
  /** 24-hour HH:mm as the API sends it, or null when empty. */
  modelValue: string | null
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()
defineSlots<{ error?: () => unknown }>()

const labelId = useId()
const errorId = useId()
const time = computed(() => toTime(props.modelValue))
</script>

<template>
  <div>
    <span
      :id="labelId"
      class="block text-sm font-medium"
    >{{ label }}</span>
    <UInputTime
      role="group"
      :aria-labelledby="labelId"
      :aria-describedby="$slots.error ? errorId : undefined"
      :aria-invalid="$slots.error ? true : undefined"
      :model-value="time"
      :hour-cycle="12"
      granularity="minute"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', fromTimeValue($event))"
    />
    <p
      v-if="$slots.error"
      :id="errorId"
      class="text-sm text-error"
    >
      <slot name="error" />
    </p>
  </div>
</template>
