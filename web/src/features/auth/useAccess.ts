import { computed } from 'vue'
import { useSessionStore } from './sessionStore'

// What to show or hide for this person. The server decides what they may do, so this is never a security check.
export function useAccess() {
  const session = useSessionStore()
  const isManager = computed(() => session.me?.roles.includes('manager') ?? false)
  return { isManager }
}
