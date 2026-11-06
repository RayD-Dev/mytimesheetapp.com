export const maxFontSize = 32
export const minFontSize = 20

/** Largest font size from 32 down to 20 px at which the text still fits; 20 px if none does. */
export function fitFontSize(widthAt: (fontSize: number) => number, available: number): number {
  for (let size = maxFontSize; size > minFontSize; size--) {
    if (widthAt(size) <= available) return size
  }
  return minFontSize
}
