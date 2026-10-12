<script lang="ts">
export const title = 'Profile'
export const order = 3
export const states = {
  signed: 'Has a typed signature',
  drawn: 'Has a drawn signature',
  'no-signature': 'No signature yet',
  replacing: 'Replacing the signature',
  'password-changed': 'Back from the sign-in page after changing password',
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMock } from '@/mock'
import { me } from '@/fixtures'
import TopBar from '@/parts/TopBar.vue'
import SignatureSetup from '@/parts/SignatureSetup.vue'
import SignatureText from '@/parts/SignatureText.vue'
import { familyOf, type Signature } from '@/signature'

const { state } = useMock(states)
const s = computed(() => String(state.value))
const toast = useToast()


// A hand-drawn sample for the "drawn" state
const sample = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" fill="none" stroke="#1B2330" stroke-width="2.5" stroke-linecap="round"><path d="M14 58c10-30 16-44 22-40s-8 38-4 40 18-30 26-28-4 26 2 26 10-14 16-14-2 14 6 14 14-22 22-20-6 22 2 22c10 0 18-26 30-26s-8 30 4 30 20-34 34-34-10 34 4 34c10 0 16-20 28-22s-4 20 8 20 30-12 60-16"/></svg>')}`

const signature = ref<Signature | null>(null)
const replacing = ref(false)
const savedOn = ref('02/10/2026')
watch(s, (st) => {
  signature.value = st === 'no-signature' ? null : st === 'drawn' ? { kind: 'drawn', url: sample } : { kind: 'typed', text: me.name, style: 'aurore' }
  replacing.value = st === 'replacing'
}, { immediate: true })

function save(sig: Signature) {
  const first = !signature.value
  signature.value = sig
  replacing.value = false
  savedOn.value = '16/10/2026'
  toast.add({ title: first ? 'Signature saved' : 'Signature replaced', icon: 'i-lucide-circle-check', color: 'success' })
}
onMounted(() => {
  if (s.value === 'password-changed') toast.add({ title: 'Password changed', description: 'Use your new password next time you sign in.', icon: 'i-lucide-circle-check', color: 'success' })
})
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <TopBar current="profile" />

    <main class="mx-auto max-w-3xl md:px-4 md:py-8">
      <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
        <h1 class="text-2xl font-semibold">Profile</h1>
        <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt class="text-ink-muted">Name</dt>
          <dd>{{ me.name }}</dd>
        </dl>
        <p class="mt-1 text-sm text-ink-muted">Your name comes from your sign-in account. Ask your manager if it's wrong.</p>

        <section class="mt-10 border-t border-ink pt-4">
          <h2 class="text-xl font-semibold">Signature</h2>
          <p class="mt-1 max-w-prose text-ink-muted">Added to each timesheet you submit, as on the paper sheet.</p>

          <template v-if="signature && !replacing">
            <SignatureText v-if="signature.kind === 'typed'" :text="signature.text" :family="familyOf(signature.style)" class="mt-4" />
            <img v-else :src="signature.url" alt="Your signature" class="mt-4 h-20 w-full max-w-sm border-b border-ink object-contain object-left" />
            <p class="mt-1 text-sm text-ink-muted">Saved <span class="font-mono tabular-nums">{{ savedOn }}</span></p>
            <UButton color="neutral" variant="outline" size="xl" class="mt-4 h-11 justify-center md:h-9" @click="replacing = true">Replace signature</UButton>
            <p class="mt-3 max-w-prose text-sm text-ink-muted">Timesheets you've already submitted keep the signature they were signed with.</p>
          </template>

          <template v-else>
            <p v-if="!signature" class="mt-4 flex items-center gap-2">
              <UIcon name="i-lucide-info" class="size-5 shrink-0 text-info" /> You don't have a signature yet. You'll need one before your first submit.
            </p>
            <SignatureSetup
              :name="me.name"
              :action-label="signature ? 'Save new signature' : 'Save signature'"
              :cancellable="!!signature"
              :initial-style="signature?.kind === 'typed' ? signature.style : undefined"
              class="mt-4"
              @done="save"
              @cancel="replacing = false"
            />
          </template>
        </section>

        <section class="mt-10 border-t border-ink pt-4">
          <h2 class="text-xl font-semibold">Password</h2>
          <p class="mt-1 max-w-prose text-ink-muted">You'll change it on the sign-in page, then come back here.</p>
          <UButton color="neutral" variant="outline" size="xl" class="mt-4 h-11 justify-center md:h-9" trailing-icon="i-lucide-arrow-up-right">Change password</UButton>
        </section>
      </article>
    </main>
  </div>
</template>
