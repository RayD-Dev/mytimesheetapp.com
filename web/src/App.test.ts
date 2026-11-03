import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import { expect, it } from 'vitest'
import App from './App.vue'

it('mounts the root component', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [] })
  await router.push('/')
  const wrapper = mount(App, { global: { plugins: [router, ui] } })
  expect(wrapper.exists()).toBe(true)
})
