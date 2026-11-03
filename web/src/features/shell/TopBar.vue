<script setup lang="ts">
// Top bar: employees see My timesheet, Profile, Sign out. Managers also see Approvals and Admin (FR-01), which
// collapse into a Menu on phones. `current` is left out on pages that aren't in the bar (not found, no access).
import { computed } from 'vue'

type PageKey = 'timesheet' | 'profile' | 'approvals' | 'admin'

const props = defineProps<{ current?: PageKey; manager?: boolean }>()
// Signing out is a POST, so it is a button; the session store listens for this.
const emit = defineEmits<{ signOut: [] }>()

const links = [
  { key: 'timesheet', label: 'My timesheet', to: '/timesheet', managerOnly: false },
  { key: 'approvals', label: 'Approvals', to: '/approvals', managerOnly: true },
  { key: 'admin', label: 'Admin', to: '/admin', managerOnly: true },
  { key: 'profile', label: 'Profile', to: '/profile', managerOnly: false },
] as const

const visible = computed(() => links.filter((link) => props.manager || !link.managerOnly))
const currentLabel = computed(() => links.find((link) => link.key === props.current)?.label)
const menuItems = computed(() => [
  visible.value.map((link) => ({ label: link.label, to: link.to })),
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
        v-for="link in visible"
        :key="link.key"
        v-slot="{ href, navigate }"
        :to="link.to"
        custom
      >
        <a
          :href="href"
          :aria-current="current === link.key ? 'page' : undefined"
          :class="[
            'h-11 shrink-0 items-center',
            manager ? 'hidden md:flex' : 'flex',
            current === link.key ? 'border-b-2 border-accent font-semibold' : 'text-ink-muted hover:text-ink',
          ]"
          @click="navigate"
        >{{ link.label }}</a>
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
          class="h-11"
        >
          Menu
        </UButton>
      </UDropdownMenu>
    </nav>
  </header>
</template>
