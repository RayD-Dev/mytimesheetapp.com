export type PageWidth = 'wide' | 'narrow'

// Full class names, so Tailwind finds them when it scans the source.
export const pageWidthClass: Record<PageWidth, string> = {
  wide: 'max-w-5xl',
  narrow: 'max-w-3xl',
}
