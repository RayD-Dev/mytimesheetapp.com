import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import { describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { NoAccessPage, NotFoundPage, TopBar, shellRoutes } from '.'

function globalWithRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes: [...shellRoutes] })
  return { router, global: { plugins: [router, ui] } }
}

function linkNames(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('nav a').map((link) => link.text())
}

describe('TopBar', () => {
  it.each([
    { manager: false, links: ['My timesheet', 'Profile'] },
    { manager: true, links: ['My timesheet', 'Approvals', 'Admin', 'Profile'] },
  ])('shows $links when manager is $manager (FR-01)', ({ manager, links }) => {
    const wrapper = mount(TopBar, { props: { manager }, global: globalWithRouter().global })
    expect(linkNames(wrapper)).toEqual(links)
  })

  it.each([
    { current: 'profile' as const, marked: ['Profile'] },
    { current: undefined, marked: [] as string[] },
  ])('marks $marked as the current page when current is $current', ({ current, marked }) => {
    const wrapper = mount(TopBar, { props: { current }, global: globalWithRouter().global })
    const links = wrapper.findAll('nav a[aria-current="page"]')
    expect(links.map((link) => link.text())).toEqual(marked)
  })

  it('asks to sign out when Sign out is pressed', async () => {
    const wrapper = mount(TopBar, { global: globalWithRouter().global })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('signOut')).toHaveLength(1)
  })
})

describe('Page not found', () => {
  it('offers the way back to My timesheet', () => {
    const wrapper = mount(NotFoundPage, { global: globalWithRouter().global })
    expect(wrapper.find('a').attributes('href')).toBe('/timesheet')
  })

  it('is what an unknown URL resolves to, keeping the URL', async () => {
    const { router } = globalWithRouter()
    await router.push('/no/such/page')
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(NotFoundPage)
    expect(router.currentRoute.value.fullPath).toBe('/no/such/page')
  })
})

describe('No access', () => {
  it('names the signed-in person and offers the way back (FR-01)', () => {
    const wrapper = mount(NoAccessPage, { props: { name: 'Priya Ramaswamy-Kingsley' }, global: globalWithRouter().global })
    expect(wrapper.text()).toContain('Priya Ramaswamy-Kingsley')
    expect(wrapper.find('a').attributes('href')).toBe('/timesheet')
  })
})
