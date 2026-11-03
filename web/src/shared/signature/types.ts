// Must match Signature in contract/openapi.yaml (TypedSignature | DrawnSignature, minus savedAt).
// Replace with the generated type once codegen lands.
export type SignatureStyle = 1 | 2 | 3

export type SignatureValue =
  | { kind: 'typed'; image: string; text: string; style: SignatureStyle }
  | { kind: 'drawn'; image: string }

export const signatureStyles: ReadonlyArray<{ style: SignatureStyle; label: string; family: string }> = [
  { style: 1, label: 'Style 1', family: '"La Belle Aurore", cursive' },
  { style: 2, label: 'Style 2', family: '"Herr Von Muellerhoff", cursive' },
  { style: 3, label: 'Style 3', family: '"Mrs Saint Delafield", cursive' },
]

export const defaultStyle: SignatureStyle = 1

// Contract: SignatureImage and typed text lengths.
export const maxImageLength = 300_000
export const maxTextLength = 100
