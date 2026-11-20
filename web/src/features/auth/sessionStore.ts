import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Role = 'employee' | 'manager'

// The signed-in person from GET /me. Task 6 loads it once at start-up and swaps this type for the generated one.
export const useSessionStore = defineStore('session', () => {
  const me = ref<{ roles: Role[] } | null>(null)
  return { me }
})
