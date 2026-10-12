import './assets/main.css'
// Ledger direction fonts (DESIGN.md §4), self-hosted
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import Board from './Board.vue'
import { screens } from './mock'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: screens[0]?.href ?? '/board' },
    { path: '/board', component: Board },
    ...screens.map((s) => ({ path: s.path, component: s.component })),
  ],
})

createApp(App).use(router).use(ui).mount('#app')
