# Motion recipes: Vue 3, Nuxt UI, Tailwind v4

Copy what you need and keep the names consistent across the app.

## Contents
1. Motion tokens and reduced motion
2. Popover and menu
3. Dialog
4. Phone sheet (full-screen step)
5. Value-change highlight
6. Save status
7. Expand and collapse
8. Press feedback and hover
9. Status settle (the one considered moment)
10. Aligning Nuxt UI's own transitions

## 1. Motion tokens and reduced motion

Put these in the token file next to the colour tokens. Distances live in variables, so reduced motion sets them to zero in one place and keeps the opacity changes. No `!important` and no global animation kill switch.

```css
@theme static {
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);     /* Tailwind utility: ease-out-strong */
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

:root {
  --duration-instant: 0ms;
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
  --duration-sheet: 360ms;

  --motion-rise: 4px;          /* small vertical offset for things appearing */
  --motion-scale-from: 0.96;   /* start scale for popovers and dialogs */
  --motion-sheet: 100%;        /* how far a sheet travels */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-rise: 0px;
    --motion-scale-from: 1;
    --motion-sheet: 0%;
  }
}
```

## 2. Popover and menu

```css
.pop-enter-active {
  transition: opacity var(--duration-base) var(--ease-out-strong),
              transform var(--duration-base) var(--ease-out-strong);
}
.pop-leave-active {
  transition: opacity calc(var(--duration-base) * 0.75) var(--ease-out-strong),
              transform calc(var(--duration-base) * 0.75) var(--ease-out-strong);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(var(--motion-scale-from));
}
```

Set `transform-origin` to the trigger side. Reka UI popper content exposes a CSS variable for this, e.g. `transform-origin: var(--reka-popover-content-transform-origin)`. Check the exact name for the component you're using.

## 3. Dialog

The overlay fades and the panel scales from the centre.

```css
.dialog-enter-active, .dialog-leave-active { transition: opacity var(--duration-slow) var(--ease-out-strong); }
.dialog-enter-active .dialog-panel { transition: transform var(--duration-slow) var(--ease-out-strong); }
.dialog-leave-active { transition-duration: calc(var(--duration-slow) * 0.75); }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-panel { transform: scale(var(--motion-scale-from)); }
```

## 4. Phone sheet (submit review as a full-screen step)

```css
.sheet-enter-active { transition: transform var(--duration-sheet) var(--ease-drawer); }
.sheet-leave-active { transition: transform calc(var(--duration-sheet) * 0.75) var(--ease-drawer); }
.sheet-enter-from, .sheet-leave-to { transform: translateX(var(--motion-sheet)); }

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active { transition: opacity var(--duration-base) ease; }
  .sheet-enter-from, .sheet-leave-to { opacity: 0; }
}
```

## 5. Value-change highlight

Use this when the server's calculated hours replace the on-screen preview and differ from it. The value doesn't move; its background briefly tints, then fades.

```ts
// src/composables/useCorrectionHighlight.ts
import { nextTick, ref, watch, type Ref } from 'vue'

/** True briefly when the server's figure arrives and differs from the preview. */
export function useCorrectionHighlight(preview: Ref<number | null>, server: Ref<number | null>) {
  const highlighted = ref(false)
  watch(server, async (value) => {
    if (value === null || value === preview.value) return
    highlighted.value = false
    await nextTick() // let the class come off so the animation can restart
    requestAnimationFrame(() => (highlighted.value = true))
  })
  return { highlighted, clear: () => (highlighted.value = false) }
}
```

```vue
<span :class="{ 'value-corrected': highlighted }" @animationend="clear">
  <Hours :minutes="displayMinutes" />
</span>
```

```css
@keyframes value-corrected {
  from { background-color: color-mix(in oklab, var(--color-accent) 14%, transparent); }
  to   { background-color: transparent; }
}
.value-corrected { animation: value-corrected 700ms var(--ease-out-strong); }
```

## 6. Save status

"Saving…" appears only for slow saves, "Saved" settles quietly, and "Not saved" stays put.

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const props = defineProps<{ state: SaveState }>()

const shown = ref<SaveState>(props.state === 'saving' ? 'idle' : props.state)
let timer: ReturnType<typeof setTimeout> | undefined

watch(() => props.state, (state) => {
  clearTimeout(timer)
  if (state === 'saving') timer = setTimeout(() => (shown.value = 'saving'), 400) // no flicker on fast saves
  else shown.value = state
})
onBeforeUnmount(() => clearTimeout(timer))

const label: Record<SaveState, string> = { idle: '', saving: 'Saving…', saved: 'Saved', error: 'Not saved' }
</script>

<template>
  <p class="save-status" role="status">
    <Transition name="fade" mode="out-in">
      <span :key="shown" :class="`save-status--${shown}`">{{ label[shown] }}</span>
    </Transition>
  </p>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity var(--duration-fast) ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.save-status--saved { color: var(--color-ink-muted); }
.save-status--error { color: var(--color-danger); font-weight: 600; }
</style>
```

## 7. Expand and collapse

Use this for validation messages and the rejection reason: it reveals content without measuring height in JavaScript.

```css
.collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-base) var(--ease-out-strong);
}
.collapse[data-open="true"] { grid-template-rows: 1fr; }
.collapse > .collapse-inner { overflow: hidden; }
```

## 8. Press feedback and hover

Plain CSS:

```css
.press { transition: transform var(--duration-fast) var(--ease-out-strong); }
.press:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .press:active { transform: none; } }

@media (hover: hover) and (pointer: fine) {
  .row:hover { background-color: var(--color-paper); }
}
```

Nuxt UI buttons, globally in `vite.config.ts` under `ui.ui.button.slots.base`:

```ts
'transition-[color,background-color,border-color,transform] duration-120 ease-out-strong active:scale-[0.97] motion-reduce:active:scale-100'
```

The arbitrary `transition-[...]` keeps colour transitions. tailwind-merge would otherwise drop the theme's `transition-colors` in favour of `transition-transform`. In Tailwind v4, the `hover:` variant only applies on devices that can hover, so phones don't get stuck hover states.

## 9. Status settle (the one considered moment)

This plays when a timesheet is sent or approved.

```css
@media (prefers-reduced-motion: no-preference) {
  @keyframes status-settle {
    from { transform: scale(1.02); opacity: 0.6; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .status-settle { animation: status-settle 200ms var(--ease-out-strong); }
}
```

## 10. Aligning Nuxt UI's own transitions

Nuxt UI overlays (Modal, Slideover, Drawer, Popover, DropdownMenu, Tooltip, Toast) animate through `data-[state=open]` and `data-[state=closed]` classes in their theme, typically on the `content` and `overlay` slots. To match the tokens:

1. Open the component's Theme section in the docs, or the generated theme file, and find its `animate-[...]` or `transition` classes.
2. Override them once in `vite.config.ts` → `ui.ui.<component>.slots`, using token durations and `ease-out-strong` or `ease-drawer`.
3. Check the `theme.transitions` option of the Vite plugin, which toggles component transitions globally.

Don't add a Vue `<Transition>` around a Nuxt UI overlay that already animates. Two animations on one element fight each other.
