import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
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
