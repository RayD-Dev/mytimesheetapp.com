import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SignatureSetup from './SignatureSetup.vue'

// The stand-in for signature_pad: tests decide what was drawn and what the pad hands back.
const pads = vi.hoisted(() => {
  const state = { list: [] as FakePad[], dataUrl: '' }
  class FakePad {
    empty = true
    handlers: Record<string, () => void> = {}
    options: Record<string, unknown>
    constructor(_canvas: HTMLCanvasElement, options: Record<string, unknown>) {
      this.options = options
      state.list.push(this)
    }
    addEventListener(name: string, handler: () => void) { this.handlers[name] = handler }
    isEmpty() { return this.empty }
    clear() { this.empty = true }
    off() {}
    toDataURL() { return state.dataUrl }
    stroke() {
      this.handlers.beginStroke?.()
      this.empty = false
      this.handlers.endStroke?.()
    }
  }
  return { state, FakePad }
})
vi.mock('signature_pad', () => ({ default: pads.FakePad }))

const state = pads.state
const png = 'iVBORw0KGgoAAAANSUhEUg'
const typedPng = 'iVBORw0KGgoTYPED'
let elementWidth = 400
let wrapper: VueWrapper | undefined

beforeEach(() => {
  state.list = []
  state.dataUrl = `data:image/png;base64,${png}`
  elementWidth = 400
  // jsdom has no canvas: text is half the font size wide per character, and every render is a fixed PNG.
  const context = {
    font: '',
    fillStyle: '',
    textBaseline: '',
    scale: vi.fn(),
    fillText: vi.fn(),
    measureText(text: string) { return { width: text.length * 0.5 * Number.parseInt(this.font) } },
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => `data:image/png;base64,${typedPng}`)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => elementWidth)
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { load: vi.fn().mockResolvedValue([]), ready: Promise.resolve() },
  })
})

afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup(props: Record<string, unknown> = {}) {
  wrapper = mount(SignatureSetup, { props: { name: 'Priya Ramaswamy', ...props }, global: { plugins: [ui] }, attachTo: document.body })
  return wrapper
}

const button = (w: VueWrapper, name: string) => {
  const found = w.findAll('button').find((b) => b.text() === name)
  if (!found) throw new Error(`No button "${name}"`)
  return found
}
const nameField = (w: VueWrapper) => w.get<HTMLInputElement>('input[type="text"]')
const radio = (w: VueWrapper, label: string) => w.get<HTMLInputElement>(`input[aria-label="${label}"]`)
const drawingArea = (w: VueWrapper) => w.get<HTMLCanvasElement>('canvas[aria-label="Signature drawing area"]')

async function startDrawing(w: VueWrapper) {
  await button(w, 'Draw it').trigger('click')
  await flushPromises()
  return state.list[0]!
}

it('emits image, kind, text and style together for a typed signature', async () => {
  const w = setup({ initialStyle: 2 })
  await nameField(w).setValue('  Priya R  ')
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toEqual([[{ kind: 'typed', image: typedPng, text: 'Priya R', style: 2 }]])
})

it('starts on Style 1 and changing the style changes the export', async () => {
  const w = setup()
  expect(radio(w, 'Style 1').element.checked).toBe(true)
  await radio(w, 'Style 3').setValue(true)
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toEqual([[{ kind: 'typed', image: typedPng, text: 'Priya Ramaswamy', style: 3 }]])
})

it('uses the action label it is given and shows Cancel only when cancellable', async () => {
  const w = setup({ actionLabel: 'Save signature', cancellable: true })
  expect(button(w, 'Save signature').exists()).toBe(true)
  await button(w, 'Cancel').trigger('click')
  expect(w.emitted('cancel')).toHaveLength(1)
  w.unmount()
  expect(setup().findAll('button').map((b) => b.text())).not.toContain('Cancel')
})

it('rejects a blank name: nothing emitted, message shown, field invalid and focused', async () => {
  const w = setup()
  await nameField(w).setValue('   ')
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toBeUndefined()
  expect(w.emitted('invalid')).toHaveLength(1)
  expect(w.text()).toContain('Type your name as you sign it.')
  expect(nameField(w).attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(nameField(w).element)
})

it('clears the name message when the person types', async () => {
  const w = setup({ name: '' })
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  await nameField(w).setValue('P')
  expect(w.text()).not.toContain('Type your name as you sign it.')
})

it('rejects a blank drawing: nothing emitted, message shown, canvas invalid and focused', async () => {
  const w = setup()
  await startDrawing(w)
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toBeUndefined()
  expect(w.emitted('invalid')).toHaveLength(1)
  expect(w.text()).toContain('Draw your signature in the box.')
  expect(drawingArea(w).attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(drawingArea(w).element)
})

it('uses a fixed 2.5px stroke and emits the drawn image as the record', async () => {
  const w = setup()
  const pad = await startDrawing(w)
  expect(pad.options).toMatchObject({ minWidth: 2.5, maxWidth: 2.5 })
  pad.stroke()
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toEqual([[{ kind: 'drawn', image: png }]])
})

it('removes the drawing message when drawing starts, and Clear drawing empties the pad', async () => {
  const w = setup()
  const pad = await startDrawing(w)
  expect(button(w, 'Clear drawing').attributes('disabled')).toBeDefined()
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  pad.stroke()
  await flushPromises()
  expect(w.text()).not.toContain('Draw your signature in the box.')
  await button(w, 'Clear drawing').trigger('click')
  expect(pad.isEmpty()).toBe(true)
  expect(button(w, 'Clear drawing').attributes('disabled')).toBeDefined()
})

it.each([
  ['not a PNG', 'data:image/jpeg;base64,/9j/4AAQ'],
  ['empty', ''],
  ['bytes that are not a PNG', 'data:image/png;base64,AAAAAAAAAAAA'],
])('does not emit a drawing the pad returns as %s', async (_label, dataUrl) => {
  const w = setup()
  const pad = await startDrawing(w)
  pad.stroke()
  state.dataUrl = dataUrl
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toBeUndefined()
  expect(w.emitted('invalid')).toHaveLength(1)
  expect(drawingArea(w).attributes('aria-invalid')).toBe('true')
})

it('does not emit a typed image that is not a PNG', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:,')
  const w = setup()
  await button(w, 'Use this signature').trigger('click')
  await flushPromises()
  expect(w.emitted('done')).toBeUndefined()
  expect(w.emitted('invalid')).toHaveLength(1)
})

it('gives switching to Draw it a blank pad each time', async () => {
  const w = setup()
  const first = await startDrawing(w)
  first.stroke()
  await button(w, 'Type it').trigger('click')
  await button(w, 'Draw it').trigger('click')
  await flushPromises()
  expect(state.list).toHaveLength(2)
  expect(state.list[1]!.isEmpty()).toBe(true)
})

it('shrinks a long typed name in the style previews to fit, never below 20px', async () => {
  elementWidth = 100
  const w = setup({ name: 'Priya Ramaswamy-Kingsley' })
  await flushPromises()
  const sizes = w.findAll('fieldset span').map((s) => (s.element as HTMLElement).style.fontSize)
  expect(sizes).toEqual(['20px', '20px', '20px'])
})
