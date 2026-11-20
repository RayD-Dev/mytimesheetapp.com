import { onScopeDispose, ref, type Ref } from 'vue'

/** Turns true once `ms` have passed since the caller was set up, so fast loads never flash a placeholder. */
export function useAfterDelay(ms: number): Ref<boolean> {
  const elapsed = ref(false)
  const timer = setTimeout(() => {
    elapsed.value = true
  }, ms)
  onScopeDispose(() => clearTimeout(timer))
  return elapsed
}
