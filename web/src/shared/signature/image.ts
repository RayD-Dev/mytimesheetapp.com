import { fitFontSize } from './fit'
import { maxImageLength } from './types'

const pngPrefix = 'data:image/png;base64,'
// The first eight bytes of every PNG, in base64.
const pngSignatureBase64 = 'iVBORw0KGgo'

/** Contract image (base64 PNG, no data URL prefix) from a canvas data URL, or null if it is not one. */
export function toSignatureImage(dataUrl: string): string | null {
  if (!dataUrl.startsWith(pngPrefix)) return null
  const image = dataUrl.slice(pngPrefix.length)
  if (!image.startsWith(pngSignatureBase64) || image.length > maxImageLength) return null
  return image
}

// FR-20: typed signatures are rendered at a fixed size so every one looks alike on a timesheet.
const imageWidth = 640
const imageHeight = 160
const sidePadding = 16

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  return ctx
}

export function measureText(text: string, family: string, fontSize: number): number {
  const ctx = context2d(document.createElement('canvas'))
  ctx.font = `${fontSize}px ${family}`
  return ctx.measureText(text).width
}

/** Renders the typed name to a PNG data URL, at the same fit rule as the preview. */
export async function renderTypedPng(text: string, family: string): Promise<string | null> {
  await document.fonts.load(`32px ${family}`, text)
  const canvas = document.createElement('canvas')
  canvas.width = imageWidth
  canvas.height = imageHeight
  const ctx = context2d(canvas)
  // The preview works in CSS pixels; the image is twice as large to stay sharp.
  const scale = 2
  const available = (imageWidth - 2 * sidePadding) / scale
  const fontSize = fitFontSize((size) => measureText(text, family, size), available)
  ctx.scale(scale, scale)
  ctx.font = `${fontSize}px ${family}`
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, sidePadding / scale, imageHeight / scale - 16)
  return toSignatureImage(canvas.toDataURL('image/png'))
}
