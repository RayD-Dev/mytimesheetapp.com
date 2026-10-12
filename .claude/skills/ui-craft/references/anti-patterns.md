# Anti-patterns: the tells of default, generated UI

Each entry gives what it looks like, why it reads as "nobody decided", and what to do instead. Entries with a `rule-id` are detected by ui-audit's scanner (`slop-scan.mjs`). The rest need eyes on the rendered screen.

An entry is a smell, not a law. If one is right for this product, keep it and record why: in DESIGN.md for a system-wide choice, or with a `slop-ignore` comment for a single line.

## Typography

| Tell | rule-id | Why it reads as default | Instead |
|---|---|---|---|
| Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Poppins, Montserrat or a bare system stack as the main font | `font-generic` | It's the first font every generator reaches for | A family chosen for the subject (see directions.md), self-hosted |
| Space Grotesk, Poppins, Montserrat or DM Sans as the "distinctive" choice | `font-overused` | They became the second-order default | Pick from the subject's vernacular, then check the font isn't the starter-template one |
| Gradient text | `gradient-text` | Decoration standing in for hierarchy | Weight and size; colour only if it means something |
| ALL-CAPS letter-spaced labels above every section | `eyebrow-caps` | The landing-page "eyebrow" pattern | A clear heading; uppercase only where it's the domain's own convention |
| One word in a heading highlighted in the accent colour | judgment | A template headline trick | Let the sentence carry the emphasis |
| Text under 12px | `tiny-text` | Crams in content instead of editing it | Cut or restructure; 14px minimum for secondary text, 16px for inputs on phones |
| Times and totals in proportional figures | judgment | Columns of numbers wobble and are hard to compare | `font-mono` or `tabular-nums`, right-aligned |

## Colour

| Tell | rule-id | Why | Instead |
|---|---|---|---|
| Purple, violet or indigo gradients | `ai-gradient` | The single most recognisable AI-default look | A flat surface from the palette; depth from a border or surface step |
| Indigo or violet as the accent (Tailwind indigo-500 or violet-500) | `ai-purple` | The default "brand" colour of generated apps | An accent drawn from the subject (ink blue, guide-sign green, stamp-pad blue…) |
| Decorative gradient washes behind content | `decorative-gradient` | Atmosphere with no information | Solid surfaces; save gradients for things that show a real continuum |
| Pure black text or pure grey neutrals | `pure-black` | Untuned; looks harsh against tinted surfaces | Tinted neutrals from the palette |
| Raw hex, rgb or hsl values in components | `raw-color` | Design-system drift: every screen ends up slightly different | Tokens; add one if it's missing |
| Coloured glow shadows | `glow` | The "dark mode SaaS" cliché | No glow; use contrast and borders |
| Grey text on a coloured background | judgment | Low contrast and muddy | Text colour from that surface's own role |
| Warm cream with terracotta; near-black with a neon accent | judgment | Stock generated palettes | Palette from the brief, contrast-checked |
| Colour as the only signal (a red border alone) | judgment | Fails colour-blind users and greyscale printouts | Colour, an icon and words together |

## Layout and surfaces

| Tell | rule-id | Why | Instead |
|---|---|---|---|
| Cards inside cards | `nested-cards` | Boxes standing in for hierarchy | One level of container; group with space and rules |
| Grids of identical rounded cards with soft shadows | `heavy-shadow`, `pillowy-radius` | The bento or feature-grid default | Structure that mirrors the content: tables for tabular data, lists for lists |
| Glassmorphism (backdrop blur panels) | `glassmorphism` | Trend residue; hurts legibility and performance | Opaque surfaces |
| A thick coloured stripe on one side of a card | `side-stripe` | The "alert card" template | A status chip with icon and text, or a full-row tint for row-level warnings |
| Cards lifting on hover | `hover-lift` | Motion with no meaning; doesn't exist on phones | Hover only where something is clickable, as a subtle colour change |
| `!important` in component styles | `important` | Fighting the component library instead of theming it | The library's theme config or `ui` prop |
| Centred everything, including forms and tables | judgment | Landing-page habit | Left-aligned text, right-aligned numbers |
| A rounded-square icon tile above every heading | judgment | Feature-grid template | Icons only where they help recognition, inline with text |
| Hero sections, stat banners or "welcome back" panels in a tool | judgment | Marketing register in a product UI | Put the user's actual work first |

## Motion

| Tell | rule-id | Why | Instead |
|---|---|---|---|
| `transition: all` | `transition-all` | Animates things you didn't intend (layout, colour flashes) and costs performance | List the properties: `transform`, `opacity`, `background-color` |
| Bounce or elastic easing; overshooting cubic-beziers | `bounce-easing` | Toy-like; slows down repeated work | Strong ease-out (see ui-motion) |
| `ease-in` on UI entrances | `ease-in` | Feels sluggish at the moment the user is waiting | Ease-out for entering; ease-in-out for moving |
| Animating width, height, top, left or margin | `layout-animation` | Janky on phones | `transform` and `opacity`; a grid-rows trick for expand and collapse |
| UI transitions over ~400ms | `slow-motion` | The interface feels like it's in the way | 120–250ms; up to 400ms only for large drawers |
| Animations with no reduced-motion handling | `no-reduced-motion` | Vestibular discomfort for some users | A `prefers-reduced-motion` block (see ui-motion) |
| Fade-up on every section; tweening count-ups on numbers | judgment | Default "make it pop" motion; animated numbers can't be read mid-tween | Motion only where it explains a change |

## Accessibility floor

| Tell | rule-id | Why | Instead |
|---|---|---|---|
| `outline: none` with no focus-visible replacement | `outline-none` | Keyboard users lose their place | A `:focus-visible` ring using the focus token |
| Clickable `div`s and `span`s | `div-button` | Not focusable or announced as a control | `<button>` or `<a>`, or the library component |
| Images without `alt` | `img-alt` | Screen readers read the filename | Meaningful `alt`, or `alt=""` for decoration |
| `user-scalable=no` or `maximum-scale=1` in the viewport tag | `zoom-disabled` | Blocks pinch-zoom, which locks out people who need larger text | Remove it; stop iOS zooming into inputs by making them at least 16px |
| Inputs under 16px on phones | (ui-visual-check) | iOS zooms the whole page on focus | `text-base` on inputs |
| Tap targets under 24px (44px recommended) | (ui-visual-check) | Missed taps, wrong rows | Bigger hit areas; padding, not bigger icons |
| Sideways scrolling at 375px | (ui-visual-check) | Breaks the PRD's phone promise | Stack, wrap or restructure at narrow widths |

## Copy

| Tell | rule-id | Why | Instead |
|---|---|---|---|
| "Oops", "Whoops", "Something went wrong" | `slop-copy` | Apologises without explaining | Say what happened and what to do |
| "Unlock", "Seamless", "Supercharge", "Elevate", "Effortless" | `slop-copy` | Marketing voice inside a tool | Plain verbs about the user's task |
| "Lorem ipsum" or placeholder names | `slop-copy` | Unfinished, and hides layout problems real data would reveal | Realistic data, including long names and big totals (76h 30m) |
| Generic "Submit" or "Click here" | `generic-cta` | Doesn't say what happens | Name the outcome. This project has agreed exceptions in `.slopscan.json` (e.g. Submit, which is the PRD's term) |
| Emoji in UI text; exclamation marks | `emoji-ui`, `exclaim` | Forced cheer | Calm, specific statements |
| Em dashes or en dashes in UI copy | `em-dash` | The most recognisable AI-writing tell; the project bans them | A full stop, comma, colon or brackets. Ranges use "to" (06/10/2026 to 17/10/2026) |
| Metadata strips chained with middle dots (`a · b · c`) | `middot-chain` | A templated look. One separator on a line is fine | Separate lines, or words ("3 to approve, 1 approved, 1 rejected") |
| `...` (three full stops) in UI text | `three-dots` | A typewriter stand-in for the ellipsis character. Spread syntax in code is not flagged | The ellipsis character: "Saving…" |
| The same action with different names on different screens | judgment | Users wonder whether they're different actions | DESIGN.md's vocabulary |
