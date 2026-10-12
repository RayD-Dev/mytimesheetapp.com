// Signatures (FR-20): typed in one of three styles the user picks, or drawn.
// All three fonts are SIL OFL and self-hosted (imported in main.ts).
export const signatureStyles = [
  { key: 'aurore', label: 'Style 1', family: '"La Belle Aurore", cursive' },
  { key: 'muellerhoff', label: 'Style 2', family: '"Herr Von Muellerhoff", cursive' },
  { key: 'delafield', label: 'Style 3', family: '"Mrs Saint Delafield", cursive' },
] as const

export type StyleKey = (typeof signatureStyles)[number]['key']
export type Signature = { kind: 'typed'; text: string; style: StyleKey } | { kind: 'drawn'; url: string }

export const familyOf = (key: StyleKey) => signatureStyles.find((s) => s.key === key)!.family
