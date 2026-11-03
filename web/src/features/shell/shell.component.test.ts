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
  it('shows the employee links and Sign out', () => {
    const wrapper = mount(TopBar, { global: globalWithRouter().global })
    expect(linkNames(wrapper)).toEqual(['My timesheet', 'Profile'])
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Sign out'])
  })

  it('adds Approvals and Admin for a manager', () => {
    const wrapper = mount(TopBar, { props: { manager: true }, global: globalWithRouter().global })
    expect(linkNames(wrapper)).toEqual(['My timesheet', 'Approvals', 'Admin', 'Profile'])
  })

  it('marks only the current page', () => {
    const wrapper = mount(TopBar, { props: { current: 'profile' }, global: globalWithRouter().global })
    const current = wrapper.findAll('nav a[aria-current="page"]')
    expect(current.map((link) => link.text())).toEqual(['Profile'])
  })

  it('marks no page when there is no current page', () => {
    const wrapper = mount(TopBar, { global: globalWithRouter().global })
    expect(wrapper.find('[aria-current]').exists()).toBe(false)
  })

  it('asks to sign out when Sign out is pressed', async () => {
    const wrapper = mount(TopBar, { global: globalWithRouter().global })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('signOut')).toHaveLength(1)
  })
})

describe('Page not found', () => {
  it('says the link may be old and offers the way back', () => {
    const wrapper = mount(NotFoundPage, { global: globalWithRouter().global })
    expect(wrapper.find('h1').text()).toBe('Page not found')
    expect(wrapper.text()).toContain('Your timesheets are all still there.')
    expect(wrapper.find('a').attributes('href')).toBe('/timesheet')
    expect(wrapper.find('a').text()).toBe('Go to My timesheet')
  })

  it('is what an unknown URL resolves to, keeping the URL', async () => {
    const { router } = globalWithRouter()
    await router.push('/no/such/page')
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(NotFoundPage)
    expect(router.currentRoute.value.fullPath).toBe('/no/such/page')
  })
})

describe('No access', () => {
  it('names the signed-in person and tells them who to ask', () => {
    const wrapper = mount(NoAccessPage, { props: { name: 'Priya Ramaswamy-Kingsley' }, global: globalWithRouter().global })
    expect(wrapper.find('h1').text()).toBe('This page is for managers')
    expect(wrapper.find('p .font-semibold').text()).toBe('Priya Ramaswamy-Kingsley')
    expect(wrapper.text()).toContain("You're signed in as Priya Ramaswamy-Kingsley, and Approvals is only for managers.")
    expect(wrapper.text()).toContain('If you think you should have access, ask your manager.')
    expect(wrapper.find('a').attributes('href')).toBe('/timesheet')
  })
})
