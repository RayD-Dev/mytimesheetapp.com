<script setup lang="ts">
// Top bar (DESIGN.md §5). Employees: My timesheet, Profile, Sign out.
// Managers also get Approvals and Admin; on phones those five don't fit, so they collapse into a Menu.
import { computed } from 'vue'

type Key = 'timesheet' | 'profile' | 'approvals' | 'admin'
const props = defineProps<{ current?: Key; manager?: boolean }>() // no current on not-found and no-access (R7-3, R7-4)
const links = [
  { key: 'timesheet', label: 'My timesheet', to: '/timesheet' },
  { key: 'approvals', label: 'Approvals', to: '/approvals', manager: true },
  { key: 'admin', label: 'Admin', to: '/admin', manager: true },
  { key: 'profile', label: 'Profile', to: '/profile' },
] as const
const visible = computed(() => links.filter((l) => !('manager' in l) || props.manager))
const currentLabel = computed(() => links.find((l) => l.key === props.current)?.label)
const menu = computed(() => [
  visible.value.map((l) => ({ label: l.label, to: l.to, active: l.key === props.current })),
  [{ label: 'Sign out', icon: 'i-lucide-log-out' }],
])
</script>

<template>
  <header class="border-b border-rule bg-sheet">
    <nav class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
      <a
        v-for="l in visible"
        :key="l.key"
        :href="`#${l.to}`"
        :aria-current="current === l.key ? 'page' : undefined"
        :class="[
          'h-11 shrink-0 items-center',
          manager ? 'hidden md:flex' : 'flex',
          current === l.key ? 'border-b-2 border-accent font-semibold' : 'text-ink-muted hover:text-ink',
        ]"
      >{{ l.label }}</a>
      <span v-if="manager" class="flex h-11 items-center border-b-2 border-accent font-semibold md:hidden">{{ currentLabel }}</span>
      <a href="#" :class="['ml-auto h-11 shrink-0 items-center text-ink-muted hover:text-ink', manager ? 'hidden md:flex' : 'flex']">Sign out</a>
      <UDropdownMenu v-if="manager" :items="menu" :content="{ align: 'end' }" class="ml-auto md:hidden">
        <UButton color="neutral" variant="outline" icon="i-lucide-menu" size="xl" class="h-11">Menu</UButton>
      </UDropdownMenu>
    </nav>
  </header>
</template>
