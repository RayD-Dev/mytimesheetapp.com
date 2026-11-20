import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      // Light only. DESIGN.md has no dark palette, so Nuxt UI must not follow the visitor's dark mode setting and show a half-themed page.
      colorMode: false,
      // Large buttons are 44px tall on phones and 36px on desktop, centred, on every screen.
      ui: { button: { variants: { size: { xl: { base: 'h-11 justify-center md:h-9' } } } } },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
