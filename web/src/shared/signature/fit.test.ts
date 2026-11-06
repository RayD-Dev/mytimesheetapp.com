import { expect, it } from 'vitest'
import { fitFontSize } from './fit'

const widthOf = (characters: number) => (size: number) => characters * size * 0.5

it('keeps 32px when the text fits', () => {
  expect(fitFontSize(widthOf(10), 200)).toBe(32)
})

it('shrinks to the largest size that fits', () => {
  expect(fitFontSize(widthOf(10), 100)).toBe(20)
  expect(fitFontSize(widthOf(10), 125)).toBe(25)
})

it('stops at 20px even when the text still does not fit', () => {
  expect(fitFontSize(widthOf(100), 100)).toBe(20)
})
