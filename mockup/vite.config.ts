import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

// Throwaway mock-up. The theme below and the tokens in src/assets/main.css are the
// parts that move to the real app unchanged once the mock-up is approved.
export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: false,
      ui: {
        colors: { primary: 'blue', neutral: 'slate' }, // exact roles are pinned in main.css :root
        // House style: inputs at 16px so iOS doesn't zoom on focus
        input: { variants: { size: { md: { base: 'text-base' }, lg: { base: 'text-base' } } } },
        inputTime: { variants: { size: { md: { base: 'text-base' }, lg: { base: 'text-base' } } } },
        textarea: { variants: { size: { md: { base: 'text-base' }, lg: { base: 'text-base' } } } },
        // Close buttons big enough to hit on a phone (44px), without growing the toast or dialog header
        toast: { slots: { close: 'size-11 justify-center -my-2.5 -me-2.5' } },
        modal: { slots: { close: 'size-11 justify-center top-2.5 end-2.5' } },
        dropdownMenu: { slots: { item: 'min-h-11 md:min-h-8' } }, // menu rows tappable on phones
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }, // import from '@/parts/…' at any folder depth
  server: { port: 5180, host: true }, // host: open it on a phone on the same Wi-Fi
})
