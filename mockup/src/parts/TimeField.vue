<script setup lang="ts">
// Time entry (decided R1-2): Nuxt UI's segmented 12-hour field, enlarged to 44px segments on phones
import { Time } from '@internationalized/date'

defineProps<{ modelValue?: number; label: string; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [minutes: number | undefined] }>()
const asTime = (m?: number) => (m == null ? undefined : new Time(Math.floor(m / 60), m % 60))
</script>

<template>
  <UInputTime
    :model-value="asTime(modelValue)"
    :hour-cycle="12"
    size="xl"
    :aria-label="label"
    :color="invalid ? 'error' : undefined"
    :highlight="invalid"
    :aria-invalid="invalid ? 'true' : undefined"
    :ui="{ base: 'h-12 py-0 md:h-9', segment: 'h-11 leading-[2.75rem] not-data-[segment=literal]:w-11 md:h-7 md:leading-7 md:not-data-[segment=literal]:w-10' }"
    @update:model-value="(t) => emit('update:modelValue', t ? t.hour * 60 + t.minute : undefined)"
  />
</template>
