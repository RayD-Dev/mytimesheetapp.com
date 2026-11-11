import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import { describe, expect, it } from 'vitest'
import TimeInput from './TimeInput.vue'

function mountInput(modelValue: string | null, slots = {}) {
  return mount(TimeInput, {
    props: { modelValue, label: 'Start time' },
    slots,
    global: { plugins: [ui] },
    attachTo: document.body,
  })
}

function segment(name: 'hour' | 'minute' | 'AM/PM'): HTMLElement {
  const el = document.body.querySelector<HTMLElement>(`[role="spinbutton"][aria-label="${name}"]`)
  if (!el) throw new Error(`no ${name} segment`)
  return el
}

async function type(el: HTMLElement, keys: string[]) {
  for (const key of keys) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    await new Promise((r) => setTimeout(r))
  }
}

describe('TimeInput', () => {
  it('shows 07:30 as 7:30 AM and 19:05 as 7:05 PM', () => {
    const first = mountInput('07:30')
    expect(segment('hour').textContent?.trim()).toBe('7')
    expect(segment('minute').textContent?.trim()).toBe('30')
    expect(segment('AM/PM').textContent?.trim()).toBe('AM')
    first.unmount()
    const second = mountInput('19:05')
    expect(segment('AM/PM').textContent?.trim()).toBe('PM')
    second.unmount()
  })

  it('shows 00:00 as 12 AM and 12:00 as 12 PM', () => {
    const midnight = mountInput('00:00')
    expect(segment('hour').textContent?.trim()).toBe('12')
    expect(segment('AM/PM').textContent?.trim()).toBe('AM')
    midnight.unmount()
    const noon = mountInput('12:00')
    expect(segment('hour').textContent?.trim()).toBe('12')
    expect(segment('AM/PM').textContent?.trim()).toBe('PM')
    noon.unmount()
  })

  it('sets 7:30 PM when the employee types 7, 30 and p (AC-28)', async () => {
    const wrapper = mountInput(null)
    await type(segment('hour'), ['7'])
    await type(segment('minute'), ['3', '0'])
    await type(segment('AM/PM'), ['p'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['19:30'])
    wrapper.unmount()
  })

  it('sets 7:30 AM when the employee types a', async () => {
    const wrapper = mountInput(null)
    await type(segment('hour'), ['7'])
    await type(segment('minute'), ['3', '0'])
    await type(segment('AM/PM'), ['a'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['07:30'])
    wrapper.unmount()
  })

  it('names the field by its label and shows the error', () => {
    const wrapper = mountInput('07:30', { error: 'Add a finish time' })
    const group = document.body.querySelector('[role="group"]')
    expect(group?.getAttribute('aria-labelledby')).toBe(wrapper.find('span').attributes('id'))
    expect(wrapper.text()).toContain('Start time')
    expect(group?.getAttribute('aria-invalid')).toBe('true')
    const errorId = group?.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(errorId)?.textContent).toContain('Add a finish time')
    wrapper.unmount()
  })
})
