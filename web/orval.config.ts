import { defineConfig } from 'orval'

// codegen:check writes to a sibling folder at the same depth, so imports stay identical.
const out = `src/shared/api/${process.env.CODEGEN_DIR ?? 'generated'}`

export default defineConfig({
  api: {
    input: {
      target: '../contract/openapi.yaml',
      // Sign-in and change-password are page navigations, not fetch calls.
      filters: { mode: 'exclude', tags: ['navigation'] },
    },
    output: {
      client: 'fetch',
      mode: 'single',
      clean: true,
      target: `${out}/api.ts`,
      schemas: { path: `${out}/zod`, type: 'zod' },
      override: {
        mutator: { path: 'src/shared/api/client.ts', name: 'request' },
        // Orval passes each success response's zod schema to the mutator as `schema`.
        includeZodSchemaInArguments: true,
        fetch: { runtimeValidation: true, includeHttpResponseReturnType: true },
      },
    },
  },
})
