// Mock-up plumbing. src/pages mirrors the site's routes: folders are URL segments, index.vue is the
// folder's own page, and [name] is a URL parameter (pages/approvals/[fortnight]/[timesheet].vue →
// /approvals/:fortnight/:timesheet). Each page reads ?state= and ?v= from the URL. Not production code.
import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'

type PageModule = {
  default: Component
  title?: string
  order?: number
  example?: string                  // a concrete URL for pages with parameters, e.g. '/approvals/2026-10-05/priya'
  states?: Record<string, string>   // state key → what it shows, e.g. { draft: 'Draft, 3 days, one warning' }
  variants?: Record<string, string> // variant key → what differs, e.g. { a: 'Totals in a footer row' }
}

const modules = import.meta.glob<PageModule>('./pages/**/*.vue', { eager: true })

export const screens = Object.entries(modules)
  .map(([file, mod]) => {
    const path = file.replace(/^\.\/pages/, '').replace(/\.vue$/, '').replace(/\/index$/, '').replace(/\[(\w+)\]/g, ':$1') || '/'
    return {
      path,                                                     // route pattern
      href: mod.example ?? path,                                // a URL you can open
      key: path.split('/').filter(Boolean).map((p) => p.replace(/^:/, '')).join('-') || 'home', // board filter
      title: mod.title ?? path,
      order: mod.order ?? 99,
      component: mod.default,
      states: mod.states ?? { default: '' },
      variants: mod.variants ?? {},
    }
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

/** Current state and variant for a page, from the URL. The first state is the default. */
export function useMock<S extends Record<string, string>>(states: S) {
  const route = useRoute()
  const state = computed(() => (route.query.state as keyof S | undefined) ?? (Object.keys(states)[0] as keyof S))
  const v = computed(() => (route.query.v as string | undefined) ?? 'a')
  return { state, v }
}
