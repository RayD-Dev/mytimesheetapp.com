import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { PageFailed, PageLoading } from '.'

const router = createRouter({ history: createMemoryHistory(), routes: [] })
const global = { plugins: [router, ui] }

describe('PageLoading', () => {
  // Fake timers let the tests move the clock by 299 or 300 ms at once, instead of really waiting.
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  // The title shows at once. The placeholder lines wait 300 ms, so a load that finishes quickly never flashes them.
  it('shows the title at once and no placeholders before 300 ms', async () => {
    const wrapper = mount(PageLoading, { props: { title: 'Approvals', what: 'approvals' }, global })
    await vi.advanceTimersByTimeAsync(299)
    expect(wrapper.find('h1').text()).toBe('Approvals')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('adds the placeholders and the loading line after 300 ms', async () => {
    const wrapper = mount(PageLoading, { props: { title: 'Approvals', what: 'approvals' }, global })
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('h1').text()).toBe('Approvals')
    expect(wrapper.find('[role="status"]').text()).toContain('Loading approvals…')
  })
})

describe('PageFailed', () => {
  it("says what couldn't load", () => {
    const wrapper = mount(PageFailed, { props: { title: 'Approvals', what: 'approvals' }, global })
    expect(wrapper.find('[role="alert"]').text()).toContain("Couldn't load approvals")
  })

  // The page that renders PageFailed owns the retry, so this component only has to ask for it.
  it('asks the page to load again when Try again is pressed', async () => {
    const wrapper = mount(PageFailed, { props: { title: 'Approvals', what: 'approvals' }, global })
    await wrapper.findAll('button').find((button) => button.text() === 'Try again')?.trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
