<script lang="ts">
// R7-1: Keycloak's pages, themed in Ledger so signing in looks like the rest of the app
// (conversation 13/10/2026: "the idea is for a consistent & coherent ui"). In the real app these are a
// Keycloak login theme, not app routes; the app never handles passwords (FR-01).
export const title = 'Sign in (Keycloak)'
export const order = 8
export const states = {
  'sign-in': 'Sign in',
  'wrong-password': 'Email and password do not match',
  'signed-out': 'After Sign out',
  deactivated: 'R7-5: account deactivated by the manager (FR-25)',
  'first-sign-in': 'Temporary password: choose your own (FR-01)',
  'change-password': 'From Profile: Change password, with Cancel',
  'password-error': "Choose a new password: doesn't meet the rule",
  forgot: 'Forgot password: ask for a reset link',
  'forgot-error': 'Reset: email missing or not an email',
  'reset-sent': 'Reset link sent',
  'link-expired': 'Reset link has expired',
  'no-business-name': 'R7-8: first run, before the manager sets the business name',
  logo: 'R8: with a logo, beside the name',
  worst: 'Very long business name and email address, with an error',
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMock } from '@/mock'
import { business, logos } from '@/fixtures'

const { state } = useMock(states)
const s = computed(() => String(state.value))
const email = ref('')
const password = ref('')
const newPw = ref('')
const newPw2 = ref('')
// Field errors: a message, or true for "red, no message" (the alert box says it)
const errs = ref<Record<string, string | boolean>>({})
function firstInvalid() { nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()) }
watch(s, (v) => {
  email.value = v === 'worst' ? 'alexandra.featherstonehaugh-montgomery@cleaning-services-example.com.au'
    : ['wrong-password', 'reset-sent'].includes(v) ? 'priya.rk@example.com' : ''
  password.value = ''
  newPw.value = v === 'password-error' ? 'abc' : ''
  newPw2.value = v === 'password-error' ? 'abd' : ''
  errs.value = v === 'wrong-password' || v === 'worst' ? { email: true, password: true }
    : v === 'password-error' ? { newPw: 'Use at least 8 characters, with letters and numbers.', newPw2: "The two passwords don't match." }
    : v === 'forgot-error' ? { email: 'Enter your email address, like name@example.com.' }
    : {}
}, { immediate: true })
const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e)
function signIn() {
  errs.value = {
    ...(!email.value ? { email: 'Enter your email address.' } : !emailOk(email.value) ? { email: 'Enter an email address, like name@example.com.' } : {}),
    ...(!password.value ? { password: 'Enter your password.' } : {}),
  }
  firstInvalid()
}
function savePassword() {
  errs.value = {
    ...(!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPw.value) ? { newPw: 'Use at least 8 characters, with letters and numbers.' } : {}),
    ...(newPw2.value !== newPw.value ? { newPw2: "The two passwords don't match." } : {}),
  }
  firstInvalid()
}
function sendReset() {
  errs.value = emailOk(email.value) ? {} : { email: 'Enter your email address, like name@example.com.' }
  firstInvalid()
}
const show = ref(false)
const logo = computed(() => (s.value === 'worst' ? logos.wide : s.value === 'logo' ? logos.badge : ''))
const businessName = computed(() => (s.value === 'no-business-name' ? '' : s.value === 'worst' ? business.long : business.name))
const choosing = computed(() => ['first-sign-in', 'change-password', 'password-error'].includes(s.value))
const field = { base: 'h-11 md:h-9' }
</script>

<template>
  <div class="min-h-screen bg-paper px-4 py-8 text-ink md:py-16">
    <main class="mx-auto max-w-sm">
      <!-- The business's name (set on Admin, R7-8) sits above the sheet, like the heading on the paper timesheet -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b-4 border-double border-ink pb-1">
        <!-- R8: optional logo beside the name (decided), kept to 48px high and 240px wide; the name wraps underneath when a wide logo leaves it less than 160px -->
        <img v-if="logo" :src="logo" alt="" class="h-12 max-w-60 shrink-0 object-contain object-left" />
        <div class="min-w-40 flex-1">
          <p v-if="businessName" class="text-xl font-semibold text-balance">{{ businessName }}</p>
          <p :class="businessName ? 'text-sm text-ink-muted' : 'text-xl font-semibold'">Timesheets</p>
        </div>
      </div>

      <article class="mt-6 border border-rule bg-sheet px-4 pt-6 pb-8 md:px-8">
        <!-- Sign in and its variants -->
        <template v-if="['sign-in', 'wrong-password', 'signed-out', 'deactivated', 'no-business-name', 'logo', 'worst'].includes(s)">
          <h1 class="text-2xl font-semibold">Sign in</h1>

          <p v-if="s === 'signed-out'" class="mt-4 flex items-center gap-2" role="status">
            <UIcon name="i-lucide-circle-check" class="size-5 shrink-0 text-approved" /> You've signed out.
          </p>
          <section v-if="s === 'wrong-password' || s === 'worst'" class="mt-4 rounded-sm border border-danger/40 bg-danger/5 p-3" role="alert">
            <p class="flex items-start gap-2 text-sm"><UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0 text-danger" /> That email and password don't match. Try again, or reset your password.</p>
          </section>
          <section v-if="s === 'deactivated'" class="mt-4 rounded-sm border border-danger/40 bg-danger/5 p-3" role="alert">
            <h2 class="flex items-center gap-2 font-semibold text-danger"><UIcon name="i-lucide-user-x" class="size-5 shrink-0" /> This account has been deactivated</h2>
            <p class="mt-1 text-sm">You can't sign in any more. If you think that's a mistake, ask your manager.</p>
          </section>

          <form class="mt-6 space-y-4" novalidate @submit.prevent="signIn">
            <UFormField label="Email" :error="errs.email">
              <UInput v-model="email" type="email" autocomplete="username" size="xl" class="w-full" :ui="field" />
            </UFormField>
            <UFormField label="Password" :error="errs.password">
              <UInput v-model="password" :type="show ? 'text' : 'password'" autocomplete="current-password" size="xl" class="w-full" :ui="{ ...field, trailing: 'pe-1' }">
                <template #trailing>
                  <UButton color="neutral" variant="link" size="xl" :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'" :aria-label="show ? 'Hide password' : 'Show password'" class="size-11 justify-center md:size-9" @click="show = !show" />
                </template>
              </UInput>
            </UFormField>
            <UButton type="submit" size="xl" block class="h-11 md:h-9">Sign in</UButton>
          </form>
          <UButton variant="link" class="-ml-2.5 mt-4 h-11" to="/sign-in?state=forgot">Forgot your password?</UButton>
        </template>

        <!-- Choose a new password: first sign-in with a temporary password, or Change password from Profile -->
        <template v-else-if="choosing">
          <h1 class="text-2xl font-semibold">Choose a new password</h1>
          <p class="mt-2 text-ink-muted">
            {{ s !== 'change-password' ? 'You signed in with a temporary password. Choose your own to carry on.' : "You'll go back to your profile afterwards." }}
          </p>
          <form class="mt-6 space-y-4" novalidate @submit.prevent="savePassword">
            <UFormField label="New password" :error="errs.newPw" :help="errs.newPw ? undefined : 'At least 8 characters, with letters and numbers.'">
              <UInput v-model="newPw" type="password" autocomplete="new-password" size="xl" class="w-full" :ui="field" />
            </UFormField>
            <UFormField label="Type it again" :error="errs.newPw2">
              <UInput v-model="newPw2" type="password" autocomplete="new-password" size="xl" class="w-full" :ui="field" />
            </UFormField>
            <div class="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
              <UButton v-if="s === 'change-password'" color="neutral" variant="outline" size="xl" class="h-11 justify-center md:h-9" to="/profile">Cancel</UButton>
              <UButton type="submit" size="xl" class="h-11 justify-center md:h-9 md:px-6">Save password</UButton>
            </div>
          </form>
        </template>

        <!-- Password reset by email (FR-01, Keycloak's own emails) -->
        <template v-else-if="s === 'forgot' || s === 'forgot-error'">
          <h1 class="text-2xl font-semibold">Reset your password</h1>
          <p class="mt-2 text-ink-muted">Enter your email and we'll send you a link to choose a new password.</p>
          <form class="mt-6 space-y-4" novalidate @submit.prevent="sendReset">
            <UFormField label="Email" :error="errs.email">
              <UInput v-model="email" type="email" autocomplete="username" size="xl" class="w-full" :ui="field" />
            </UFormField>
            <UButton type="submit" size="xl" block class="h-11 md:h-9">Email me a reset link</UButton>
          </form>
          <UButton variant="link" icon="i-lucide-arrow-left" class="-ml-2.5 mt-4 h-11" to="/sign-in">Back to sign in</UButton>
        </template>

        <template v-else-if="s === 'reset-sent'">
          <h1 class="text-2xl font-semibold">Check your email</h1>
          <p class="mt-2">If <span class="break-all font-semibold">{{ email }}</span> has an account, we've sent it a link to choose a new password.</p>
          <p class="mt-2 text-ink-muted">The link only works for a short time. Nothing there? Check your junk folder, or ask your manager to reset your password.</p>
          <UButton variant="link" icon="i-lucide-arrow-left" class="-ml-2.5 mt-4 h-11" to="/sign-in">Back to sign in</UButton>
        </template>

        <template v-else-if="s === 'link-expired'">
          <h1 class="text-2xl font-semibold">This link has expired</h1>
          <p class="mt-2 text-ink-muted">Reset links only work for a short time. Ask for a new one and use it straight away.</p>
          <UButton size="xl" block class="mt-6 h-11 md:h-9" to="/sign-in?state=forgot">Get a new link</UButton>
        </template>
      </article>
    </main>
  </div>
</template>
