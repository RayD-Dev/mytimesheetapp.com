import { expect, it } from 'vitest'
import { toSignatureImage } from './image'
import { maxImageLength } from './types'

const png = 'iVBORw0KGgoAAAANSUhEUg'

it('returns the base64 PNG without the data URL prefix', () => {
  expect(toSignatureImage(`data:image/png;base64,${png}`)).toBe(png)
})

it.each([
  ['a JPEG data URL', `data:image/jpeg;base64,${png}`],
  ['no data URL prefix', png],
  ['bytes that are not a PNG', 'data:image/png;base64,AAAAAAAAAAAAAAAA'],
  ['an image over the contract limit', `data:image/png;base64,${png}${'A'.repeat(maxImageLength)}`],
  ['an empty string', ''],
])('rejects %s', (_label, dataUrl) => {
  expect(toSignatureImage(dataUrl)).toBeNull()
})
