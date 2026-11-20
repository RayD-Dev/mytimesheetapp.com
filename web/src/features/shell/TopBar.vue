<script setup lang="ts">
// Top bar: employees see My timesheet, Profile, Sign out. Managers also see Approvals and Admin (FR-03), which
// collapse into a Menu on phones. `current` is left out on pages that aren't in the bar (not found).
import { computed } from 'vue'

type PageKey = 'timesheet' | 'profile' | 'approvals' | 'admin'

const props = defineProps<{ current?: PageKey; manager?: boolean }>()
// Signing out is a POST, so it is a button; the session store listens for this.
const emit = defineEmits<{ signOut: [] }>()

const navItems = [
  { key: 'timesheet', label: 'My timesheet', to: '/timesheet', managerOnly: false },
  { key: 'approvals', label: 'Approvals', to: '/approvals', managerOnly: true },
  { key: 'admin', label: 'Admin', to: '/admin', managerOnly: true },
  { key: 'profile', label: 'Profile', to: '/profile', managerOnly: false },
] as const

const visibleNavItems = computed(() => navItems.filter((item) => props.manager || !item.managerOnly))
const currentLabel = computed(() => navItems.find((item) => item.key === props.current)?.label)
const menuItems = computed(() => [
  visibleNavItems.value.map((item) => ({ label: item.label, to: item.to })),
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => emit('signOut') }],
])
</script>

<template>
  <header class="border-b border-rule bg-sheet">
    <nav
      aria-label="Main"
      class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4"
    >
      <RouterLink
        v-for="item in visibleNavItems"
        :key="item.key"
        v-slot="{ href, navigate }"
        :to="item.to"
        custom
      >
        <a
          :href="href"
          :aria-current="current === item.key ? 'page' : undefined"
          :class="[
            'h-11 shrink-0 items-center',
            manager ? 'hidden md:flex' : 'flex',
            current === item.key ? 'border-b-2 border-accent font-semibold' : 'text-ink-muted hover:text-ink',
          ]"
          @click="navigate"
        >{{ item.label }}</a>
      </RouterLink>
      <span
        v-if="manager && currentLabel"
        class="flex h-11 items-center border-b-2 border-accent font-semibold md:hidden"
      >{{ currentLabel }}</span>
      <button
        type="button"
        :class="['ml-auto h-11 shrink-0 items-center text-ink-muted hover:text-ink', manager ? 'hidden md:flex' : 'flex']"
        @click="emit('signOut')"
      >
        Sign out
      </button>
      <UDropdownMenu
        v-if="manager"
        :items="menuItems"
        :content="{ align: 'end' }"
        class="ml-auto md:hidden"
      >
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-menu"
          size="xl"
        >
          Menu
        </UButton>
      </UDropdownMenu>
    </nav>
  </header>
</template>
