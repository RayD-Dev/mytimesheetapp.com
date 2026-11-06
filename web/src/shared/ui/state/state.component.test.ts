import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, ref } from 'vue'
import { PageFailed, PageLoading, PageSheet } from '.'

const router = createRouter({ history: createMemoryHistory(), routes: [] })
const global = { plugins: [router, ui] }

describe('PageLoading', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows nothing before 300 ms so fast loads do not flash', () => {
    const wrapper = mount(PageLoading, { props: { title: 'Approvals', what: 'approvals' }, global })
    vi.advanceTimersByTime(299)
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.find('h1').exists()).toBe(false)
    })
  })

  it('shows the title and the loading line after 300 ms', async () => {
    const wrapper = mount(PageLoading, { props: { title: 'Approvals', what: 'approvals' }, global })
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('h1').text()).toBe('Approvals')
    expect(wrapper.find('[role="status"]').text()).toContain('Loading approvals…')
  })

})

describe('PageFailed', () => {
  it("says what couldn't load and how to fix it", () => {
    const wrapper = mount(PageFailed, { props: { title: 'Approvals', what: 'approvals' }, global })
    expect(wrapper.find('[role="alert"]').text()).toContain("Couldn't load approvals")
    expect(wrapper.text()).toContain('Check your internet connection, then try again.')
  })

  it('Try again runs the page load again and shows the page once it works', async () => {
    let attempts = 0
    const load = (): Promise<void> => (++attempts < 2 ? Promise.reject(new Error('offline')) : Promise.resolve())
    const Page = defineComponent({
      setup() {
        const failed = ref(false)
        const run = async (): Promise<void> => {
          failed.value = false
          await load().catch(() => (failed.value = true))
        }
        void run()
        return () => (failed.value ? h(PageFailed, { title: 'Approvals', what: 'approvals', onRetry: run }) : h('p', 'Loaded'))
      },
    })
    const wrapper = mount(Page, { global })
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    const tryAgain = wrapper.findAll('button').find((button) => button.text() === 'Try again')
    await tryAgain?.trigger('click')

    await vi.waitFor(() => expect(wrapper.text()).toBe('Loaded'))
    expect(attempts).toBe(2)
  })
})

describe('PageSheet', () => {
  it('is wide unless told it is narrow', () => {
    expect(mount(PageSheet).find('main').classes()).toContain('max-w-5xl')
    expect(mount(PageSheet, { props: { width: 'narrow' } }).find('main').classes()).toContain('max-w-3xl')
  })
})

describe('Large buttons', () => {
  it('are 44px tall on phones and 36px on desktop, from the global theme', () => {
    const wrapper = mount(PageFailed, { props: { title: 'Approvals', what: 'approvals' }, global })
    const button = wrapper.findAll('button').find((b) => b.text() === 'Try again')
    expect(button?.classes()).toEqual(expect.arrayContaining(['h-11', 'md:h-9', 'justify-center']))
  })
})
