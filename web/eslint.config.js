import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/shared/api/generated', '*.d.ts'] },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    // Every request goes through the one API client, which checks it against the contract.
    rules: { 'no-restricted-globals': ['error', { name: 'fetch', message: 'Use the generated client in src/shared/api.' }] },
  },
  { files: ['src/shared/api/client.ts', 'src/shared/api/client.test.ts'], rules: { 'no-restricted-globals': 'off' } },
)
