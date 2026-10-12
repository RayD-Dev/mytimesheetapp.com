---
name: ui-motion
description: Purposeful motion and micro-interactions — deciding whether something should animate at all, then choosing duration, easing, origin and reduced-motion behaviour, with Vue Transition and Nuxt UI recipes. Use this whenever you add, change or review any animation, transition, hover or press state, loading or saving indicator, toast, dialog, drawer, popover, expand or collapse, list insert or remove, or value-change highlight — and whenever someone asks to make the UI "feel smoother", "snappier", "more alive" or "more polished", even if they never say "animation".
---

# UI motion

Motion is information about change: where something came from, what just happened, what changed. Default generated motion (fade-up on everything, bouncy springs, hover lifts) carries no information and makes repeated work slower. In a tool people use every fortnight to record what they're owed, motion should make the interface feel *certain* and *quick*, never playful.

The rules here draw on Emil Kowalski's interface animation practice (the `emil-design-eng` skill and animations.dev).

## 1. Decide whether to animate at all

Ask how often the user will see it:

| Frequency | Examples in this app | Motion |
|---|---|---|
| Many times per session | Typing times, tabbing between fields, the hours preview updating, keyboard navigation | **None.** Instant feedback only |
| Several times per session | Hover on rows, opening a time picker, a row warning appearing | Minimal: 120–160ms, opacity or colour |
| Occasionally | Dialogs, the submit review, toasts, switching fortnight | Standard: 180–250ms |
| Rarely, and meaningful | Sending a timesheet, approving and signing | One considered moment is allowed |

Then ask what the animation *explains*. If you can't name the change it clarifies, don't animate. Never animate something the user triggered from the keyboard in a fast loop.

## 2. Tokens

Use these, defined in the token file (see ui-craft `references/tokens.md`) and referenced by name:

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 0ms | Repeated, keyboard-driven feedback |
| `--duration-fast` | 120ms | Press feedback, hover colour, tooltips |
| `--duration-base` | 180ms | Popovers, menus, row-level messages |
| `--duration-slow` | 240ms | Dialogs, toasts, page-level changes |
| `--duration-sheet` | 360ms | Full-screen steps and drawers on phones |
| `--ease-out-strong` | `cubic-bezier(0.23, 1, 0.32, 1)` | Default; anything entering or responding |
| `--ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | Something moving from A to B on screen |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets and drawers (iOS-like) |

Rules of thumb:
- Keep UI animation under 300ms. Only drawers and full-screen steps go higher, up to about 400ms.
- Exits are faster than entrances, about 75% of the duration. The user has already moved on.
- Use ease-out for entering, ease-in-out for moving, and plain `ease` for colour and hover. Never use `ease-in` for UI: it's slowest exactly when the user is watching.
- No bounce or elastic easing, and no spring overshoot. Overshoot reads as playful, and this app should read as precise.

## 3. Mechanics

- **Animate `transform` and `opacity` only.** They run on the compositor and stay smooth on mid-range phones. Never write `transition: all`; list the properties. For expand and collapse, the `grid-template-rows: 0fr → 1fr` technique is an acceptable exception (recipe in references).
- **Start states are subtle:** `scale(0.96)` plus `opacity: 0`, or `translateY(4px)`, never `scale(0)`. Things should look like they were already nearly there.
- **Origins:** popovers and menus grow from their trigger (`transform-origin` on the trigger side). Dialogs scale from the centre. Phone sheets slide from the edge they're attached to.
- **Interruptible:** use CSS transitions, not keyframes, for anything that can toggle quickly, such as hover, open and close, or a save status. Transitions retarget mid-flight; keyframes restart.
- **Press feedback:** buttons get `scale(0.97)` on `:active` over `--duration-fast`. Rows and large surfaces don't scale.
- **Hover only on hover devices:** wrap hover effects in `@media (hover: hover) and (pointer: fine)`. On phones a sticky hover state looks like a bug.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, remove movement (transforms) but keep short opacity and colour changes, so state changes are still perceivable.
- **Stagger** sparingly: 30–50ms between items, at most about 6 items, on first reveal only. In this app, usually not at all.

## 4. Patterns for this app

- **Numbers never tween.** Hours and totals change instantly. A count-up animation makes a figure unreadable while it moves, and these are the figures people check. To show that a value changed, for example when the server's hours replace the preview, briefly tint its background (fade out over about 700ms) without moving it.
- **Autosave status:**
  - Show "Saving…" only if the save takes longer than about 400ms, so fast saves don't flicker.
  - Show "Saved" when it completes, then let it settle to quiet text.
  - "Not saved" appears instantly, stays until resolved, and doesn't fade.
  - No spinners on every keystroke.
- **Row warnings (FR-27)** appear with opacity and a 4px rise over `--duration-base`. Never shake: shaking means error, and these warnings are soft and never block.
- **Validation errors** appear in place without moving the layout. Reserve the space, or reveal with the grid-rows technique.
- **Submit review on phones** is a full-screen step that slides in from the right or bottom with `--ease-drawer` over `--duration-sheet`. The exit is faster.
- **Status changes** (Draft to Submitted, Submitted to Approved) cross-fade the status chip. Sending or approving is the one place a considered moment is allowed: a short settle (`scale(1.02) → 1`, 200ms) of the status mark. Never confetti.
- **Switching fortnight** cross-fades the content (opacity only). Sliding the whole table sideways suggests a carousel and invites swiping.
- **Loading:** prefer keeping the previous content and showing a quiet status over skeleton flashes. If a loader is needed, delay showing it by about 300ms. Once shown, keep it for at least about 400ms so it doesn't blink.

## 5. Implementation

- Vue's `<Transition>` and `<TransitionGroup>` with CSS classes cover everything this app needs. Don't add GSAP or a motion library unless a requirement can't be met with CSS. It costs bundle size on phones and invites decoration.
- Nuxt UI components (Modal, Drawer, Popover, Toast) have their own transitions. Align their duration and easing with the tokens through the component theme (see ui-craft `references/tokens.md` §4), rather than stacking a second animation on top.
- Recipes are in `references/recipes-vue.md`: the motion token CSS, the reduced-motion block, popover and dialog transitions, the phone sheet, the value-change highlight, the save status, expand and collapse, and press feedback.

## 6. Reviewing motion

When asked to review or polish motion, report a table:

| Element | Now | Problem | Change |
|---|---|---|---|
| Save status | Spinner on each keystroke, 300ms fade | Flickers on fast saves; draws the eye while typing | Delay "Saving…" by 400ms; no spinner; "Saved" settles to quiet text |

To inspect timing, slow animations down (DevTools Animations panel, or multiply durations by 5 temporarily). Check touch interactions on a real phone, where hover states and 300ms+ transitions are most noticeable.
